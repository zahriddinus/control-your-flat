-- Control Your Flat: "Bajardim" belgilari va oylik reyting uchun.
-- Supabase -> SQL Editor'da bir marta ishga tushiriladi.
--
-- duty_done jadvalini hamma o'qiy oladi, lekin to'g'ridan-to'g'ri yozib bo'lmaydi.
-- Yozish faqat mark_task_done / unmark_task_done orqali: ular shu odam BUGUN (Toshkent vaqti)
-- shu vazifaga navbatchi ekanini o'zi tekshiradi. Shuning uchun boshqa kun yoki boshqa vazifa
-- uchun belgi qo'yib bo'lmaydi.

begin;

create table if not exists public.duty_done (
  day date not null,
  task text not null check (task in ('duty', 'rubbish', 'cleaning')),
  user_id uuid not null,
  done_at timestamptz not null default now(),
  primary key (day, task, user_id)
);

alter table public.duty_done enable row level security;

drop policy if exists "Anyone can read duty done" on public.duty_done;
create policy "Anyone can read duty done"
  on public.duty_done for select
  to anon, authenticated
  using (true);

grant select on public.duty_done to anon, authenticated;


-- Shu odam bugun shu vazifaga navbatchimi?
create or replace function public.is_assigned_today(p_task text, p_user_id uuid)
returns boolean
language plpgsql
stable
set search_path = public
as $$
declare
  today date := (now() at time zone 'Asia/Tashkent')::date;
  schedule json := public.get_duty_schedule(today);
begin
  if p_task = 'duty' then
    return (schedule -> 'duty' ->> 'user_id')::uuid = p_user_id;
  elsif p_task = 'rubbish' then
    return (schedule -> 'rubbish' ->> 'user_id')::uuid = p_user_id;
  elsif p_task = 'cleaning' then
    return exists (
      select 1
      from json_array_elements(schedule -> 'cleaning') as cleaning_user
      where (cleaning_user ->> 'user_id')::uuid = p_user_id
    );
  end if;

  return false;
end;
$$;


-- "Bajardim": faqat bugungi o'z vazifasi uchun. Qayta bosilsa, xato bermaydi
create or replace function public.mark_task_done(p_task text, p_user_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := (now() at time zone 'Asia/Tashkent')::date;
  result timestamptz;
begin
  if not coalesce(public.is_assigned_today(p_task, p_user_id), false) then
    raise exception 'not_assigned_today' using errcode = 'P0001';
  end if;

  insert into public.duty_done (day, task, user_id)
  values (today, p_task, p_user_id)
  on conflict (day, task, user_id) do nothing;

  select done_at into result
  from public.duty_done
  where day = today and task = p_task and user_id = p_user_id;

  return result;
end;
$$;


-- Xato bosilgan bo'lsa: faqat bugungi belgini olib tashlash mumkin
create or replace function public.unmark_task_done(p_task text, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := (now() at time zone 'Asia/Tashkent')::date;
begin
  if not coalesce(public.is_assigned_today(p_task, p_user_id), false) then
    raise exception 'not_assigned_today' using errcode = 'P0001';
  end if;

  delete from public.duty_done
  where day = today and task = p_task and user_id = p_user_id;
end;
$$;

revoke all on function public.mark_task_done(text, uuid) from public;
revoke all on function public.unmark_task_done(text, uuid) from public;
grant execute on function public.mark_task_done(text, uuid) to anon, authenticated;
grant execute on function public.unmark_task_done(text, uuid) to anon, authenticated;

commit;
