-- Keep the privileged member lookup type-safe for PostgREST.
-- auth.users.email is varchar, while the RPC contract intentionally exposes text.
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
    coalesce(account.email, '')::text,
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
