-- Control Your Flat: bitta uydan ko'p uyli platformaga o'tish.
-- Supabase -> SQL Editor'da bir marta ishga tushiriladi (hammasi bitta tranzaksiyada:
-- biror joyda xato bo'lsa, hech narsa o'zgarmaydi).
--
-- Asosiy g'oya:
--   flats         - uy (nomi, navbatlar boshlanish sanasi, vaqt mintaqasi, joylashuvi)
--   flat_members  - qaysi hisob (auth.users) qaysi uyga a'zo: 'owner' yoki 'member'.
--                   resident_id - bu hisob uydagi qaysi xonadosh (users qatori)
--   flat_tasks    - har bir uyning navbat qoidalari: yoqilgan, necha kunda, necha kishi
--   invites       - xonadoshni o'z hisobi bilan qo'shish uchun taklif havolalari
--   users         - xonadoshlar (endi flat_id bilan), duty_history va duty_done ham uyga bog'langan
--
-- Ko'rinish qoidasi (RLS): har kim faqat o'zi a'zo bo'lgan uylarning ma'lumotini ko'radi.
-- Boshqarish (xonadosh qo'shish, tartib, qoidalar, taklif) - faqat uy egasi.
-- Mehmon (login qilmagan) hech narsa ko'rmaydi, faqat taklif havolasining qisqa ma'lumotini.
--
-- Hozirgi ma'lumotlar "Sergeli" degan birinchi uyga ko'chiriladi, egasi - hozirgi admin.
-- Zaxira nusxa: backup sxemasida (backup.users_20261107 va boshqalar).

begin;

-- 0) ZAXIRA NUSXA

create schema if not exists backup;
revoke all on schema backup from anon, authenticated;

create table if not exists backup.users_20261107 as select * from public.users;
create table if not exists backup.duty_history_20261107 as select * from public.duty_history;
create table if not exists backup.duty_done_20261107 as select * from public.duty_done;

-- Ko'chirishdan oldingi navbatlar: keyin yangi funksiya bilan solishtirish uchun
create table if not exists backup.schedule_20261107 as
select d::date as day, public.get_duty_schedule(d::date)::jsonb as schedule
from generate_series(
  date '2026-09-01',
  (now() at time zone 'Asia/Tashkent')::date + 60,
  interval '1 day'
) as d;


-- 1) ESKI QOIDALAR VA KERAKSIZ NARSALARNI OLIB TASHLASH

drop policy if exists "Allow public select users" on public.users;
drop policy if exists "Authenticated users can read all users" on public.users;
drop policy if exists "Only admins can delete users" on public.users;
drop policy if exists "Users can insert own profile or admins can insert" on public.users;
drop policy if exists "Users can read own profile" on public.users;
drop policy if exists "Users can update own profile or admins can update" on public.users;
drop policy if exists "Admins can write duty history" on public.duty_history;
drop policy if exists "Anyone can read duty history" on public.duty_history;
drop policy if exists "Anyone can read duty done" on public.duty_done;

-- Eski funksiyalar (yangilari boshqa parametrlar bilan pastda yaratiladi)
drop function if exists public.shift_users_for_insert(integer);
drop function if exists public.shift_users_after_delete(integer);
drop function if exists public.move_user_to_order(uuid, integer);
drop function if exists public.get_duty_schedule_range(date, date);
drop function if exists public.get_duty_schedule(date);
drop function if exists public.compute_duty_schedule(date);
drop function if exists public.snapshot_duty_history();
drop function if exists public.move_user_in_order(text, uuid, integer);
drop function if exists public.swap_users_in_order(text, uuid, uuid);
drop function if exists public.add_user(jsonb, integer);
drop function if exists public.delete_user_and_shift(uuid);
drop function if exists public.mark_task_done(text, uuid);
drop function if exists public.unmark_task_done(text, uuid);
drop function if exists public.is_assigned_today(text, uuid);
drop function if exists public.is_admin();

-- Eski Telegram funksiyasidan qolgan, RLS'siz (hamma yoza oladigan) jadval
drop table if exists public.telegram_notification_logs;


-- 2) YANGI JADVALLAR

create table public.flats (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 60),
  start_date date not null,
  timezone text not null default 'Asia/Tashkent',
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  address text check (char_length(address) <= 200),
  telegram_chat_id text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.flat_members (
  flat_id uuid not null references public.flats (id) on delete cascade,
  auth_user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  resident_id uuid references public.users (user_id) on delete set null,
  joined_at timestamptz not null default now(),
  primary key (flat_id, auth_user_id)
);

-- Bitta xonadosh faqat bitta hisobga ulanadi
create unique index flat_members_resident_key
  on public.flat_members (flat_id, resident_id)
  where resident_id is not null;

create index flat_members_user_idx on public.flat_members (auth_user_id);

create table public.flat_tasks (
  flat_id uuid not null references public.flats (id) on delete cascade,
  task text not null check (task in ('duty', 'rubbish', 'cleaning')),
  enabled boolean not null default true,
  every_days smallint not null check (every_days between 1 and 31),
  people smallint not null check (people between 1 and 4),
  primary key (flat_id, task)
);

create table public.invites (
  code text primary key default replace(gen_random_uuid()::text, '-', ''),
  flat_id uuid not null references public.flats (id) on delete cascade,
  resident_id uuid not null references public.users (user_id) on delete cascade,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  used_by uuid references auth.users (id) on delete set null,
  used_at timestamptz
);

create index invites_flat_idx on public.invites (flat_id);


-- 3) MAVJUD JADVALLARNI UYGA BOG'LASH

alter table public.users add column if not exists flat_id uuid references public.flats (id) on delete cascade;
alter table public.duty_history add column if not exists flat_id uuid references public.flats (id) on delete cascade;
alter table public.duty_done add column if not exists flat_id uuid references public.flats (id) on delete cascade;


-- 4) HOZIRGI MA'LUMOTLARNI "SERGELI" UYIGA KO'CHIRISH

do $$
declare
  v_flat uuid;
  v_owner uuid;
begin
  -- Hozirgi admin: users.user_id = auth.users.id va role = 'admin'
  select u.user_id into v_owner
  from public.users u
  join auth.users a on a.id = u.user_id
  where u.role = 'admin'
  order by u.created_at
  limit 1;

  if v_owner is null then
    raise exception 'Admin topilmadi: ko''chirish to''xtatildi';
  end if;

  insert into public.flats (name, start_date, timezone, latitude, longitude, address, created_by)
  values ('Sergeli', date '2026-09-01', 'Asia/Tashkent', 41.22, 69.22, 'Toshkent, Sergeli', v_owner)
  returning id into v_flat;

  update public.users set flat_id = v_flat where flat_id is null;
  update public.duty_history set flat_id = v_flat where flat_id is null;
  update public.duty_done set flat_id = v_flat where flat_id is null;

  insert into public.flat_members (flat_id, auth_user_id, role, resident_id)
  values (v_flat, v_owner, 'owner', v_owner);

  -- Hozirgi qoidalar: navbatchi har kuni, musor har 3 kunda, uborka har 7 kunda juftlikda
  insert into public.flat_tasks (flat_id, task, enabled, every_days, people)
  values (v_flat, 'duty', true, 1, 1),
         (v_flat, 'rubbish', true, 3, 1),
         (v_flat, 'cleaning', true, 7, 2);
end;
$$;

alter table public.users alter column flat_id set not null;
alter table public.duty_history alter column flat_id set not null;
alter table public.duty_done alter column flat_id set not null;

-- Tarix va belgilar endi har bir uy uchun alohida
alter table public.duty_history drop constraint if exists duty_history_pkey;
alter table public.duty_history add primary key (flat_id, day, task, position);

alter table public.duty_done drop constraint if exists duty_done_pkey;
alter table public.duty_done add primary key (flat_id, day, task, user_id);

create index if not exists users_flat_idx on public.users (flat_id);


-- 5) YORDAMCHI FUNKSIYALAR (RLS ichida ishlatiladi)

create or replace function public.is_flat_member(p_flat uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.flat_members m
    where m.flat_id = p_flat and m.auth_user_id = auth.uid()
  );
$$;

create or replace function public.is_flat_owner(p_flat uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.flat_members m
    where m.flat_id = p_flat and m.auth_user_id = auth.uid() and m.role = 'owner'
  );
$$;

-- Uyning "bugun"i - uning vaqt mintaqasi bo'yicha
create or replace function public.flat_today(p_flat uuid)
returns date
language sql
stable
security definer
set search_path = public
as $$
  select (now() at time zone coalesce(f.timezone, 'Asia/Tashkent'))::date
  from public.flats f
  where f.id = p_flat;
$$;


-- 6) HUQUQLAR VA RLS

-- Mehmon (anon) jadvallarga umuman tegmaydi
revoke all on public.users, public.duty_history, public.duty_done from anon;
revoke all on public.flats, public.flat_members, public.flat_tasks, public.invites from anon;

grant select, insert, update, delete on public.users to authenticated;
grant select, insert on public.duty_history to authenticated;
grant select on public.duty_done to authenticated;
grant select, delete on public.flats to authenticated;
grant select, delete on public.flat_members to authenticated;
grant select on public.flat_tasks to authenticated;
grant select, delete on public.invites to authenticated;

alter table public.flats enable row level security;
alter table public.flat_members enable row level security;
alter table public.flat_tasks enable row level security;
alter table public.invites enable row level security;
alter table public.users enable row level security;
alter table public.duty_history enable row level security;
alter table public.duty_done enable row level security;

-- Uylar: a'zolar ko'radi, egasi o'chiradi. Yaratish va tahrirlash - funksiyalar orqali
create policy "Members read their flats" on public.flats
  for select to authenticated using (public.is_flat_member(id));
create policy "Owners delete their flats" on public.flats
  for delete to authenticated using (public.is_flat_owner(id));

-- A'zolar: bir-birini ko'radi. Egasi a'zoni chiqaradi, a'zo o'zi chiqib ketadi
create policy "Members read members" on public.flat_members
  for select to authenticated using (public.is_flat_member(flat_id));
create policy "Owners remove members, members leave" on public.flat_members
  for delete to authenticated
  using (role = 'member' and (public.is_flat_owner(flat_id) or auth_user_id = auth.uid()));

create policy "Members read tasks" on public.flat_tasks
  for select to authenticated using (public.is_flat_member(flat_id));

create policy "Owners read invites" on public.invites
  for select to authenticated using (public.is_flat_owner(flat_id));
create policy "Owners delete invites" on public.invites
  for delete to authenticated using (public.is_flat_owner(flat_id));

-- Xonadoshlar: a'zolar ko'radi, faqat egasi o'zgartiradi
create policy "Members read residents" on public.users
  for select to authenticated using (public.is_flat_member(flat_id));
create policy "Owners add residents" on public.users
  for insert to authenticated with check (public.is_flat_owner(flat_id));
create policy "Owners update residents" on public.users
  for update to authenticated
  using (public.is_flat_owner(flat_id))
  with check (public.is_flat_owner(flat_id));
create policy "Owners delete residents" on public.users
  for delete to authenticated using (public.is_flat_owner(flat_id));

create policy "Members read history" on public.duty_history
  for select to authenticated using (public.is_flat_member(flat_id));
create policy "Owners write history" on public.duty_history
  for insert to authenticated with check (public.is_flat_owner(flat_id));

create policy "Members read done marks" on public.duty_done
  for select to authenticated using (public.is_flat_member(flat_id));


-- 7) NAVBATLAR: qoidalar bo'yicha hisoblash
-- Natija: { date, duty: [...], rubbish: [...], cleaning: [...] }, har biri [{ user_id, name, last_name }]

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

    -- Har navbatda "people" kishi, tartib bo'yicha aylanib
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
        where u.flat_id = p_flat
        order by
          case t.task
            when 'duty' then u.duty_order
            when 'rubbish' then u.rubbish_order
            else u.cleaning_order
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

-- Saytga: tarixda bo'lsa tarixdan (o'tgan kunlar o'zgarmaydi), bo'lmasa qoidalar bo'yicha
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

  return json_build_object(
    'date', target_date,
    'duty', coalesce((
      select json_agg(json_build_object('user_id', h.user_id, 'name', h.name, 'last_name', h.last_name) order by h.position)
      from public.duty_history h
      where h.flat_id = p_flat and h.day = target_date and h.task = 'duty'
    ), '[]'::json),
    'rubbish', coalesce((
      select json_agg(json_build_object('user_id', h.user_id, 'name', h.name, 'last_name', h.last_name) order by h.position)
      from public.duty_history h
      where h.flat_id = p_flat and h.day = target_date and h.task = 'rubbish'
    ), '[]'::json),
    'cleaning', coalesce((
      select json_agg(json_build_object('user_id', h.user_id, 'name', h.name, 'last_name', h.last_name) order by h.position)
      from public.duty_history h
      where h.flat_id = p_flat and h.day = target_date and h.task = 'cleaning'
    ), '[]'::json)
  );
end;
$$;

-- Bir so'rovda oraliq (ko'pi bilan 62 kun)
create or replace function public.get_duty_schedule_range(p_flat uuid, start_date date, end_date date)
returns json
language sql
stable
set search_path = public
as $$
  select coalesce(json_agg(public.get_duty_schedule(p_flat, day::date) order by day), '[]'::json)
  from generate_series(start_date, least(end_date, start_date + 61), interval '1 day') as day;
$$;

-- Tartib yoki qoidalar o'zgarishidan oldin: boshlanishdan bugungacha hali yozilmagan kunlar tarixga
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

    foreach task_key in array array['duty', 'rubbish', 'cleaning'] loop
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


-- 8) TARTIBNI O'ZGARTIRISH (faqat egasi; hammasi o'sha uy ichida)
-- Raqamlar vaqtincha manfiy qilinadi, shunda bir xil raqamlar to'qnashmaydi

create or replace function public.task_order_column(p_task text)
returns text
language sql
immutable
as $$
  select case p_task
    when 'duty' then 'duty_order'
    when 'rubbish' then 'rubbish_order'
    when 'cleaning' then 'cleaning_order'
  end;
$$;

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

  if v_flat is null or not public.is_flat_owner(v_flat) then
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
     or not public.is_flat_owner(v_flat)
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

-- Yangi xonadosh. p_duty_order bo'sh bo'lsa - oxiriga. Qaytaradi: navbatchilik tartibidagi o'rni
create or replace function public.add_user(p_flat uuid, p_user jsonb, p_duty_order integer default null)
returns integer
language plpgsql
set search_path = public
as $$
declare
  max_duty integer;
  new_order integer;
begin
  if not public.is_flat_owner(p_flat) then
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

-- O'chirish: avval tarix yoziladi, keyin uchala tartibdagi bo'shliq yopiladi.
-- Uy egasining o'zini o'chirib bo'lmaydi; a'zoning hisobi uydan chiqariladi
create or replace function public.delete_user_and_shift(p_user_id uuid)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_flat uuid;
  v_duty integer;
  v_rubbish integer;
  v_cleaning integer;
begin
  select u.flat_id into v_flat from public.users u where u.user_id = p_user_id;

  if v_flat is null or not public.is_flat_owner(v_flat) then
    raise exception 'not_owner';
  end if;

  if exists (
    select 1 from public.flat_members m
    where m.flat_id = v_flat and m.resident_id = p_user_id and m.role = 'owner'
  ) then
    raise exception 'cannot_delete_owner';
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


-- 9) UY YARATISH VA SOZLASH

-- Yangi uy: egasining o'z xonadosh qatori, a'zoligi va standart qoidalar bilan birga
create or replace function public.create_flat(
  p_name text,
  p_start_date date,
  p_owner jsonb,
  p_timezone text default 'Asia/Tashkent',
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_address text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_flat uuid;
  v_resident uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if (select count(*) from public.flat_members m where m.auth_user_id = v_uid and m.role = 'owner') >= 5 then
    raise exception 'too_many_flats';
  end if;

  if not exists (select 1 from pg_timezone_names where name = p_timezone) then
    raise exception 'invalid_timezone';
  end if;

  if char_length(btrim(coalesce(p_owner ->> 'name', ''))) = 0 then
    raise exception 'owner_name_required';
  end if;

  insert into public.flats (name, start_date, timezone, latitude, longitude, address, created_by)
  values (btrim(p_name), p_start_date, p_timezone, p_latitude, p_longitude, nullif(btrim(p_address), ''), v_uid)
  returning id into v_flat;

  insert into public.users (
    flat_id, role, name, last_name, age, nickname, phone_number, email,
    duty_order, rubbish_order, cleaning_order
  )
  values (
    v_flat,
    'user',
    btrim(p_owner ->> 'name'),
    btrim(coalesce(p_owner ->> 'last_name', '')),
    nullif(p_owner ->> 'age', '')::integer,
    nullif(p_owner ->> 'nickname', ''),
    nullif(p_owner ->> 'phone_number', ''),
    (select a.email from auth.users a where a.id = v_uid),
    1, 1, 1
  )
  returning user_id into v_resident;

  insert into public.flat_members (flat_id, auth_user_id, role, resident_id)
  values (v_flat, v_uid, 'owner', v_resident);

  insert into public.flat_tasks (flat_id, task, enabled, every_days, people)
  values (v_flat, 'duty', true, 1, 1),
         (v_flat, 'rubbish', true, 3, 1),
         (v_flat, 'cleaning', true, 7, 2);

  return v_flat;
end;
$$;

-- Uy ma'lumotlari. Boshlanish sanasi o'zgarsa ham o'tgan kunlar tarixda saqlanadi
create or replace function public.update_flat(p_flat uuid, p_patch jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_flat_owner(p_flat) then
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

-- Vazifa qoidasi: yoqish/o'chirish, necha kunda bir, bir navbatda necha kishi
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
  if not public.is_flat_owner(p_flat) then
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


-- 10) TAKLIFLAR

-- Egasi xonadosh uchun yangi havola yaratadi (eskisi bekor bo'ladi)
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

  if v_flat is null or not public.is_flat_owner(v_flat) then
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

-- Havolani ochgan odamga (login qilmagan bo'lsa ham): qaysi uy va kim sifatida
create or replace function public.get_invite(p_code text)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'flat_name', f.name,
    'resident_name', btrim(coalesce(u.name, '') || ' ' || coalesce(u.last_name, '')),
    'expired', i.expires_at < now(),
    'used', i.used_at is not null
  )
  from public.invites i
  join public.flats f on f.id = i.flat_id
  join public.users u on u.user_id = i.resident_id
  where i.code = p_code;
$$;

-- Taklifni qabul qilish: hisob uyga a'zo bo'ladi va o'sha xonadoshga ulanadi
create or replace function public.accept_invite(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_invite public.invites;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_invite from public.invites i where i.code = p_code for update;

  if not found then
    raise exception 'invite_not_found';
  elsif v_invite.used_at is not null then
    raise exception 'invite_used';
  elsif v_invite.expires_at < now() then
    raise exception 'invite_expired';
  elsif exists (select 1 from public.flat_members m where m.flat_id = v_invite.flat_id and m.auth_user_id = v_uid) then
    raise exception 'already_member';
  elsif exists (select 1 from public.flat_members m where m.flat_id = v_invite.flat_id and m.resident_id = v_invite.resident_id) then
    raise exception 'already_linked';
  end if;

  insert into public.flat_members (flat_id, auth_user_id, role, resident_id)
  values (v_invite.flat_id, v_uid, 'member', v_invite.resident_id);

  update public.invites set used_by = v_uid, used_at = now() where code = p_code;

  return v_invite.flat_id;
end;
$$;


-- 11) "BAJARDIM": endi faqat o'z hisobidan (yoki uy egasi xonadosh uchun)

create or replace function public.is_assigned_today(p_flat uuid, p_task text, p_user_id uuid)
returns boolean
language plpgsql
stable
set search_path = public
as $$
declare
  schedule json := public.get_duty_schedule(p_flat, public.flat_today(p_flat));
begin
  return exists (
    select 1
    from json_array_elements(coalesce(schedule -> p_task, '[]'::json)) as item
    where (item ->> 'user_id')::uuid = p_user_id
  );
end;
$$;

-- p_user_id bo'sh bo'lsa - o'zim. Boshqa xonadosh uchun faqat uy egasi belgilay oladi
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

  if v_user is null or (v_user is distinct from v_mine and not public.is_flat_owner(p_flat)) then
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

  if v_user is null or (v_user is distinct from v_mine and not public.is_flat_owner(p_flat)) then
    raise exception 'not_allowed';
  end if;

  delete from public.duty_done d
  where d.flat_id = p_flat and d.day = public.flat_today(p_flat) and d.task = p_task and d.user_id = v_user;
end;
$$;


-- 12) FUNKSIYALARNI KIM CHAQIRA OLADI

revoke execute on all functions in schema public from public, anon;

grant execute on function
  public.is_flat_member(uuid),
  public.is_flat_owner(uuid),
  public.flat_today(uuid),
  public.compute_duty_schedule(uuid, date),
  public.get_duty_schedule(uuid, date),
  public.get_duty_schedule_range(uuid, date, date),
  public.snapshot_duty_history(uuid),
  public.task_order_column(text),
  public.move_user_in_order(text, uuid, integer),
  public.swap_users_in_order(text, uuid, uuid),
  public.add_user(uuid, jsonb, integer),
  public.delete_user_and_shift(uuid),
  public.create_flat(text, date, jsonb, text, double precision, double precision, text),
  public.update_flat(uuid, jsonb),
  public.update_flat_task(uuid, text, boolean, integer, integer),
  public.create_invite(uuid),
  public.get_invite(text),
  public.accept_invite(text),
  public.is_assigned_today(uuid, text, uuid),
  public.mark_task_done(uuid, text, uuid),
  public.unmark_task_done(uuid, text, uuid)
to authenticated;

-- Taklif havolasini ochgan mehmon faqat shu qisqa ma'lumotni ko'radi
grant execute on function public.get_invite(text) to anon;

-- Telegram bot (service_role) hamma narsani o'qiy oladi
grant execute on all functions in schema public to service_role;

commit;
