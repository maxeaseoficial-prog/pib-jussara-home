-- Administrative programming: recurring church services, monthly calendar and images.

create table if not exists public.church_services (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  category text not null default 'Culto' check (char_length(btrim(category)) between 1 and 60),
  description text not null default '' check (char_length(description) <= 1200),
  service_time time without time zone not null,
  recurrence_type text not null check (recurrence_type in ('weekly', 'monthly')),
  weekday smallint,
  day_of_month smallint,
  image_url text,
  image_path text,
  fallback_key text check (fallback_key is null or fallback_key in ('worship', 'interior', 'youth', 'family')),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (recurrence_type = 'weekly' and weekday between 0 and 6 and day_of_month is null)
    or
    (recurrence_type = 'monthly' and day_of_month between 1 and 31 and weekday is null)
  )
);

create index if not exists church_services_public_idx
  on public.church_services (active, sort_order, title);

create table if not exists public.church_calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  description text not null default '' check (char_length(description) <= 3000),
  event_date date not null,
  start_time time without time zone,
  end_time time without time zone,
  all_day boolean not null default false,
  category text not null default 'Evento' check (char_length(btrim(category)) between 1 and 60),
  location text check (location is null or char_length(location) <= 300),
  image_url text,
  image_path text,
  display_type text not null default 'normal' check (display_type in ('normal', 'featured', 'notice')),
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (all_day = true and start_time is null and end_time is null)
    or
    (all_day = false and start_time is not null and (end_time is null or end_time > start_time))
  )
);

create index if not exists church_calendar_events_public_idx
  on public.church_calendar_events (published, event_date, start_time);

alter table public.church_services enable row level security;
alter table public.church_calendar_events enable row level security;

revoke all on public.church_services from public, anon, authenticated;
revoke all on public.church_calendar_events from public, anon, authenticated;
grant select on public.church_services to anon, authenticated;
grant select on public.church_calendar_events to anon, authenticated;
grant insert, update, delete on public.church_services to authenticated;
grant insert, update, delete on public.church_calendar_events to authenticated;

drop policy if exists "Public can read active church services" on public.church_services;
create policy "Public can read active church services"
on public.church_services for select to anon, authenticated
using (active);

drop policy if exists "Administrators can read all church services" on public.church_services;
create policy "Administrators can read all church services"
on public.church_services for select to authenticated
using ((select public.current_user_is_admin()));

drop policy if exists "Administrators can create church services" on public.church_services;
create policy "Administrators can create church services"
on public.church_services for insert to authenticated
with check ((select public.current_user_is_admin()));

drop policy if exists "Administrators can update church services" on public.church_services;
create policy "Administrators can update church services"
on public.church_services for update to authenticated
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));

drop policy if exists "Administrators can delete church services" on public.church_services;
create policy "Administrators can delete church services"
on public.church_services for delete to authenticated
using ((select public.current_user_is_admin()));

drop policy if exists "Public can read published calendar events" on public.church_calendar_events;
create policy "Public can read published calendar events"
on public.church_calendar_events for select to anon, authenticated
using (published);

drop policy if exists "Administrators can read all calendar events" on public.church_calendar_events;
create policy "Administrators can read all calendar events"
on public.church_calendar_events for select to authenticated
using ((select public.current_user_is_admin()));

drop policy if exists "Administrators can create calendar events" on public.church_calendar_events;
create policy "Administrators can create calendar events"
on public.church_calendar_events for insert to authenticated
with check ((select public.current_user_is_admin()));

drop policy if exists "Administrators can update calendar events" on public.church_calendar_events;
create policy "Administrators can update calendar events"
on public.church_calendar_events for update to authenticated
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));

drop policy if exists "Administrators can delete calendar events" on public.church_calendar_events;
create policy "Administrators can delete calendar events"
on public.church_calendar_events for delete to authenticated
using ((select public.current_user_is_admin()));

create or replace function private.set_programming_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_programming_updated_at() from public, anon, authenticated;

drop trigger if exists set_church_services_updated_at on public.church_services;
create trigger set_church_services_updated_at
before update on public.church_services
for each row execute function private.set_programming_updated_at();

drop trigger if exists set_church_calendar_events_updated_at on public.church_calendar_events;
create trigger set_church_calendar_events_updated_at
before update on public.church_calendar_events
for each row execute function private.set_programming_updated_at();

insert into public.church_services (
  id, title, category, description, service_time, recurrence_type,
  weekday, day_of_month, fallback_key, active, sort_order
)
values
  (
    '00000000-0000-4000-8000-000000000101',
    'Culto de Celebração', 'Culto',
    'Um tempo de adoração, louvor e pregação da Palavra com toda a igreja reunida.',
    '19:00', 'weekly', 0, null, 'worship', true, 10
  ),
  (
    '00000000-0000-4000-8000-000000000102',
    'Culto de Oração', 'Oração',
    'Momento de intercessão, comunhão e busca pela presença de Deus no meio da semana.',
    '19:30', 'weekly', 3, null, 'interior', true, 20
  ),
  (
    '00000000-0000-4000-8000-000000000103',
    'Encontro de Jovens', 'Jovens',
    'Louvor, mensagem e comunhão entre adolescentes e jovens da nossa comunidade.',
    '19:30', 'weekly', 6, null, 'youth', true, 30
  ),
  (
    '00000000-0000-4000-8000-000000000104',
    'Culto da Família', 'Família',
    'Uma celebração preparada para reunir pais, filhos e toda a casa diante de Deus.',
    '19:00', 'monthly', null, 21, 'family', true, 40
  )
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'church-programming',
  'church-programming',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view church programming images" on storage.objects;
create policy "Public can view church programming images"
on storage.objects for select to public
using (bucket_id = 'church-programming');

drop policy if exists "Admins can upload church programming images" on storage.objects;
create policy "Admins can upload church programming images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'church-programming'
  and (select public.current_user_is_admin())
);

drop policy if exists "Admins can update church programming images" on storage.objects;
create policy "Admins can update church programming images"
on storage.objects for update to authenticated
using (
  bucket_id = 'church-programming'
  and (select public.current_user_is_admin())
)
with check (
  bucket_id = 'church-programming'
  and (select public.current_user_is_admin())
);

drop policy if exists "Admins can delete church programming images" on storage.objects;
create policy "Admins can delete church programming images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'church-programming'
  and (select public.current_user_is_admin())
);
