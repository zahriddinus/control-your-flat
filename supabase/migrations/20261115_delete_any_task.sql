-- Control Your Flat: o'rnatilgan 3 ta vazifani ham o'chirish mumkin.
-- Supabase -> SQL Editor'da bir marta ishga tushiriladi (hammasi bitta tranzaksiyada).
--
-- O'chirilgan o'rnatilgan vazifani sayt "Standart vazifalarni qaytarish" orqali tiklaydi
-- (update_flat_task qatorni asl qoidalari bilan qayta yaratadi). Xonadoshlarning
-- duty_order / rubbish_order / cleaning_order tartibi saqlanib qoladi.

begin;

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

  if not exists (select 1 from public.flat_tasks ft where ft.flat_id = p_flat and ft.task = p_task) then
    raise exception 'task_not_found';
  end if;

  -- Vazifa, uning tartibi (o'z vazifasida), tarixi va "Bajardim" belgilari o'chadi
  delete from public.flat_tasks where flat_id = p_flat and task = p_task;
  delete from public.duty_history where flat_id = p_flat and task = p_task;
  delete from public.duty_done where flat_id = p_flat and task = p_task;
end;
$$;

commit;
