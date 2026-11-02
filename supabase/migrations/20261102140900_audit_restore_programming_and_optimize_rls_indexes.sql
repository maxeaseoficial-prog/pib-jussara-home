-- Audit fixes: restore recurring services, cover foreign keys and simplify public/admin SELECT policies.

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

create index if not exists whatsapp_campaigns_created_by_idx
  on public.whatsapp_campaigns (created_by);

create index if not exists whatsapp_deliveries_member_id_idx
  on public.whatsapp_deliveries (member_id);

drop policy if exists "Public can read active church services" on public.church_services;
drop policy if exists "Administrators can read all church services" on public.church_services;

create policy "Anonymous can read active church services"
on public.church_services
for select
to anon
using (active);

create policy "Authenticated can read visible church services"
on public.church_services
for select
to authenticated
using (active or (select public.current_user_is_admin()));

drop policy if exists "Public can read published calendar events" on public.church_calendar_events;
drop policy if exists "Administrators can read all calendar events" on public.church_calendar_events;

create policy "Anonymous can read published calendar events"
on public.church_calendar_events
for select
to anon
using (published);

create policy "Authenticated can read visible calendar events"
on public.church_calendar_events
for select
to authenticated
using (published or (select public.current_user_is_admin()));
