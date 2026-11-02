-- Allow administrators created directly from the Supabase Dashboard.
-- Public signups still send full_name and phone through user metadata.

alter table public.profiles
  alter column phone drop not null;

alter table public.profiles
  drop constraint if exists profiles_phone_check;

alter table public.profiles
  add constraint profiles_phone_check
  check (phone is null or phone ~ '^\+55[1-9][0-9]{9,10}$');

create or replace function private.handle_new_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_full_name text;
  v_phone text;
begin
  v_full_name := btrim(
    regexp_replace(
      coalesce(new.raw_user_meta_data ->> 'full_name', ''),
      '\s+',
      ' ',
      'g'
    )
  );

  if char_length(v_full_name) < 3 then
    v_full_name := 'Administrador PIB Jussara';
  end if;

  v_phone := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'phone', '')), '');

  if v_phone is not null and v_phone !~ '^\+55[1-9][0-9]{9,10}$' then
    v_phone := null;
  end if;

  insert into public.profiles (id, full_name, phone)
  values (new.id, v_full_name, v_phone)
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_member() from public, anon, authenticated;
