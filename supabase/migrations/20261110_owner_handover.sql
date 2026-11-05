-- Control Your Flat: uy hech qachon egasiz qolmasin.
-- Supabase -> SQL Editor'da bir marta ishga tushiriladi (hammasi bitta tranzaksiyada).
--
-- 1. Ega a'zoligi yo'qolsa (masalan, hisobi o'chirilsa), egalik avtomatik eng eski
--    boshqaruvchiga, u bo'lmasa eng eski a'zoga o'tadi.
-- 2. transfer_and_leave: ega bir bosishda egalikni boshqaruvchiga berib, uydan chiqadi.

begin;

-- 1) AVTOMATIK EGALIK

create or replace function public.promote_new_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next uuid;
begin
  if old.role <> 'owner' then
    return old;
  end if;

  -- Uyning o'zi o'chirilayotgan bo'lsa (a'zolar u bilan birga o'chadi), hech narsa qilinmaydi
  if not exists (select 1 from public.flats f where f.id = old.flat_id) then
    return old;
  end if;

  if exists (select 1 from public.flat_members m where m.flat_id = old.flat_id and m.role = 'owner') then
    return old;
  end if;

  select m.auth_user_id into v_next
  from public.flat_members m
  where m.flat_id = old.flat_id
  order by case m.role when 'admin' then 0 else 1 end, m.joined_at
  limit 1;

  if v_next is not null then
    update public.flat_members
    set role = 'owner'
    where flat_id = old.flat_id and auth_user_id = v_next;
  end if;

  return old;
end;
$$;

drop trigger if exists flat_members_promote_owner on public.flat_members;
create trigger flat_members_promote_owner
  after delete on public.flat_members
  for each row execute function public.promote_new_owner();


-- 2) EGALIKNI BERIB CHIQISH (faqat boshqaruvchiga beriladi)

create or replace function public.transfer_and_leave(p_flat uuid, p_auth_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_flat_owner(p_flat) then
    raise exception 'not_owner';
  end if;

  if not exists (
    select 1 from public.flat_members m
    where m.flat_id = p_flat and m.auth_user_id = p_auth_user_id and m.role = 'admin'
  ) then
    raise exception 'not_admin';
  end if;

  update public.flat_members
  set role = 'owner'
  where flat_id = p_flat and auth_user_id = p_auth_user_id;

  delete from public.flat_members
  where flat_id = p_flat and auth_user_id = auth.uid();
end;
$$;

revoke execute on function public.promote_new_owner() from public, anon;
revoke execute on function public.transfer_and_leave(uuid, uuid) from public, anon;
grant execute on function public.transfer_and_leave(uuid, uuid) to authenticated, service_role;

commit;
