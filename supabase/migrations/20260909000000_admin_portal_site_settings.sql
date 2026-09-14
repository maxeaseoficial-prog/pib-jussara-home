-- Administrative access is stored alongside the existing member profile.
-- Existing rows and future signups remain regular members by default.
alter table public.profiles
add column if not exists role text not null default 'member'
check (role in ('member', 'admin'));

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = (select auth.uid())
      and profile.role = 'admin'
  );
$$;

revoke all on function public.current_user_is_admin() from public, anon, authenticated;
grant execute on function public.current_user_is_admin() to authenticated;

create table if not exists public.site_settings (
  id boolean primary key default true check (id),
  phone text not null check (char_length(btrim(phone)) between 8 and 40),
  institutional_email text not null check (char_length(btrim(institutional_email)) between 5 and 254),
  full_address text not null check (char_length(btrim(full_address)) between 8 and 300),
  instagram_url text not null check (char_length(btrim(instagram_url)) between 8 and 500),
  facebook_url text not null check (char_length(btrim(facebook_url)) between 8 and 500),
  youtube_url text not null check (char_length(btrim(youtube_url)) between 8 and 500),
  youtube_live_url text not null check (char_length(btrim(youtube_live_url)) between 8 and 500),
  updated_at timestamptz not null default now()
);

insert into public.site_settings (
  id,
  phone,
  institutional_email,
  full_address,
  instagram_url,
  facebook_url,
  youtube_url,
  youtube_live_url
)
values (
  true,
  '(62) 98171-7501',
  'contato@pibjussara.com.br',
  'Rua Principal, s/n — Centro, Jussara - GO, 76270-000',
  'https://www.instagram.com/pibjuss/',
  'https://www.facebook.com/share/1DVrQb5V4T/?mibextid=wwXIfr',
  'https://youtube.com/',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
)
on conflict (id) do nothing;

alter table public.site_settings enable row level security;

revoke all on public.site_settings from public, anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant update (
  phone,
  institutional_email,
  full_address,
  instagram_url,
  facebook_url,
  youtube_url,
  youtube_live_url
) on public.site_settings to authenticated;

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
on public.site_settings
for select
to anon, authenticated
using (true);

drop policy if exists "Administrators can update site settings" on public.site_settings;
create policy "Administrators can update site settings"
on public.site_settings
for update
to authenticated
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));

create or replace function private.set_site_settings_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_site_settings_updated_at() from public, anon, authenticated;

drop trigger if exists set_site_settings_updated_at on public.site_settings;
create trigger set_site_settings_updated_at
before update on public.site_settings
for each row execute function private.set_site_settings_updated_at();

create or replace function public.admin_member_count()
returns bigint
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.current_user_is_admin() then
    raise insufficient_privilege using message = 'Administrative access required.';
  end if;

  return (select count(*) from public.profiles);
end;
$$;

revoke all on function public.admin_member_count() from public, anon, authenticated;
grant execute on function public.admin_member_count() to authenticated;

create or replace function public.admin_list_members(search_query text default null)
returns table (
  id uuid,
  full_name text,
  phone text,
  email text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  normalized_query text := nullif(btrim(search_query), '');
  phone_query text := regexp_replace(coalesce(search_query, ''), '[^0-9]', '', 'g');
begin
  if not public.current_user_is_admin() then
    raise insufficient_privilege using message = 'Administrative access required.';
  end if;

  return query
  select
    profile.id,
    profile.full_name,
    profile.phone,
    coalesce(account.email, ''),
    profile.created_at
  from public.profiles as profile
  left join auth.users as account on account.id = profile.id
  where normalized_query is null
    or profile.full_name ilike '%' || normalized_query || '%'
    or coalesce(account.email, '') ilike '%' || normalized_query || '%'
    or (
      phone_query <> ''
      and regexp_replace(profile.phone, '[^0-9]', '', 'g') like '%' || phone_query || '%'
    )
  order by profile.created_at desc;
end;
$$;

revoke all on function public.admin_list_members(text) from public, anon, authenticated;
grant execute on function public.admin_list_members(text) to authenticated;

