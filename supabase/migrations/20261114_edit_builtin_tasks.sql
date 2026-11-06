-- Control Your Flat: o'rnatilgan 3 ta vazifani ham tahrirlash (nom, belgi, rang).
-- Supabase -> SQL Editor'da bir marta ishga tushiriladi (hammasi bitta tranzaksiyada).
--
-- Bo'sh qiymat (null) - asl holi: o'rnatilgan vazifa tarjimadagi nomi, o'z belgisi va rangi bilan.
-- Uyning o'z vazifasida nom majburiy (flat_tasks_custom_name_check).

begin;

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
  set name = nullif(btrim(coalesce(p_name, '')), ''),
      icon = nullif(p_icon, ''),
      color = nullif(p_color, '')
  where flat_id = p_flat and task = p_task;

  if not found then
    raise exception 'task_not_found';
  end if;
end;
$$;

commit;
