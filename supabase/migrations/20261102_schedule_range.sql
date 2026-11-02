-- Control Your Flat: bir nechta kunning navbatlarini bitta so'rovda qaytarish.
-- Supabase -> SQL Editor'da bir marta ishga tushiriladi.
--
-- Sayt oy jadvali uchun avval har kunni alohida so'rardi (~30 ta so'rov). Endi bitta so'rov:
-- get_duty_schedule_range('2026-11-01', '2026-11-30') -> [{date, duty, rubbish, cleaning}, ...]
-- Har bir kun get_duty_schedule orqali hisoblanadi, ya'ni tarix (duty_history) ham hisobga olinadi.
-- Bir so'rovda eng ko'p 62 kun qaytadi.

create or replace function public.get_duty_schedule_range(start_date date, end_date date)
returns json
language sql
stable
set search_path = public
as $$
  select coalesce(json_agg(public.get_duty_schedule(day::date) order by day), '[]'::json)
  from generate_series(
    start_date,
    least(end_date, start_date + 61),
    interval '1 day'
  ) as day;
$$;
