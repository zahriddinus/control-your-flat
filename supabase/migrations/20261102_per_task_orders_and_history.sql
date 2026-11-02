-- Control Your Flat: har bir vazifa uchun alohida tartib, o'rin almashtirish va navbatlar tarixi.
-- Supabase -> SQL Editor'da bir marta ishga tushiriladi.
--
-- Nima o'zgaradi:
--   1. users jadvaliga rubbish_order va cleaning_order qo'shiladi (boshida duty_order bilan bir xil,
--      shuning uchun hozirgi jadval o'zgarmaydi).
--   2. duty_history jadvali: tartib o'zgartirilishidan oldin 2026-09-01 dan bugungacha bo'lgan
--      kunlar shu yerga yoziladi. get_duty_schedule o'tgan kunlarni tarixdan o'qiydi, shuning uchun
--      tartib o'zgarsa ham bugungi va o'tgan kunlar o'zgarmaydi.
--   3. Tartibni o'zgartiradigan barcha amallar bitta funksiyada, bitta tranzaksiyada bajariladi:
--      move_user_in_order, swap_users_in_order, add_user, delete_user_and_shift.
--
-- Funksiyalar chaqirgan odamning huquqlari bilan ishlaydi (security invoker), ya'ni RLS amal qiladi:
-- tartibni faqat admin o'zgartira oladi.

begin;

-- 1) MUSOR VA UBORKA UCHUN ALOHIDA TARTIB

alter table public.users add column if not exists rubbish_order integer;
alter table public.users add column if not exists cleaning_order integer;

update public.users set rubbish_order = duty_order where rubbish_order is null;
update public.users set cleaning_order = duty_order where cleaning_order is null;

-- Mehmonlar ham jadval sahifasi uchun yangi ustunlarni o'qiy olsin
grant select (rubbish_order, cleaning_order) on public.users to anon;


-- 2) NAVBATLAR TARIXI

create table if not exists public.duty_history (
  day date not null,
  task text not null check (task in ('duty', 'rubbish', 'cleaning')),
  position smallint not null default 0,
  user_id uuid not null,
  name text,
  last_name text,
  primary key (day, task, position)
);

alter table public.duty_history enable row level security;

drop policy if exists "Anyone can read duty history" on public.duty_history;
create policy "Anyone can read duty history"
  on public.duty_history for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can write duty history" on public.duty_history;
create policy "Admins can write duty history"
  on public.duty_history for insert
  to authenticated
  with check (public.is_admin());


-- 3) FORMULA: navbatlarni tartib bo'yicha hisoblash (tarixga qaramaydi)

create or replace function public.compute_duty_schedule(target_date date)
returns json
language plpgsql
stable
set search_path = public
as $$
declare
  total_users integer;
  days_from_start integer;
  duty_user json;
  rubbish_user json;
  cleaning_users json;
  cleaning_group integer;
begin
  select count(*) into total_users from public.users;

  if total_users = 0 then
    return json_build_object(
      'date', target_date, 'duty', null, 'rubbish', null, 'cleaning', json_build_array()
    );
  end if;

  days_from_start := target_date - date '2026-09-01';

  -- Navbatchi: har kuni navbatchilik tartibidagi keyingi odam
  select json_build_object('user_id', u.user_id, 'name', u.name, 'last_name', u.last_name)
  into duty_user
  from public.users u
  order by u.duty_order nulls last, u.user_id
  offset ((days_from_start % total_users) + total_users) % total_users
  limit 1;

  -- Musor: har 3 kunda musor tartibidagi keyingi odam
  if days_from_start % 3 = 0 then
    select json_build_object('user_id', u.user_id, 'name', u.name, 'last_name', u.last_name)
    into rubbish_user
    from public.users u
    order by u.rubbish_order nulls last, u.duty_order, u.user_id
    offset (((days_from_start / 3) % total_users) + total_users) % total_users
    limit 1;
  end if;

  -- Generalniy uborka: har 7 kunda uborka tartibidagi keyingi juftlik
  if days_from_start >= 0 and days_from_start % 7 = 0 then
    cleaning_group := days_from_start / 7;

    cleaning_users := json_build_array(
      (
        select json_build_object('user_id', u.user_id, 'name', u.name, 'last_name', u.last_name)
        from public.users u
        order by u.cleaning_order nulls last, u.duty_order, u.user_id
        offset (cleaning_group * 2) % total_users
        limit 1
      ),
      (
        select json_build_object('user_id', u.user_id, 'name', u.name, 'last_name', u.last_name)
        from public.users u
        order by u.cleaning_order nulls last, u.duty_order, u.user_id
        offset (cleaning_group * 2 + 1) % total_users
        limit 1
      )
    );
  else
    cleaning_users := json_build_array();
  end if;

  return json_build_object(
    'date', target_date,
    'duty', duty_user,
    'rubbish', rubbish_user,
    'cleaning', cleaning_users
  );
end;
$$;


-- 4) SAYT CHAQIRADIGAN FUNKSIYA: tarixda bo'lsa tarixdan, bo'lmasa formula bo'yicha

create or replace function public.get_duty_schedule(target_date date)
returns json
language plpgsql
stable
set search_path = public
as $$
begin
  if not exists (select 1 from public.duty_history h where h.day = target_date) then
    return public.compute_duty_schedule(target_date);
  end if;

  return json_build_object(
    'date', target_date,
    'duty', (
      select json_build_object('user_id', h.user_id, 'name', h.name, 'last_name', h.last_name)
      from public.duty_history h
      where h.day = target_date and h.task = 'duty'
      limit 1
    ),
    'rubbish', (
      select json_build_object('user_id', h.user_id, 'name', h.name, 'last_name', h.last_name)
      from public.duty_history h
      where h.day = target_date and h.task = 'rubbish'
      limit 1
    ),
    'cleaning', coalesce(
      (
        select json_agg(
          json_build_object('user_id', h.user_id, 'name', h.name, 'last_name', h.last_name)
          order by h.position
        )
        from public.duty_history h
        where h.day = target_date and h.task = 'cleaning'
      ),
      json_build_array()
    )
  );
end;
$$;


-- 5) TARIXGA YOZISH: 2026-09-01 dan bugungacha (Toshkent vaqti) hali yozilmagan kunlar

create or replace function public.snapshot_duty_history()
returns void
language plpgsql
set search_path = public
as $$
declare
  today date := (now() at time zone 'Asia/Tashkent')::date;
  d date;
  s json;
  item json;
  pos integer;
begin
  for d in select generate_series(date '2026-09-01', today, interval '1 day')::date loop
    continue when exists (select 1 from public.duty_history h where h.day = d);

    s := public.compute_duty_schedule(d);

    if json_typeof(s -> 'duty') = 'object' then
      insert into public.duty_history (day, task, position, user_id, name, last_name)
      values (d, 'duty', 0, (s -> 'duty' ->> 'user_id')::uuid,
              s -> 'duty' ->> 'name', s -> 'duty' ->> 'last_name');
    end if;

    if json_typeof(s -> 'rubbish') = 'object' then
      insert into public.duty_history (day, task, position, user_id, name, last_name)
      values (d, 'rubbish', 0, (s -> 'rubbish' ->> 'user_id')::uuid,
              s -> 'rubbish' ->> 'name', s -> 'rubbish' ->> 'last_name');
    end if;

    pos := 0;

    for item in select value from json_array_elements(s -> 'cleaning') loop
      if json_typeof(item) = 'object' then
        insert into public.duty_history (day, task, position, user_id, name, last_name)
        values (d, 'cleaning', pos, (item ->> 'user_id')::uuid, item ->> 'name', item ->> 'last_name');
      end if;

      pos := pos + 1;
    end loop;
  end loop;
end;
$$;


-- 6) TARTIBNI O'ZGARTIRISH
-- p_task: 'duty' | 'rubbish' | 'cleaning'.
-- Raqamlar vaqtincha manfiy qilinadi: duty_order'da unique cheklov bo'lsa ham to'qnashmaydi.

-- Bir odamni boshqa o'ringa ko'chirish (oradagilar bittaga suriladi)
create or replace function public.move_user_in_order(p_task text, p_user_id uuid, p_new_order integer)
returns void
language plpgsql
set search_path = public
as $$
declare
  col text := case p_task
    when 'duty' then 'duty_order'
    when 'rubbish' then 'rubbish_order'
    when 'cleaning' then 'cleaning_order'
  end;
  old_order integer;
  max_order integer;
  changed integer;
begin
  if col is null then
    raise exception 'Noto''g''ri vazifa: %', p_task;
  end if;

  perform public.snapshot_duty_history();

  execute format('select %1$I from public.users where user_id = $1', col)
    into old_order using p_user_id;

  if old_order is null then
    raise exception 'User topilmadi';
  end if;

  execute format('select max(%1$I) from public.users', col) into max_order;

  p_new_order := greatest(1, least(p_new_order, max_order));

  if p_new_order = old_order then
    return;
  end if;

  execute format('update public.users set %1$I = -2147483000 where user_id = $1', col)
    using p_user_id;

  if p_new_order < old_order then
    execute format('update public.users set %1$I = -(%1$I + 1) where %1$I >= $1 and %1$I < $2', col)
      using p_new_order, old_order;
  else
    execute format('update public.users set %1$I = -(%1$I - 1) where %1$I > $1 and %1$I <= $2', col)
      using old_order, p_new_order;
  end if;

  execute format('update public.users set %1$I = -%1$I where %1$I < 0 and %1$I > -2147483000', col);
  execute format('update public.users set %1$I = $1 where user_id = $2', col)
    using p_new_order, p_user_id;

  get diagnostics changed = row_count;

  if changed = 0 then
    raise exception 'Tartibni o''zgartirishga ruxsat yo''q';
  end if;
end;
$$;

-- Ikki odamning o'rnini almashtirish (boshqalar joyida qoladi)
create or replace function public.swap_users_in_order(p_task text, p_user_a uuid, p_user_b uuid)
returns void
language plpgsql
set search_path = public
as $$
declare
  col text := case p_task
    when 'duty' then 'duty_order'
    when 'rubbish' then 'rubbish_order'
    when 'cleaning' then 'cleaning_order'
  end;
  order_a integer;
  order_b integer;
  changed integer;
begin
  if col is null then
    raise exception 'Noto''g''ri vazifa: %', p_task;
  end if;

  perform public.snapshot_duty_history();

  execute format('select %1$I from public.users where user_id = $1', col) into order_a using p_user_a;
  execute format('select %1$I from public.users where user_id = $1', col) into order_b using p_user_b;

  if order_a is null or order_b is null then
    raise exception 'User topilmadi';
  end if;

  execute format('update public.users set %1$I = -2147483000 where user_id = $1', col) using p_user_a;
  execute format('update public.users set %1$I = $1 where user_id = $2', col) using order_a, p_user_b;
  execute format('update public.users set %1$I = $1 where user_id = $2', col) using order_b, p_user_a;

  get diagnostics changed = row_count;

  if changed = 0 then
    raise exception 'Tartibni o''zgartirishga ruxsat yo''q';
  end if;
end;
$$;

-- Yangi user qo'shish. p_duty_order bo'sh bo'lsa, oxiriga. Musor va uborka tartibida oxiriga.
-- Qaytaradi: navbatchilik tartibidagi o'rni
create or replace function public.add_user(p_user jsonb, p_duty_order integer default null)
returns integer
language plpgsql
set search_path = public
as $$
declare
  max_duty integer;
  new_order integer;
begin
  perform public.snapshot_duty_history();

  select coalesce(max(duty_order), 0) into max_duty from public.users;

  new_order := case
    when p_duty_order is null or p_duty_order < 1 or p_duty_order > max_duty then max_duty + 1
    else p_duty_order
  end;

  update public.users set duty_order = -(duty_order + 1) where duty_order >= new_order;
  update public.users set duty_order = -duty_order where duty_order < 0;

  insert into public.users (
    role, name, last_name, age, nickname, phone_number, email,
    duty_order, rubbish_order, cleaning_order
  )
  values (
    p_user ->> 'role',
    p_user ->> 'name',
    p_user ->> 'last_name',
    (p_user ->> 'age')::integer,
    p_user ->> 'nickname',
    p_user ->> 'phone_number',
    p_user ->> 'email',
    new_order,
    (select coalesce(max(rubbish_order), 0) + 1 from public.users),
    (select coalesce(max(cleaning_order), 0) + 1 from public.users)
  );

  return new_order;
end;
$$;

-- O'chirish: avval tarix yoziladi, keyin uchala tartibdagi bo'shliq yopiladi
create or replace function public.delete_user_and_shift(p_user_id uuid)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_duty integer;
  v_rubbish integer;
  v_cleaning integer;
begin
  perform public.snapshot_duty_history();

  delete from public.users
  where user_id = p_user_id
  returning duty_order, rubbish_order, cleaning_order into v_duty, v_rubbish, v_cleaning;

  if not found then
    raise exception 'User topilmadi yoki o''chirishga ruxsat yo''q';
  end if;

  update public.users set duty_order = -(duty_order - 1) where duty_order > v_duty;
  update public.users set duty_order = -duty_order where duty_order < 0;

  if v_rubbish is not null then
    update public.users set rubbish_order = -(rubbish_order - 1) where rubbish_order > v_rubbish;
    update public.users set rubbish_order = -rubbish_order where rubbish_order < 0;
  end if;

  if v_cleaning is not null then
    update public.users set cleaning_order = -(cleaning_order - 1) where cleaning_order > v_cleaning;
    update public.users set cleaning_order = -cleaning_order where cleaning_order < 0;
  end if;
end;
$$;

commit;
