-- Control Your Flat: ikkinchi boshqaruvchi va egalikni o'tkazish.
-- Supabase -> SQL Editor'da bir marta ishga tushiriladi (hammasi bitta tranzaksiyada).
--
-- Rollar (flat_members.role):
--   owner  - uy egasi: hammasi + uyni o'chirish, egalikni o'tkazish, boshqaruvchilarni tayinlash
--   admin  - boshqaruvchi: xonadoshlar, navbatlar, qoidalar, takliflar (ega kabi)
--   member - a'zo: ko'radi va o'z navbatini belgilaydi
--
-- Egalik o'tkazilganda eski ega boshqaruvchi bo'lib qoladi.

begin;

-- 1) YANGI ROL

alter table public.flat_members drop constraint if exists flat_members_role_check;
alter table public.flat_members
  add constraint flat_members_role_check check (role in ('owner', 'admin', 'member'));

-- Ega yoki boshqaruvchi
create or replace function public.is_flat_manager(p_flat uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.flat_members m
    where m.flat_id = p_flat and m.auth_user_id = auth.uid() and m.role in ('owner', 'admin')
  );
$$;


-- 2) QOIDALAR: boshqarish endi ega va boshqaruvchilarga

drop policy if exists "Owners read invites" on public.invites;
drop policy if exists "Owners delete invites" on public.invites;
drop policy if exists "Owners add residents" on public.users;
drop policy if exists "Owners update residents" on public.users;
drop policy if exists "Owners delete residents" on public.users;
drop policy if exists "Owners write history" on public.duty_history;
drop policy if exists "Owners remove members, members leave" on public.flat_members;

create policy "Managers read invites" on public.invites
  for select to authenticated using (public.is_flat_manager(flat_id));
create policy "Managers delete invites" on public.invites
  for delete to authenticated using (public.is_flat_manager(flat_id));

create policy "Managers add residents" on public.users
  for insert to authenticated with check (public.is_flat_manager(flat_id));
create policy "Managers update residents" on public.users
  for update to authenticated
  using (public.is_flat_manager(flat_id))
  with check (public.is_flat_manager(flat_id));
create policy "Managers delete residents" on public.users
  for delete to authenticated using (public.is_flat_manager(flat_id));

create policy "Managers write history" on public.duty_history
  for insert to authenticated with check (public.is_flat_manager(flat_id));

-- Kim kimni uydan chiqara oladi: o'zi chiqib ketadi (egadan boshqa),
-- boshqaruvchi a'zoni, ega esa boshqaruvchini ham chiqaradi
create policy "Leave or remove members" on public.flat_members
  for delete to authenticated
  using (
    (auth_user_id = auth.uid() and role <> 'owner')
    or (role = 'member' and public.is_flat_manager(flat_id))
    or (role = 'admin' and public.is_flat_owner(flat_id))
  );


-- 3) BOSHQARUV FUNKSIYALARI (ega yoki boshqaruvchi)

create or replace function public.move_user_in_order(p_task text, p_user_id uuid, p_new_order integer)
returns void
language plpgsql
set search_path = public
as $$
declare
  col text := public.task_order_column(p_task);
  v_flat uuid;
  old_order integer;
  max_order integer;
begin
  if col is null then
    raise exception 'invalid_task';
  end if;

  select u.flat_id into v_flat from public.users u where u.user_id = p_user_id;

  if v_flat is null or not public.is_flat_manager(v_flat) then
    raise exception 'not_owner';
  end if;

  perform public.snapshot_duty_history(v_flat);

  execute format('select %1$I from public.users where user_id = $1', col)
    into old_order using p_user_id;
  execute format('select max(%1$I) from public.users where flat_id = $1', col)
    into max_order using v_flat;

  p_new_order := greatest(1, least(p_new_order, max_order));

  if old_order is null or p_new_order = old_order then
    return;
  end if;

  execute format('update public.users set %1$I = -2147483000 where user_id = $1', col)
    using p_user_id;

  if p_new_order < old_order then
    execute format(
      'update public.users set %1$I = -(%1$I + 1) where flat_id = $3 and %1$I >= $1 and %1$I < $2', col
    ) using p_new_order, old_order, v_flat;
  else
    execute format(
      'update public.users set %1$I = -(%1$I - 1) where flat_id = $3 and %1$I > $1 and %1$I <= $2', col
    ) using old_order, p_new_order, v_flat;
  end if;

  execute format(
    'update public.users set %1$I = -%1$I where flat_id = $1 and %1$I < 0 and %1$I > -2147483000', col
  ) using v_flat;
  execute format('update public.users set %1$I = $1 where user_id = $2', col)
    using p_new_order, p_user_id;
end;
$$;

create or replace function public.swap_users_in_order(p_task text, p_user_a uuid, p_user_b uuid)
returns void
language plpgsql
set search_path = public
as $$
declare
  col text := public.task_order_column(p_task);
  v_flat uuid;
  order_a integer;
  order_b integer;
begin
  if col is null then
    raise exception 'invalid_task';
  end if;

  select u.flat_id into v_flat from public.users u where u.user_id = p_user_a;

  if v_flat is null
     or not public.is_flat_manager(v_flat)
     or not exists (select 1 from public.users u where u.user_id = p_user_b and u.flat_id = v_flat) then
    raise exception 'not_owner';
  end if;

  perform public.snapshot_duty_history(v_flat);

  execute format('select %1$I from public.users where user_id = $1', col) into order_a using p_user_a;
  execute format('select %1$I from public.users where user_id = $1', col) into order_b using p_user_b;

  execute format('update public.users set %1$I = $1 where user_id = $2', col) using order_b, p_user_a;
  execute format('update public.users set %1$I = $1 where user_id = $2', col) using order_a, p_user_b;
end;
$$;

create or replace function public.add_user(p_flat uuid, p_user jsonb, p_duty_order integer default null)
returns integer
language plpgsql
set search_path = public
as $$
declare
  max_duty integer;
  new_order integer;
begin
  if not public.is_flat_manager(p_flat) then
    raise exception 'not_owner';
  end if;

  if (select count(*) from public.users u where u.flat_id = p_flat) >= 30 then
    raise exception 'too_many_residents';
  end if;

  perform public.snapshot_duty_history(p_flat);

  select coalesce(max(duty_order), 0) into max_duty from public.users where flat_id = p_flat;

  new_order := case
    when p_duty_order is null or p_duty_order < 1 or p_duty_order > max_duty then max_duty + 1
    else p_duty_order
  end;

  update public.users set duty_order = -(duty_order + 1) where flat_id = p_flat and duty_order >= new_order;
  update public.users set duty_order = -duty_order where flat_id = p_flat and duty_order < 0;

  insert into public.users (
    flat_id, role, name, last_name, age, nickname, phone_number, email,
    duty_order, rubbish_order, cleaning_order
  )
  values (
    p_flat,
    'user',
    p_user ->> 'name',
    p_user ->> 'last_name',
    nullif(p_user ->> 'age', '')::integer,
    p_user ->> 'nickname',
    p_user ->> 'phone_number',
    p_user ->> 'email',
    new_order,
    (select coalesce(max(rubbish_order), 0) + 1 from public.users where flat_id = p_flat),
    (select coalesce(max(cleaning_order), 0) + 1 from public.users where flat_id = p_flat)
  );

  return new_order;
end;
$$;

create or replace function public.update_flat(p_flat uuid, p_patch jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_flat_manager(p_flat) then
    raise exception 'not_owner';
  end if;

  if p_patch ? 'timezone'
     and not exists (select 1 from pg_timezone_names where name = p_patch ->> 'timezone') then
    raise exception 'invalid_timezone';
  end if;

  if p_patch ? 'start_date' or p_patch ? 'timezone' then
    perform public.snapshot_duty_history(p_flat);
  end if;

  update public.flats f set
    name = case when p_patch ? 'name' then btrim(p_patch ->> 'name') else f.name end,
    start_date = case when p_patch ? 'start_date' then (p_patch ->> 'start_date')::date else f.start_date end,
    timezone = case when p_patch ? 'timezone' then p_patch ->> 'timezone' else f.timezone end,
    latitude = case when p_patch ? 'latitude' then (p_patch ->> 'latitude')::double precision else f.latitude end,
    longitude = case when p_patch ? 'longitude' then (p_patch ->> 'longitude')::double precision else f.longitude end,
    address = case when p_patch ? 'address' then nullif(btrim(p_patch ->> 'address'), '') else f.address end
  where f.id = p_flat;
end;
$$;

create or replace function public.update_flat_task(
  p_flat uuid,
  p_task text,
  p_enabled boolean,
  p_every_days integer,
  p_people integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_flat_manager(p_flat) then
    raise exception 'not_owner';
  end if;

  perform public.snapshot_duty_history(p_flat);

  insert into public.flat_tasks (flat_id, task, enabled, every_days, people)
  values (p_flat, p_task, p_enabled, p_every_days, p_people)
  on conflict (flat_id, task) do update
    set enabled = excluded.enabled,
        every_days = excluded.every_days,
        people = excluded.people;
end;
$$;

create or replace function public.create_invite(p_resident_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_flat uuid;
  v_code text;
begin
  select u.flat_id into v_flat from public.users u where u.user_id = p_resident_id;

  if v_flat is null or not public.is_flat_manager(v_flat) then
    raise exception 'not_owner';
  end if;

  if exists (select 1 from public.flat_members m where m.flat_id = v_flat and m.resident_id = p_resident_id) then
    raise exception 'already_linked';
  end if;

  delete from public.invites i where i.resident_id = p_resident_id and i.used_at is null;

  insert into public.invites (flat_id, resident_id, created_by)
  values (v_flat, p_resident_id, auth.uid())
  returning code into v_code;

  return v_code;
end;
$$;

create or replace function public.mark_task_done(p_flat uuid, p_task text, p_user_id uuid default null)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := public.flat_today(p_flat);
  v_mine uuid;
  v_user uuid;
  result timestamptz;
begin
  select m.resident_id into v_mine
  from public.flat_members m
  where m.flat_id = p_flat and m.auth_user_id = auth.uid();

  v_user := coalesce(p_user_id, v_mine);

  if v_user is null or (v_user is distinct from v_mine and not public.is_flat_manager(p_flat)) then
    raise exception 'not_allowed';
  end if;

  if not public.is_assigned_today(p_flat, p_task, v_user) then
    raise exception 'not_assigned_today';
  end if;

  insert into public.duty_done (flat_id, day, task, user_id)
  values (p_flat, v_today, p_task, v_user)
  on conflict (flat_id, day, task, user_id) do nothing;

  select d.done_at into result
  from public.duty_done d
  where d.flat_id = p_flat and d.day = v_today and d.task = p_task and d.user_id = v_user;

  return result;
end;
$$;

create or replace function public.unmark_task_done(p_flat uuid, p_task text, p_user_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mine uuid;
  v_user uuid;
begin
  select m.resident_id into v_mine
  from public.flat_members m
  where m.flat_id = p_flat and m.auth_user_id = auth.uid();

  v_user := coalesce(p_user_id, v_mine);

  if v_user is null or (v_user is distinct from v_mine and not public.is_flat_manager(p_flat)) then
    raise exception 'not_allowed';
  end if;

  delete from public.duty_done d
  where d.flat_id = p_flat and d.day = public.flat_today(p_flat) and d.task = p_task and d.user_id = v_user;
end;
$$;

-- O'chirish: ega xonadoshini o'chirib bo'lmaydi, boshqaruvchi xonadoshini faqat ega o'chiradi
create or replace function public.delete_user_and_shift(p_user_id uuid)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_flat uuid;
  v_role text;
  v_duty integer;
  v_rubbish integer;
  v_cleaning integer;
begin
  select u.flat_id into v_flat from public.users u where u.user_id = p_user_id;

  if v_flat is null or not public.is_flat_manager(v_flat) then
    raise exception 'not_owner';
  end if;

  select m.role into v_role
  from public.flat_members m
  where m.flat_id = v_flat and m.resident_id = p_user_id;

  if v_role = 'owner' then
    raise exception 'cannot_delete_owner';
  elsif v_role = 'admin' and not public.is_flat_owner(v_flat) then
    raise exception 'not_owner';
  end if;

  perform public.snapshot_duty_history(v_flat);

  delete from public.flat_members m where m.flat_id = v_flat and m.resident_id = p_user_id;

  delete from public.users
  where user_id = p_user_id
  returning duty_order, rubbish_order, cleaning_order into v_duty, v_rubbish, v_cleaning;

  update public.users set duty_order = -(duty_order - 1) where flat_id = v_flat and duty_order > v_duty;
  update public.users set duty_order = -duty_order where flat_id = v_flat and duty_order < 0;

  if v_rubbish is not null then
    update public.users set rubbish_order = -(rubbish_order - 1) where flat_id = v_flat and rubbish_order > v_rubbish;
    update public.users set rubbish_order = -rubbish_order where flat_id = v_flat and rubbish_order < 0;
  end if;

  if v_cleaning is not null then
    update public.users set cleaning_order = -(cleaning_order - 1) where flat_id = v_flat and cleaning_order > v_cleaning;
    update public.users set cleaning_order = -cleaning_order where flat_id = v_flat and cleaning_order < 0;
  end if;
end;
$$;


-- 4) ROLNI O'ZGARTIRISH VA EGALIKNI O'TKAZISH (faqat ega)

-- A'zoni boshqaruvchi qilish yoki boshqaruvchini oddiy a'zoga qaytarish
create or replace function public.set_member_role(p_flat uuid, p_auth_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_flat_owner(p_flat) then
    raise exception 'not_owner';
  end if;

  if p_role not in ('admin', 'member') then
    raise exception 'invalid_role';
  end if;

  update public.flat_members
  set role = p_role
  where flat_id = p_flat and auth_user_id = p_auth_user_id and role <> 'owner';

  if not found then
    raise exception 'member_not_found';
  end if;
end;
$$;

-- Egalikni boshqa a'zoga berish. Eski ega boshqaruvchi bo'lib qoladi
create or replace function public.transfer_ownership(p_flat uuid, p_auth_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_flat_owner(p_flat) then
    raise exception 'not_owner';
  end if;

  if p_auth_user_id = auth.uid() then
    raise exception 'already_owner';
  end if;

  update public.flat_members
  set role = 'owner'
  where flat_id = p_flat and auth_user_id = p_auth_user_id;

  if not found then
    raise exception 'member_not_found';
  end if;

  update public.flat_members
  set role = 'admin'
  where flat_id = p_flat and auth_user_id = auth.uid();
end;
$$;


-- 5) KIM CHAQIRA OLADI

revoke execute on function
  public.is_flat_manager(uuid),
  public.set_member_role(uuid, uuid, text),
  public.transfer_ownership(uuid, uuid)
from public, anon;

grant execute on function
  public.is_flat_manager(uuid),
  public.set_member_role(uuid, uuid, text),
  public.transfer_ownership(uuid, uuid)
to authenticated, service_role;

commit;
