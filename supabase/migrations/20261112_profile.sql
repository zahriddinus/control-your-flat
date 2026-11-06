-- Control Your Flat: "Mening profilim" va avatar rangi.
-- Supabase -> SQL Editor'da bir marta ishga tushiriladi (hammasi bitta tranzaksiyada).
--
-- users.avatar_color - xonadosh o'zi tanlagan rang (bo'sh bo'lsa, sayt ID'dan avtomatik tanlaydi).
-- update_my_profile - har kim faqat o'z xonadosh qatorini o'zgartiradi (rol va tartibga tegmaydi).

begin;

alter table public.users
  add column if not exists avatar_color text
  check (avatar_color in ('blue', 'indigo', 'purple', 'pink', 'red', 'orange', 'amber', 'green', 'teal', 'cyan'));

create or replace function public.update_my_profile(p_flat uuid, p_patch jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_resident uuid;
begin
  select m.resident_id into v_resident
  from public.flat_members m
  where m.flat_id = p_flat and m.auth_user_id = auth.uid();

  if v_resident is null then
    raise exception 'not_member';
  end if;

  if p_patch ? 'name' and char_length(btrim(coalesce(p_patch ->> 'name', ''))) = 0 then
    raise exception 'name_required';
  end if;

  update public.users u set
    name = case when p_patch ? 'name' then btrim(p_patch ->> 'name') else u.name end,
    last_name = case when p_patch ? 'last_name' then btrim(coalesce(p_patch ->> 'last_name', '')) else u.last_name end,
    age = case when p_patch ? 'age' then nullif(p_patch ->> 'age', '')::smallint else u.age end,
    nickname = case when p_patch ? 'nickname' then nullif(btrim(p_patch ->> 'nickname'), '') else u.nickname end,
    phone_number = case when p_patch ? 'phone_number' then nullif(btrim(p_patch ->> 'phone_number'), '') else u.phone_number end,
    avatar_color = case when p_patch ? 'avatar_color' then nullif(p_patch ->> 'avatar_color', '') else u.avatar_color end
  where u.user_id = v_resident;
end;
$$;

revoke execute on function public.update_my_profile(uuid, jsonb) from public, anon;
grant execute on function public.update_my_profile(uuid, jsonb) to authenticated, service_role;

commit;
