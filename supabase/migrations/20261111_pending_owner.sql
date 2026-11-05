-- Control Your Flat: hali qo'shilmagan xonadoshga egalikni oldindan berish.
-- Supabase -> SQL Editor'da bir marta ishga tushiriladi (hammasi bitta tranzaksiyada).
--
-- users.invite_role = 'owner' - xonadosh taklif orqali qo'shilgan zahoti uy egasi bo'ladi,
-- hozirgi ega esa boshqaruvchi bo'lib qoladi. Bitta uyda bunday xonadosh ko'pi bilan bitta.

begin;

alter table public.users drop constraint if exists users_invite_role_check;
alter table public.users
  add constraint users_invite_role_check check (invite_role in ('member', 'admin', 'owner'));

-- Faqat ega: kutilayotgan egani belgilash (p_enabled = true) yoki bekor qilish (boshqaruvchiga qaytadi)
create or replace function public.set_pending_owner(p_resident_id uuid, p_enabled boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_flat uuid;
begin
  select u.flat_id into v_flat from public.users u where u.user_id = p_resident_id;

  if v_flat is null or not public.is_flat_owner(v_flat) then
    raise exception 'not_owner';
  end if;

  if exists (select 1 from public.flat_members m where m.flat_id = v_flat and m.resident_id = p_resident_id) then
    raise exception 'already_linked';
  end if;

  if p_enabled then
    update public.users set invite_role = 'admin' where flat_id = v_flat and invite_role = 'owner';
    update public.users set invite_role = 'owner' where user_id = p_resident_id;
  else
    update public.users set invite_role = 'admin' where user_id = p_resident_id and invite_role = 'owner';
  end if;
end;
$$;

-- Taklifni qabul qilish: invite_role = 'owner' bo'lsa, egalik shu odamga o'tadi
create or replace function public.accept_invite(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_invite public.invites;
  v_role text;
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

  select coalesce(u.invite_role, 'member') into v_role
  from public.users u
  where u.user_id = v_invite.resident_id;

  -- Yangi ega kelsa, hozirgi ega boshqaruvchi bo'ladi
  if v_role = 'owner' then
    update public.flat_members
    set role = 'admin'
    where flat_id = v_invite.flat_id and role = 'owner';
  end if;

  insert into public.flat_members (flat_id, auth_user_id, role, resident_id)
  values (v_invite.flat_id, v_uid, v_role, v_invite.resident_id);

  if v_role = 'owner' then
    update public.users set invite_role = 'admin' where user_id = v_invite.resident_id;
  end if;

  update public.invites set used_by = v_uid, used_at = now() where code = p_code;

  return v_invite.flat_id;
end;
$$;

revoke execute on function public.set_pending_owner(uuid, boolean) from public, anon;
grant execute on function public.set_pending_owner(uuid, boolean) to authenticated, service_role;

commit;
