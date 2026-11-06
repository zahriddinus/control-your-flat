-- Control Your Flat: uyning o'z vazifalari (masalan, "Idish yuvish", "Gul sug'orish").
-- Supabase -> SQL Editor'da bir marta ishga tushiriladi (hammasi bitta tranzaksiyada).
--
-- O'rnatilgan 3 ta vazifa (duty, rubbish, cleaning) avvalgidek: tartibi users jadvalidagi
-- duty_order / rubbish_order / cleaning_order ustunlarida. Yangi (custom) vazifalar
-- flat_tasks'da is_custom = true bo'ladi, tartibi esa task_orders jadvalida saqlanadi.
-- Bitta uyda ko'pi bilan 10 ta o'z vazifasi.

begin;

-- 1) VAZIFALAR JADVALI: nom, ikonka, rang, tartib

alter table public.flat_tasks drop constraint if exists flat_tasks_task_check;

alter table public.flat_tasks add column if not exists is_custom boolean not null default false;
alter table public.flat_tasks add column if not exists name text check (char_length(btrim(name)) between 1 and 40);
alter table public.flat_tasks add column if not exists icon text;
alter table public.flat_tasks add column if not exists color text;
alter table public.flat_tasks add column if not exists position smallint not null default 0;

alter table public.flat_tasks drop constraint if exists flat_tasks_custom_name_check;
alter table public.flat_tasks
  add constraint flat_tasks_custom_name_check check (not is_custom or name is not null);

-- Tarix va belgilar endi istalgan vazifa kaliti bilan
alter table public.duty_history drop constraint if exists duty_history_task_check;
alter table public.duty_done drop constraint if exists duty_done_task_check;


-- 2) O'Z VAZIFALARINING NAVBAT TARTIBI

create table if not exists public.task_orders (
  flat_id uuid not null,
  task text not null,
  user_id uuid not null references public.users (user_id) on delete cascade,
  position integer not null,
  primary key (flat_id, task, user_id),
  foreign key (flat_id, task) references public.flat_tasks (flat_id, task) on delete cascade
);

alter table public.task_orders enable row level security;

revoke all on public.task_orders from anon;
grant select, insert, update, delete on public.task_orders to authenticated;

drop policy if exists "Members read task orders" on public.task_orders;
create policy "Members read task orders" on public.task_orders
  for select to authenticated using (public.is_flat_member(flat_id));

drop policy if exists "Managers write task orders" on public.task_orders;
create policy "Managers write task orders" on public.task_orders
  for all to authenticated
  using (public.is_flat_manager(flat_id))
  with check (public.is_flat_manager(flat_id));


-- 3) NAVBATLARNI HISOBLASH: o'rnatilgan va o'z vazifalari birga

create or replace function public.compute_duty_schedule(p_flat uuid, target_date date)
returns json
language plpgsql
stable
set search_path = public
as $$
declare
  v_start date;
  v_total integer;
  v_days integer;
  v_turn integer;
  v_picked json;
  t record;
  result jsonb := jsonb_build_object(
    'date', target_date, 'duty', '[]'::jsonb, 'rubbish', '[]'::jsonb, 'cleaning', '[]'::jsonb
  );
begin
  select f.start_date into v_start from public.flats f where f.id = p_flat;

  if v_start is null then
    return result::json;
  end if;

  select count(*) into v_total from public.users u where u.flat_id = p_flat;
  v_days := target_date - v_start;

  if v_total = 0 or v_days < 0 then
    return result::json;
  end if;

  for t in
    select * from public.flat_tasks ft where ft.flat_id = p_flat and ft.enabled
  loop
    continue when v_days % t.every_days <> 0;

    v_turn := v_days / t.every_days;

    select coalesce(
      json_agg(json_build_object('user_id', p.user_id, 'name', p.name, 'last_name', p.last_name) order by p.k),
      '[]'::json
    )
    into v_picked
    from (
      select k, picked.*
      from generate_series(0, least(t.people, v_total) - 1) as k
      cross join lateral (
        select u.user_id, u.name, u.last_name
        from public.users u
        left join public.task_orders o
          on o.flat_id = p_flat and o.task = t.task and o.user_id = u.user_id
        where u.flat_id = p_flat
        order by
          case t.task
            when 'duty' then u.duty_order
            when 'rubbish' then u.rubbish_order
            when 'cleaning' then u.cleaning_order
            else o.position
          end nulls last,
          u.duty_order nulls last,
          u.user_id
        offset ((v_turn::bigint * t.people + k) % v_total)
        limit 1
      ) as picked
    ) as p;

    result := result || jsonb_build_object(t.task, v_picked::jsonb);
  end loop;

  return result::json;
end;
$$;

-- Tarixda bo'lsa tarixdan (har bir vazifa kaliti bo'yicha), bo'lmasa qoidalar bo'yicha
create or replace function public.get_duty_schedule(p_flat uuid, target_date date)
returns json
language plpgsql
stable
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.duty_history h where h.flat_id = p_flat and h.day = target_date
  ) then
    return public.compute_duty_schedule(p_flat, target_date);
  end if;

  return (
    jsonb_build_object(
      'date', target_date, 'duty', '[]'::jsonb, 'rubbish', '[]'::jsonb, 'cleaning', '[]'::jsonb
    )
    || coalesce(
      (
        select jsonb_object_agg(grouped.task, grouped.people)
        from (
          select h.task,
                 jsonb_agg(
                   jsonb_build_object('user_id', h.user_id, 'name', h.name, 'last_name', h.last_name)
                   order by h.position
                 ) as people
          from public.duty_history h
          where h.flat_id = p_flat and h.day = target_date
          group by h.task
        ) as grouped
      ),
      '{}'::jsonb
    )
  )::json;
end;
$$;

-- Tarixga yozish: natijadagi barcha vazifa kalitlari (date'dan boshqa)
create or replace function public.snapshot_duty_history(p_flat uuid)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_start date;
  v_today date := public.flat_today(p_flat);
  d date;
  s json;
  task_key text;
  item json;
  pos integer;
begin
  select f.start_date into v_start from public.flats f where f.id = p_flat;

  if v_start is null or v_start > v_today then
    return;
  end if;

  for d in select generate_series(v_start, v_today, interval '1 day')::date loop
    continue when exists (
      select 1 from public.duty_history h where h.flat_id = p_flat and h.day = d
    );

    s := public.compute_duty_schedule(p_flat, d);

    for task_key in select key from json_each(s) where key <> 'date' loop
      pos := 0;

      for item in select value from json_array_elements(s -> task_key) loop
        insert into public.duty_history (flat_id, day, task, position, user_id, name, last_name)
        values (p_flat, d, task_key, pos, (item ->> 'user_id')::uuid, item ->> 'name', item ->> 'last_name');

        pos := pos + 1;
      end loop;
    end loop;
  end loop;
end;
$$;


-- 4) TARTIBNI O'ZGARTIRISH: o'z vazifalari task_orders'da

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
  select u.flat_id into v_flat from public.users u where u.user_id = p_user_id;

  if v_flat is null or not public.is_flat_manager(v_flat) then
    raise exception 'not_owner';
  end if;

  -- O'z vazifasi
  if col is null then
    if not exists (select 1 from public.flat_tasks ft where ft.flat_id = v_flat and ft.task = p_task) then
      raise exception 'invalid_task';
    end if;

    perform public.snapshot_duty_history(v_flat);

    select o.position into old_order
    from public.task_orders o
    where o.flat_id = v_flat and o.task = p_task and o.user_id = p_user_id;

    select max(o.position) into max_order
    from public.task_orders o
    where o.flat_id = v_flat and o.task = p_task;

    p_new_order := greatest(1, least(p_new_order, max_order));

    if old_order is null or p_new_order = old_order then
      return;
    end if;

    if p_new_order < old_order then
      update public.task_orders set position = position + 1
      where flat_id = v_flat and task = p_task and position >= p_new_order and position < old_order;
    else
      update public.task_orders set position = position - 1
      where flat_id = v_flat and task = p_task and position > old_order and position <= p_new_order;
    end if;

    update public.task_orders set position = p_new_order
    where flat_id = v_flat and task = p_task and user_id = p_user_id;

    return;
  end if;

  -- O'rnatilgan vazifa (users ustuni)
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
  select u.flat_id into v_flat from public.users u where u.user_id = p_user_a;

  if v_flat is null
     or not public.is_flat_manager(v_flat)
     or not exists (select 1 from public.users u where u.user_id = p_user_b and u.flat_id = v_flat) then
    raise exception 'not_owner';
  end if;

  perform public.snapshot_duty_history(v_flat);

  if col is null then
    select o.position into order_a from public.task_orders o
    where o.flat_id = v_flat and o.task = p_task and o.user_id = p_user_a;
    select o.position into order_b from public.task_orders o
    where o.flat_id = v_flat and o.task = p_task and o.user_id = p_user_b;

    if order_a is null or order_b is null then
      raise exception 'invalid_task';
    end if;

    update public.task_orders set position = order_b
    where flat_id = v_flat and task = p_task and user_id = p_user_a;
    update public.task_orders set position = order_a
    where flat_id = v_flat and task = p_task and user_id = p_user_b;

    return;
  end if;

  execute format('select %1$I from public.users where user_id = $1', col) into order_a using p_user_a;
  execute format('select %1$I from public.users where user_id = $1', col) into order_b using p_user_b;

  execute format('update public.users set %1$I = $1 where user_id = $2', col) using order_b, p_user_a;
  execute format('update public.users set %1$I = $1 where user_id = $2', col) using order_a, p_user_b;
end;
$$;


-- 5) XONADOSH QO'SHILGANDA VA O'CHIRILGANDA: o'z vazifalari tartibi ham

-- Yangi xonadosh har bir o'z vazifasining oxiriga qo'shiladi
create or replace function public.add_resident_to_custom_tasks()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.task_orders (flat_id, task, user_id, position)
  select new.flat_id, ft.task, new.user_id,
         coalesce((select max(o.position) from public.task_orders o
                   where o.flat_id = new.flat_id and o.task = ft.task), 0) + 1
  from public.flat_tasks ft
  where ft.flat_id = new.flat_id and ft.is_custom;

  return new;
end;
$$;

drop trigger if exists users_add_to_custom_tasks on public.users;
create trigger users_add_to_custom_tasks
  after insert on public.users
  for each row execute function public.add_resident_to_custom_tasks();

-- O'chirilganda o'z vazifalaridagi bo'shliq yopiladi
create or replace function public.close_custom_task_gaps()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Vazifaning o'zi o'chirilayotgan bo'lsa (qatorlar u bilan birga o'chadi), hech narsa qilinmaydi
  if not exists (
    select 1 from public.flat_tasks ft where ft.flat_id = old.flat_id and ft.task = old.task
  ) then
    return old;
  end if;

  update public.task_orders
  set position = position - 1
  where flat_id = old.flat_id and task = old.task and position > old.position;

  return old;
end;
$$;

drop trigger if exists task_orders_close_gaps on public.task_orders;
create trigger task_orders_close_gaps
  after delete on public.task_orders
  for each row execute function public.close_custom_task_gaps();


-- 6) O'Z VAZIFASINI YARATISH, TAHRIRLASH VA O'CHIRISH (ega yoki boshqaruvchi)

create or replace function public.create_task(
  p_flat uuid,
  p_name text,
  p_icon text,
  p_color text,
  p_every_days integer,
  p_people integer
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text := 't' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
begin
  if not public.is_flat_manager(p_flat) then
    raise exception 'not_owner';
  end if;

  if (select count(*) from public.flat_tasks ft where ft.flat_id = p_flat and ft.is_custom) >= 10 then
    raise exception 'too_many_tasks';
  end if;

  perform public.snapshot_duty_history(p_flat);

  insert into public.flat_tasks (flat_id, task, enabled, every_days, people, is_custom, name, icon, color, position)
  values (
    p_flat, v_key, true,
    greatest(1, least(p_every_days, 31)),
    greatest(1, least(p_people, 4)),
    true, btrim(p_name), p_icon, p_color,
    coalesce((select max(ft.position) from public.flat_tasks ft where ft.flat_id = p_flat), 0) + 1
  );

  -- Boshlang'ich tartib - navbatchilik tartibi bilan bir xil
  insert into public.task_orders (flat_id, task, user_id, position)
  select p_flat, v_key, u.user_id,
         row_number() over (order by u.duty_order nulls last, u.user_id)
  from public.users u
  where u.flat_id = p_flat;

  return v_key;
end;
$$;

-- Nom, ikonka, rang (navbatlarga ta'sir qilmaydi)
create or replace function public.update_task_info(p_flat uuid, p_task text, p_name text, p_icon text, p_color text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_flat_manager(p_flat) then
    raise exception 'not_owner';
  end if;

  update public.flat_tasks
  set name = btrim(p_name), icon = p_icon, color = p_color
  where flat_id = p_flat and task = p_task and is_custom;

  if not found then
    raise exception 'task_not_found';
  end if;
end;
$$;

-- O'chirish: vazifa, uning tartibi, tarixi va belgilari
create or replace function public.delete_task(p_flat uuid, p_task text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_flat_manager(p_flat) then
    raise exception 'not_owner';
  end if;

  if not exists (
    select 1 from public.flat_tasks ft where ft.flat_id = p_flat and ft.task = p_task and ft.is_custom
  ) then
    raise exception 'task_not_found';
  end if;

  delete from public.flat_tasks where flat_id = p_flat and task = p_task;

  delete from public.duty_history where flat_id = p_flat and task = p_task;
  delete from public.duty_done where flat_id = p_flat and task = p_task;
end;
$$;


-- 7) KIM CHAQIRA OLADI

revoke execute on function
  public.add_resident_to_custom_tasks(),
  public.close_custom_task_gaps(),
  public.create_task(uuid, text, text, text, integer, integer),
  public.update_task_info(uuid, text, text, text, text),
  public.delete_task(uuid, text)
from public, anon;

grant execute on function
  public.create_task(uuid, text, text, text, integer, integer),
  public.update_task_info(uuid, text, text, text, text),
  public.delete_task(uuid, text)
to authenticated, service_role;

commit;
