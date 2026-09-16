-- Z-API / WhatsApp messaging infrastructure for the PIB Jussara admin panel.
-- Credentials are never stored here; only campaign data, delivery logs and an
-- internally generated worker token (kept encrypted in Supabase Vault).

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.whatsapp_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  message text not null check (char_length(btrim(message)) between 1 and 4000),
  audience text not null default 'all_members'
    check (audience in ('all_members')),
  schedule_type text not null
    check (schedule_type in ('once', 'weekly')),
  scheduled_at timestamptz,
  weekdays smallint[],
  send_time time without time zone,
  timezone text not null default 'America/Sao_Paulo',
  status text not null default 'scheduled'
    check (status in ('scheduled', 'processing', 'paused', 'completed', 'error')),
  next_run_at timestamptz,
  processing_started_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  last_run_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (
      schedule_type = 'once'
      and scheduled_at is not null
      and weekdays is null
      and send_time is null
    )
    or
    (
      schedule_type = 'weekly'
      and scheduled_at is null
      and weekdays is not null
      and cardinality(weekdays) between 1 and 7
      and send_time is not null
    )
  ),
  check (
    weekdays is null
    or weekdays <@ array[0,1,2,3,4,5,6]::smallint[]
  )
);

create index if not exists whatsapp_campaigns_due_idx
  on public.whatsapp_campaigns (next_run_at)
  where status = 'scheduled';

create index if not exists whatsapp_campaigns_created_at_idx
  on public.whatsapp_campaigns (created_at desc);

create table if not exists public.whatsapp_deliveries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.whatsapp_campaigns(id) on delete cascade,
  member_id uuid references public.profiles(id) on delete set null,
  member_name text not null,
  phone text not null,
  scheduled_for timestamptz not null,
  status text not null default 'queued'
    check (status in ('queued', 'sent', 'received', 'read', 'failed', 'skipped')),
  zapi_zaap_id text,
  zapi_message_id text,
  error text,
  sent_at timestamptz,
  status_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists whatsapp_deliveries_execution_recipient_uidx
  on public.whatsapp_deliveries (campaign_id, member_id, scheduled_for)
  where member_id is not null;

create index if not exists whatsapp_deliveries_campaign_idx
  on public.whatsapp_deliveries (campaign_id, created_at desc);

create index if not exists whatsapp_deliveries_status_ids_idx
  on public.whatsapp_deliveries (zapi_message_id)
  where zapi_message_id is not null;

create index if not exists whatsapp_deliveries_zaap_ids_idx
  on public.whatsapp_deliveries (zapi_zaap_id)
  where zapi_zaap_id is not null;

alter table public.whatsapp_campaigns enable row level security;
alter table public.whatsapp_deliveries enable row level security;

revoke all on public.whatsapp_campaigns from public, anon, authenticated;
revoke all on public.whatsapp_deliveries from public, anon, authenticated;

grant select, insert, update, delete on public.whatsapp_campaigns to authenticated;
grant select on public.whatsapp_deliveries to authenticated;

drop policy if exists "Administrators can read WhatsApp campaigns" on public.whatsapp_campaigns;
create policy "Administrators can read WhatsApp campaigns"
on public.whatsapp_campaigns
for select
to authenticated
using ((select public.current_user_is_admin()));

drop policy if exists "Administrators can create WhatsApp campaigns" on public.whatsapp_campaigns;
create policy "Administrators can create WhatsApp campaigns"
on public.whatsapp_campaigns
for insert
to authenticated
with check (
  (select public.current_user_is_admin())
  and created_by = (select auth.uid())
);

drop policy if exists "Administrators can update WhatsApp campaigns" on public.whatsapp_campaigns;
create policy "Administrators can update WhatsApp campaigns"
on public.whatsapp_campaigns
for update
to authenticated
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));

drop policy if exists "Administrators can delete WhatsApp campaigns" on public.whatsapp_campaigns;
create policy "Administrators can delete WhatsApp campaigns"
on public.whatsapp_campaigns
for delete
to authenticated
using ((select public.current_user_is_admin()));

drop policy if exists "Administrators can read WhatsApp deliveries" on public.whatsapp_deliveries;
create policy "Administrators can read WhatsApp deliveries"
on public.whatsapp_deliveries
for select
to authenticated
using ((select public.current_user_is_admin()));

create or replace function private.set_whatsapp_campaign_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_whatsapp_campaign_updated_at() from public, anon, authenticated;

drop trigger if exists set_whatsapp_campaign_updated_at on public.whatsapp_campaigns;
create trigger set_whatsapp_campaign_updated_at
before update on public.whatsapp_campaigns
for each row execute function private.set_whatsapp_campaign_updated_at();

create or replace function private.next_whatsapp_weekly_run(
  p_from timestamptz,
  p_weekdays smallint[],
  p_send_time time without time zone,
  p_timezone text
)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select min(
    (candidate.local_date + p_send_time) at time zone p_timezone
  )
  from (
    select generated_day::date as local_date
    from generate_series(
      (p_from at time zone p_timezone)::date,
      (p_from at time zone p_timezone)::date + 7,
      interval '1 day'
    ) as generated(generated_day)
  ) as candidate
  where extract(dow from candidate.local_date)::smallint = any(p_weekdays)
    and ((candidate.local_date + p_send_time) at time zone p_timezone) > p_from;
$$;

revoke all on function private.next_whatsapp_weekly_run(
  timestamptz, smallint[], time without time zone, text
) from public, anon, authenticated;

create or replace function public.admin_create_whatsapp_campaign(
  p_title text,
  p_message text,
  p_schedule_type text,
  p_scheduled_local timestamp without time zone default null,
  p_weekdays smallint[] default null,
  p_send_time time without time zone default null,
  p_timezone text default 'America/Sao_Paulo'
)
returns public.whatsapp_campaigns
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_campaign public.whatsapp_campaigns;
  v_scheduled_at timestamptz;
  v_next_run_at timestamptz;
  v_weekdays smallint[];
begin
  if not public.current_user_is_admin() then
    raise insufficient_privilege using message = 'Administrative access required.';
  end if;

  if char_length(btrim(coalesce(p_title, ''))) not between 1 and 120 then
    raise invalid_parameter_value using message = 'Informe um título de até 120 caracteres.';
  end if;

  if char_length(btrim(coalesce(p_message, ''))) not between 1 and 4000 then
    raise invalid_parameter_value using message = 'Informe uma mensagem de até 4000 caracteres.';
  end if;

  perform now() at time zone p_timezone;

  if p_schedule_type = 'once' then
    if p_scheduled_local is null then
      raise invalid_parameter_value using message = 'Informe a data e o horário do envio.';
    end if;

    v_scheduled_at := p_scheduled_local at time zone p_timezone;
    if v_scheduled_at <= now() then
      raise invalid_parameter_value using message = 'O agendamento precisa estar no futuro.';
    end if;
    v_next_run_at := v_scheduled_at;
    v_weekdays := null;
    p_send_time := null;
  elsif p_schedule_type = 'weekly' then
    select array_agg(distinct day_value order by day_value)
    into v_weekdays
    from unnest(coalesce(p_weekdays, array[]::smallint[])) as day_list(day_value)
    where day_value between 0 and 6;

    if coalesce(cardinality(v_weekdays), 0) = 0 or p_send_time is null then
      raise invalid_parameter_value using message = 'Selecione ao menos um dia da semana e um horário.';
    end if;

    v_scheduled_at := null;
    v_next_run_at := private.next_whatsapp_weekly_run(
      now(),
      v_weekdays,
      p_send_time,
      p_timezone
    );

    if v_next_run_at is null then
      raise invalid_parameter_value using message = 'Não foi possível calcular a próxima execução.';
    end if;
  else
    raise invalid_parameter_value using message = 'Tipo de agendamento inválido.';
  end if;

  insert into public.whatsapp_campaigns (
    title,
    message,
    audience,
    schedule_type,
    scheduled_at,
    weekdays,
    send_time,
    timezone,
    status,
    next_run_at,
    created_by
  )
  values (
    btrim(p_title),
    btrim(p_message),
    'all_members',
    p_schedule_type,
    v_scheduled_at,
    v_weekdays,
    p_send_time,
    p_timezone,
    'scheduled',
    v_next_run_at,
    (select auth.uid())
  )
  returning * into v_campaign;

  return v_campaign;
end;
$$;

revoke all on function public.admin_create_whatsapp_campaign(
  text, text, text, timestamp without time zone, smallint[], time without time zone, text
) from public, anon, authenticated;
grant execute on function public.admin_create_whatsapp_campaign(
  text, text, text, timestamp without time zone, smallint[], time without time zone, text
) to authenticated;

create or replace function public.admin_set_whatsapp_campaign_status(
  p_campaign_id uuid,
  p_status text
)
returns public.whatsapp_campaigns
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_campaign public.whatsapp_campaigns;
  v_next timestamptz;
begin
  if not public.current_user_is_admin() then
    raise insufficient_privilege using message = 'Administrative access required.';
  end if;

  if p_status not in ('paused', 'scheduled') then
    raise invalid_parameter_value using message = 'Status administrativo inválido.';
  end if;

  select *
  into v_campaign
  from public.whatsapp_campaigns
  where id = p_campaign_id
  for update;

  if not found then
    raise no_data_found using message = 'Campanha não encontrada.';
  end if;

  if p_status = 'scheduled' then
    if v_campaign.schedule_type = 'once' then
      if v_campaign.scheduled_at is null or v_campaign.scheduled_at <= now() then
        raise invalid_parameter_value using message = 'O horário desta mensagem única já passou.';
      end if;
      v_next := v_campaign.scheduled_at;
    else
      v_next := private.next_whatsapp_weekly_run(
        now(),
        v_campaign.weekdays,
        v_campaign.send_time,
        v_campaign.timezone
      );
    end if;
  else
    v_next := v_campaign.next_run_at;
  end if;

  update public.whatsapp_campaigns
  set
    status = p_status,
    next_run_at = v_next,
    processing_started_at = null,
    last_error = case when p_status = 'scheduled' then null else last_error end
  where id = p_campaign_id
  returning * into v_campaign;

  return v_campaign;
end;
$$;

revoke all on function public.admin_set_whatsapp_campaign_status(uuid, text)
from public, anon, authenticated;
grant execute on function public.admin_set_whatsapp_campaign_status(uuid, text)
to authenticated;

create or replace function public.claim_due_whatsapp_campaigns(
  p_limit integer default 2
)
returns setof public.whatsapp_campaigns
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  with due as (
    select campaign.id
    from public.whatsapp_campaigns as campaign
    where campaign.next_run_at is not null
      and campaign.next_run_at <= now()
      and (
        campaign.status = 'scheduled'
        or (
          campaign.status = 'processing'
          and campaign.processing_started_at < now() - interval '15 minutes'
        )
      )
    order by campaign.next_run_at asc
    for update skip locked
    limit least(greatest(coalesce(p_limit, 2), 1), 5)
  )
  update public.whatsapp_campaigns as campaign
  set
    status = 'processing',
    processing_started_at = now(),
    last_error = null
  from due
  where campaign.id = due.id
  returning campaign.*;
end;
$$;

revoke all on function public.claim_due_whatsapp_campaigns(integer)
from public, anon, authenticated;
grant execute on function public.claim_due_whatsapp_campaigns(integer)
to service_role;

create or replace function public.complete_whatsapp_campaign_run(
  p_campaign_id uuid,
  p_error text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_campaign public.whatsapp_campaigns;
  v_next timestamptz;
begin
  select *
  into v_campaign
  from public.whatsapp_campaigns
  where id = p_campaign_id
  for update;

  if not found then
    return;
  end if;

  if v_campaign.schedule_type = 'weekly' then
    v_next := private.next_whatsapp_weekly_run(
      now() + interval '1 second',
      v_campaign.weekdays,
      v_campaign.send_time,
      v_campaign.timezone
    );

    update public.whatsapp_campaigns
    set
      status = 'scheduled',
      next_run_at = v_next,
      processing_started_at = null,
      last_run_at = now(),
      last_error = nullif(left(coalesce(p_error, ''), 1000), '')
    where id = p_campaign_id;
  else
    update public.whatsapp_campaigns
    set
      status = 'completed',
      next_run_at = null,
      processing_started_at = null,
      last_run_at = now(),
      last_error = nullif(left(coalesce(p_error, ''), 1000), '')
    where id = p_campaign_id;
  end if;
end;
$$;

revoke all on function public.complete_whatsapp_campaign_run(uuid, text)
from public, anon, authenticated;
grant execute on function public.complete_whatsapp_campaign_run(uuid, text)
to service_role;

create or replace function public.fail_whatsapp_campaign_run(
  p_campaign_id uuid,
  p_error text
)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.whatsapp_campaigns
  set
    status = 'error',
    processing_started_at = null,
    last_error = left(coalesce(p_error, 'Erro no processamento.'), 1000)
  where id = p_campaign_id;
$$;

revoke all on function public.fail_whatsapp_campaign_run(uuid, text)
from public, anon, authenticated;
grant execute on function public.fail_whatsapp_campaign_run(uuid, text)
to service_role;

create table if not exists private.whatsapp_worker_auth (
  id boolean primary key default true check (id),
  token_hash text not null,
  updated_at timestamptz not null default now()
);

create table if not exists private.whatsapp_worker_config (
  id boolean primary key default true check (id),
  worker_url text,
  updated_at timestamptz not null default now()
);

do $$
declare
  v_secret text;
begin
  select decrypted_secret
  into v_secret
  from vault.decrypted_secrets
  where name = 'pib_whatsapp_worker_token'
  limit 1;

  if v_secret is null then
    v_secret := encode(extensions.gen_random_bytes(32), 'hex');
    perform vault.create_secret(
      v_secret,
      'pib_whatsapp_worker_token',
      'PIB Jussara WhatsApp pg_cron worker token'
    );
  end if;

  insert into private.whatsapp_worker_auth (id, token_hash)
  values (
    true,
    encode(extensions.digest(v_secret, 'sha256'), 'hex')
  )
  on conflict (id) do update
  set
    token_hash = excluded.token_hash,
    updated_at = now();
end;
$$;

insert into private.whatsapp_worker_config (id, worker_url)
values (
  true,
  'https://pib-jussara-home.lovable.app/api/cron/whatsapp'
)
on conflict (id) do nothing;

create or replace function public.verify_whatsapp_worker_token(p_token text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.whatsapp_worker_auth
    where id = true
      and token_hash = encode(
        extensions.digest(coalesce(p_token, ''), 'sha256'),
        'hex'
      )
  );
$$;

revoke all on function public.verify_whatsapp_worker_token(text)
from public, anon, authenticated;
grant execute on function public.verify_whatsapp_worker_token(text)
to service_role;

create or replace function public.configure_whatsapp_worker_url(p_url text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_url is null
    or char_length(p_url) > 1000
    or p_url !~ '^https://'
  then
    raise invalid_parameter_value using message = 'Worker URL must use HTTPS.';
  end if;

  insert into private.whatsapp_worker_config (id, worker_url)
  values (true, p_url)
  on conflict (id) do update
  set worker_url = excluded.worker_url, updated_at = now();
end;
$$;

revoke all on function public.configure_whatsapp_worker_url(text)
from public, anon, authenticated;
grant execute on function public.configure_whatsapp_worker_url(text)
to service_role;

create extension if not exists pg_net;
create extension if not exists pg_cron;

create or replace function private.invoke_whatsapp_worker()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_token text;
begin
  select worker_url
  into v_url
  from private.whatsapp_worker_config
  where id = true;

  select decrypted_secret
  into v_token
  from vault.decrypted_secrets
  where name = 'pib_whatsapp_worker_token'
  limit 1;

  if v_url is null or v_token is null then
    return;
  end if;

  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_token
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 50000
  );
end;
$$;

revoke all on function private.invoke_whatsapp_worker()
from public, anon, authenticated;

do $$
begin
  if not exists (
    select 1
    from cron.job
    where jobname = 'pib-whatsapp-worker-every-minute'
  ) then
    perform cron.schedule(
      'pib-whatsapp-worker-every-minute',
      '* * * * *',
      'select private.invoke_whatsapp_worker();'
    );
  end if;
end;
$$;
