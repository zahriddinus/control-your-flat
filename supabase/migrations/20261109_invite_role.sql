-- Control Your Flat: hisobsiz xonadoshni ham oldindan boshqaruvchi qilib belgilash.
-- Supabase -> SQL Editor'da bir marta ishga tushiriladi (hammasi bitta tranzaksiyada).
--
-- users.invite_role - xonadosh taklif orqali qo'shilganda qaysi rol bilan kiradi ('member' yoki 'admin').
-- Uni faqat uy egasi o'zgartira oladi (trigger tekshiradi): boshqaruvchi shu yo'l bilan
-- yangi boshqaruvchi yarata olmaydi.

begin;

alter table public.users
  add column if not exists invite_role text not null default 'member'
  check (invite_role in ('member', 'admin'));

-- Faqat ega 'admin' qo'ya oladi. SQL Editor va bot (auth.uid() bo'sh) uchun cheklov yo'q
create or replace function public.guard_invite_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if tg_op = 'INSERT' and new.invite_role <> 'member' and not public.is_flat_owner(new.flat_id) then
    raise exception 'not_owner';
  end if;

  if tg_op = 'UPDATE'
     and new.invite_role is distinct from old.invite_role
     and not public.is_flat_owner(new.flat_id) then
    raise exception 'not_owner';
  end if;

  return new;
end;
$$;

drop trigger if exists users_guard_invite_role on public.users;
create trigger users_guard_invite_role
  before insert or update of invite_role on public.users
  for each row execute function public.guard_invite_role();

-- Taklifni qabul qilish: rol xonadoshning invite_role'idan olinadi
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

  insert into public.flat_members (flat_id, auth_user_id, role, resident_id)
  values (v_invite.flat_id, v_uid, v_role, v_invite.resident_id);

  update public.invites set used_by = v_uid, used_at = now() where code = p_code;

  return v_invite.flat_id;
end;
$$;

revoke execute on function public.guard_invite_role() from public, anon;

commit;
