-- Control Your Flat: faollik lentasi va navbat almashish so'rovlari.
-- Supabase -> SQL Editor'da bir marta ishga tushiriladi (hammasi bitta tranzaksiyada).
--
-- duty_overrides - bir martalik almashuv: shu kuni shu vazifada from_user o'rniga to_user.
--   Navbat tartibi o'zgarmaydi, faqat o'sha kun.
-- activity - uyda bo'lgan voqealar (bajardi, qo'shildi, almashdi, tartib o'zgardi...).
-- swap_requests - "kunlarimizni almashamizmi?" so'rovlari; qabul qilinsa, ikkita almashuv yoziladi.

begin;

-- 1) BIR MARTALIK ALMASHUVLAR

create table if not exists public.duty_overrides (
  flat_id uuid not null references public.flats (id) on delete cascade,
  day date not null,
  task text not null,
  from_user uuid not null references public.users (user_id) on delete cascade,
  to_user uuid not null references public.users (user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (flat_id, day, task, from_user)
);

alter table public.duty_overrides enable row level security;

revoke all on public.duty_overrides from anon;
grant select on public.duty_overrides to authenticated;

drop policy if exists "Members read overrides" on public.duty_overrides;
create policy "Members read overrides" on public.duty_overrides
  for select to authenticated using (public.is_flat_member(flat_id));


-- 2) NAVBATLARNI HISOBLASH: almashuvlar bilan

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

    -- Almashuvlar: shu kuni shu vazifada kimdir boshqasi bilan almashgan bo'lsa
    if exists (
      select 1 from public.duty_overrides ov
      where ov.flat_id = p_flat and ov.day = target_date and ov.task = t.task
    ) then
      select coalesce(
        json_agg(
          case
            when replacement.user_id is not null then json_build_object(
              'user_id', replacement.user_id, 'name', replacement.name, 'last_name', replacement.last_name
            )
            else picked.item
          end
          order by picked.ord
        ),
        '[]'::json
      )
      into v_picked
      from json_array_elements(v_picked) with ordinality as picked(item, ord)
      left join public.duty_overrides ov
        on ov.flat_id = p_flat and ov.day = target_date and ov.task = t.task
       and ov.from_user = (picked.item ->> 'user_id')::uuid
      left join public.users replacement on replacement.user_id = ov.to_user;
    end if;

    result := result || jsonb_build_object(t.task, v_picked::jsonb);
  end loop;

  return result::json;
end;
$$;


-- 3) FAOLLIK LENTASI: uyda nima bo'ldi

create table if not exists public.activity (
  id bigint generated always as identity primary key,
  flat_id uuid not null references public.flats (id) on delete cascade,
  kind text not null,
  actor_id uuid references public.users (user_id) on delete set null,
  target_id uuid references public.users (user_id) on delete set null,
  task text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_flat_idx on public.activity (flat_id, created_at desc);

alter table public.activity enable row level security;

revoke all on public.activity from anon;
grant select, insert on public.activity to authenticated;

drop policy if exists "Members read activity" on public.activity;
create policy "Members read activity" on public.activity
  for select to authenticated using (public.is_flat_member(flat_id));

-- Boshqaruvchilar o'z amallarini (tartib, almashtirish, vazifa) saytdan yozadi
drop policy if exists "Managers log activity" on public.activity;
create policy "Managers log activity" on public.activity
  for insert to authenticated
  with check (
    public.is_flat_manager(flat_id)
    and kind in ('order_changed', 'order_swapped', 'task_added', 'rules_changed')
  );

-- Hozirgi foydalanuvchining shu uydagi xonadosh qatori
create or replace function public.my_resident(p_flat uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select m.resident_id from public.flat_members m
  where m.flat_id = p_flat and m.auth_user_id = auth.uid();
$$;

-- "Bajardim" bosilganda
create or replace function public.log_done()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.activity (flat_id, kind, actor_id, task, meta)
  values (new.flat_id, 'done', new.user_id, new.task, jsonb_build_object('day', new.day));

  return new;
end;
$$;

drop trigger if exists duty_done_log on public.duty_done;
create trigger duty_done_log
  after insert on public.duty_done
  for each row execute function public.log_done();

-- Kimdir taklif orqali qo'shilganda
create or replace function public.log_joined()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role <> 'owner' or exists (select 1 from public.activity a where a.flat_id = new.flat_id) then
    insert into public.activity (flat_id, kind, actor_id)
    values (new.flat_id, 'joined', new.resident_id);
  end if;

  return new;
end;
$$;

drop trigger if exists flat_members_log_joined on public.flat_members;
create trigger flat_members_log_joined
  after insert on public.flat_members
  for each row execute function public.log_joined();

-- Yangi xonadosh qo'shilganda (uy yaratilayotgandagi egasining o'z qatoridan tashqari)
create or replace function public.log_resident_added()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := public.my_resident(new.flat_id);
begin
  if v_actor is not null then
    insert into public.activity (flat_id, kind, actor_id, target_id)
    values (new.flat_id, 'resident_added', v_actor, new.user_id);
  end if;

  return new;
end;
$$;

drop trigger if exists users_log_added on public.users;
create trigger users_log_added
  after insert on public.users
  for each row execute function public.log_resident_added();


-- 4) NAVBAT ALMASHISH SO'ROVI
-- Men (from_user) from_day kungi navbatimni beraman, u (to_user) menga to_day kungisini beradi

create table if not exists public.swap_requests (
  id uuid primary key default gen_random_uuid(),
  flat_id uuid not null references public.flats (id) on delete cascade,
  task text not null,
  from_user uuid not null references public.users (user_id) on delete cascade,
  from_day date not null,
  to_user uuid not null references public.users (user_id) on delete cascade,
  to_day date not null,
  message text check (char_length(message) <= 200),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists swap_requests_flat_idx on public.swap_requests (flat_id, status);

alter table public.swap_requests enable row level security;

revoke all on public.swap_requests from anon;
grant select on public.swap_requests to authenticated;

drop policy if exists "Members read swap requests" on public.swap_requests;
create policy "Members read swap requests" on public.swap_requests
  for select to authenticated using (public.is_flat_member(flat_id));

-- Shu odam shu kuni shu vazifadami (almashuvlar hisobga olingan holda)
create or replace function public.is_assigned_on(p_flat uuid, p_task text, p_user uuid, p_day date)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
    from json_array_elements(coalesce(public.get_duty_schedule(p_flat, p_day) -> p_task, '[]'::json)) as item
    where (item ->> 'user_id')::uuid = p_user
  );
$$;

create or replace function public.create_swap_request(
  p_flat uuid,
  p_task text,
  p_from_day date,
  p_to_user uuid,
  p_to_day date,
  p_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := public.my_resident(p_flat);
  v_today date := public.flat_today(p_flat);
  v_id uuid;
begin
  if v_me is null then
    raise exception 'not_member';
  end if;

  if p_to_user = v_me then
    raise exception 'same_person';
  end if;

  if p_from_day < v_today or p_to_day < v_today then
    raise exception 'past_day';
  end if;

  if not public.is_assigned_on(p_flat, p_task, v_me, p_from_day)
     or not public.is_assigned_on(p_flat, p_task, p_to_user, p_to_day) then
    raise exception 'not_assigned';
  end if;

  if exists (
    select 1 from public.swap_requests r
    where r.flat_id = p_flat and r.status = 'pending' and r.task = p_task
      and (r.from_day in (p_from_day, p_to_day) or r.to_day in (p_from_day, p_to_day))
  ) then
    raise exception 'already_pending';
  end if;

  insert into public.swap_requests (flat_id, task, from_user, from_day, to_user, to_day, message)
  values (p_flat, p_task, v_me, p_from_day, p_to_user, p_to_day, nullif(btrim(coalesce(p_message, '')), ''))
  returning id into v_id;

  insert into public.activity (flat_id, kind, actor_id, target_id, task, meta)
  values (p_flat, 'swap_requested', v_me, p_to_user, p_task,
          jsonb_build_object('from_day', p_from_day, 'to_day', p_to_day));

  return v_id;
end;
$$;

-- Javob: faqat so'ralgan odam (to_user). Qabul qilinsa - ikki kunga almashuv yoziladi
create or replace function public.respond_swap_request(p_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.swap_requests;
begin
  select * into r from public.swap_requests where id = p_id for update;

  if not found or r.status <> 'pending' then
    raise exception 'request_not_found';
  end if;

  if public.my_resident(r.flat_id) is distinct from r.to_user then
    raise exception 'not_allowed';
  end if;

  if p_accept then
    -- Navbatlar o'zgarib ketgan bo'lishi mumkin: qayta tekshiriladi
    if least(r.from_day, r.to_day) < public.flat_today(r.flat_id)
       or not public.is_assigned_on(r.flat_id, r.task, r.from_user, r.from_day)
       or not public.is_assigned_on(r.flat_id, r.task, r.to_user, r.to_day) then
      raise exception 'not_assigned';
    end if;

    insert into public.duty_overrides (flat_id, day, task, from_user, to_user)
    values (r.flat_id, r.from_day, r.task, r.from_user, r.to_user),
           (r.flat_id, r.to_day, r.task, r.to_user, r.from_user)
    on conflict (flat_id, day, task, from_user) do update set to_user = excluded.to_user;
  end if;

  update public.swap_requests
  set status = case when p_accept then 'accepted' else 'declined' end, resolved_at = now()
  where id = p_id;

  insert into public.activity (flat_id, kind, actor_id, target_id, task, meta)
  values (r.flat_id, case when p_accept then 'swap_accepted' else 'swap_declined' end,
          r.to_user, r.from_user, r.task,
          jsonb_build_object('from_day', r.from_day, 'to_day', r.to_day));
end;
$$;

-- Bekor qilish: faqat so'rov yuborgan odam
create or replace function public.cancel_swap_request(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.swap_requests;
begin
  select * into r from public.swap_requests where id = p_id for update;

  if not found or r.status <> 'pending' then
    raise exception 'request_not_found';
  end if;

  if public.my_resident(r.flat_id) is distinct from r.from_user then
    raise exception 'not_allowed';
  end if;

  update public.swap_requests set status = 'cancelled', resolved_at = now() where id = p_id;
end;
$$;


-- 5) KIM CHAQIRA OLADI

revoke execute on function
  public.my_resident(uuid),
  public.log_done(),
  public.log_joined(),
  public.log_resident_added(),
  public.is_assigned_on(uuid, text, uuid, date),
  public.create_swap_request(uuid, text, date, uuid, date, text),
  public.respond_swap_request(uuid, boolean),
  public.cancel_swap_request(uuid)
from public, anon;

grant execute on function
  public.my_resident(uuid),
  public.is_assigned_on(uuid, text, uuid, date),
  public.create_swap_request(uuid, text, date, uuid, date, text),
  public.respond_swap_request(uuid, boolean),
  public.cancel_swap_request(uuid)
to authenticated, service_role;

commit;
