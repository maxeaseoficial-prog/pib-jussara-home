-- Campaign targeting, weekly start dates and secure Z-API credentials stored in Supabase Vault.

-- ---------------------------------------------------------------------------
-- Z-API credentials: service-role-only helpers backed by Supabase Vault.
-- ---------------------------------------------------------------------------

create or replace function private.put_vault_secret(
  p_name text,
  p_value text,
  p_description text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if nullif(btrim(coalesce(p_value, '')), '') is null then
    raise invalid_parameter_value using message = 'Secret value cannot be empty.';
  end if;

  delete from vault.secrets where name = p_name;
  perform vault.create_secret(p_value, p_name, p_description);
end;
$$;

revoke all on function private.put_vault_secret(text, text, text)
from public, anon, authenticated;

create or replace function public.service_save_zapi_configuration(
  p_instance_id text,
  p_instance_token text,
  p_client_token text,
  p_base_url text default 'https://api.z-api.io'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_webhook_secret text;
  v_base_url text := regexp_replace(btrim(coalesce(p_base_url, '')), '/+$', '');
begin
  if char_length(btrim(coalesce(p_instance_id, ''))) not between 2 and 300 then
    raise invalid_parameter_value using message = 'Instance ID inválido.';
  end if;
  if char_length(btrim(coalesce(p_instance_token, ''))) not between 8 and 1000 then
    raise invalid_parameter_value using message = 'Instance Token inválido.';
  end if;
  if char_length(btrim(coalesce(p_client_token, ''))) not between 8 and 1000 then
    raise invalid_parameter_value using message = 'Client Token inválido.';
  end if;
  if v_base_url !~ '^https://[^[:space:]]+$' or char_length(v_base_url) > 500 then
    raise invalid_parameter_value using message = 'A URL base da Z-API precisa usar HTTPS.';
  end if;

  select decrypted_secret
  into v_webhook_secret
  from vault.decrypted_secrets
  where name = 'pib_zapi_webhook_secret'
  limit 1;

  if v_webhook_secret is null then
    v_webhook_secret := encode(extensions.gen_random_bytes(32), 'hex');
    perform private.put_vault_secret(
      'pib_zapi_webhook_secret',
      v_webhook_secret,
      'PIB Jussara Z-API webhook authentication secret'
    );
  end if;

  perform private.put_vault_secret(
    'pib_zapi_instance_id',
    btrim(p_instance_id),
    'PIB Jussara Z-API instance ID'
  );
  perform private.put_vault_secret(
    'pib_zapi_instance_token',
    btrim(p_instance_token),
    'PIB Jussara Z-API instance token'
  );
  perform private.put_vault_secret(
    'pib_zapi_client_token',
    btrim(p_client_token),
    'PIB Jussara Z-API client token'
  );
  perform private.put_vault_secret(
    'pib_zapi_base_url',
    v_base_url,
    'PIB Jussara Z-API base URL'
  );
end;
$$;

revoke all on function public.service_save_zapi_configuration(text, text, text, text)
from public, anon, authenticated;
grant execute on function public.service_save_zapi_configuration(text, text, text, text)
to service_role;

create or replace function public.service_get_zapi_configuration()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'instanceId', (select decrypted_secret from vault.decrypted_secrets where name = 'pib_zapi_instance_id' limit 1),
    'instanceToken', (select decrypted_secret from vault.decrypted_secrets where name = 'pib_zapi_instance_token' limit 1),
    'clientToken', (select decrypted_secret from vault.decrypted_secrets where name = 'pib_zapi_client_token' limit 1),
    'baseUrl', coalesce(
      (select decrypted_secret from vault.decrypted_secrets where name = 'pib_zapi_base_url' limit 1),
      'https://api.z-api.io'
    ),
    'webhookSecret', (select decrypted_secret from vault.decrypted_secrets where name = 'pib_zapi_webhook_secret' limit 1)
  );
$$;

revoke all on function public.service_get_zapi_configuration()
from public, anon, authenticated;
grant execute on function public.service_get_zapi_configuration()
to service_role;

-- ---------------------------------------------------------------------------
-- Campaign audiences and weekly start dates.
-- ---------------------------------------------------------------------------

alter table public.whatsapp_campaigns
  drop constraint if exists whatsapp_campaigns_audience_check;

alter table public.whatsapp_campaigns
  add constraint whatsapp_campaigns_audience_check
  check (audience in ('all_members', 'selected_members'));

alter table public.whatsapp_campaigns
  add column if not exists start_date date;

update public.whatsapp_campaigns
set start_date = (coalesce(next_run_at, created_at) at time zone timezone)::date
where schedule_type = 'weekly' and start_date is null;

alter table public.whatsapp_campaigns
  drop constraint if exists whatsapp_campaigns_weekly_start_date_check;

alter table public.whatsapp_campaigns
  add constraint whatsapp_campaigns_weekly_start_date_check
  check (
    (schedule_type = 'once' and start_date is null)
    or
    (schedule_type = 'weekly' and start_date is not null)
  );

create table if not exists public.whatsapp_campaign_members (
  campaign_id uuid not null references public.whatsapp_campaigns(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (campaign_id, member_id)
);

create index if not exists whatsapp_campaign_members_member_idx
  on public.whatsapp_campaign_members (member_id, campaign_id);

alter table public.whatsapp_campaign_members enable row level security;
revoke all on public.whatsapp_campaign_members from public, anon, authenticated;
grant select on public.whatsapp_campaign_members to authenticated;

drop policy if exists "Administrators can read WhatsApp campaign members"
  on public.whatsapp_campaign_members;
create policy "Administrators can read WhatsApp campaign members"
on public.whatsapp_campaign_members
for select
to authenticated
using ((select public.current_user_is_admin()));

create or replace function private.next_whatsapp_weekly_run_from_start(
  p_from timestamptz,
  p_start_date date,
  p_weekdays smallint[],
  p_send_time time without time zone,
  p_timezone text
)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  with bounds as (
    select greatest(
      p_start_date,
      (p_from at time zone p_timezone)::date
    ) as first_day
  )
  select min((candidate.local_date + p_send_time) at time zone p_timezone)
  from bounds
  cross join lateral (
    select generated_day::date as local_date
    from generate_series(
      bounds.first_day,
      bounds.first_day + 7,
      interval '1 day'
    ) as generated(generated_day)
  ) as candidate
  where extract(dow from candidate.local_date)::smallint = any(p_weekdays)
    and ((candidate.local_date + p_send_time) at time zone p_timezone) > p_from;
$$;

revoke all on function private.next_whatsapp_weekly_run_from_start(
  timestamptz, date, smallint[], time without time zone, text
) from public, anon, authenticated;

-- Disable the older campaign creator for authenticated clients. It remains in
-- place only so already-deployed code cannot fail during the rolling release.
revoke execute on function public.admin_create_whatsapp_campaign(
  text, text, text, timestamp without time zone, smallint[], time without time zone, text
) from authenticated;

create or replace function public.admin_create_whatsapp_campaign_v2(
  p_title text,
  p_message text,
  p_audience text,
  p_member_ids uuid[] default null,
  p_schedule_type text default 'once',
  p_scheduled_local timestamp without time zone default null,
  p_weekdays smallint[] default null,
  p_send_time time without time zone default null,
  p_start_date date default null,
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
  v_member_ids uuid[];
  v_member_count integer;
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

  if p_audience not in ('all_members', 'selected_members') then
    raise invalid_parameter_value using message = 'Público da campanha inválido.';
  end if;

  perform now() at time zone p_timezone;

  if p_audience = 'selected_members' then
    select array_agg(distinct member_id order by member_id)
    into v_member_ids
    from unnest(coalesce(p_member_ids, array[]::uuid[])) as selected(member_id);

    if coalesce(cardinality(v_member_ids), 0) = 0 then
      raise invalid_parameter_value using message = 'Selecione ao menos um membro.';
    end if;

    select count(*)::integer
    into v_member_count
    from public.profiles
    where id = any(v_member_ids);

    if v_member_count <> cardinality(v_member_ids) then
      raise invalid_parameter_value using message = 'Um ou mais membros selecionados não existem.';
    end if;
  else
    v_member_ids := null;
  end if;

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
    p_start_date := null;
  elsif p_schedule_type = 'weekly' then
    select array_agg(distinct day_value order by day_value)
    into v_weekdays
    from unnest(coalesce(p_weekdays, array[]::smallint[])) as day_list(day_value)
    where day_value between 0 and 6;

    if coalesce(cardinality(v_weekdays), 0) = 0 or p_send_time is null then
      raise invalid_parameter_value using message = 'Selecione ao menos um dia da semana e um horário.';
    end if;

    if p_start_date is null then
      raise invalid_parameter_value using message = 'Informe a data de início da campanha semanal.';
    end if;

    v_scheduled_at := null;
    v_next_run_at := private.next_whatsapp_weekly_run_from_start(
      now(),
      p_start_date,
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
    start_date,
    timezone,
    status,
    next_run_at,
    created_by
  )
  values (
    btrim(p_title),
    btrim(p_message),
    p_audience,
    p_schedule_type,
    v_scheduled_at,
    v_weekdays,
    p_send_time,
    p_start_date,
    p_timezone,
    'scheduled',
    v_next_run_at,
    (select auth.uid())
  )
  returning * into v_campaign;

  if p_audience = 'selected_members' then
    insert into public.whatsapp_campaign_members (campaign_id, member_id)
    select v_campaign.id, member_id
    from unnest(v_member_ids) as selected(member_id)
    on conflict do nothing;
  end if;

  return v_campaign;
end;
$$;

revoke all on function public.admin_create_whatsapp_campaign_v2(
  text, text, text, uuid[], text, timestamp without time zone, smallint[], time without time zone, date, text
) from public, anon, authenticated;
grant execute on function public.admin_create_whatsapp_campaign_v2(
  text, text, text, uuid[], text, timestamp without time zone, smallint[], time without time zone, date, text
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

  select * into v_campaign
  from public.whatsapp_campaigns
  where id = p_campaign_id
  for update;

  if not found then
    raise no_data_found using message = 'Campanha não encontrada.';
  end if;

  if p_status = 'scheduled' then
    if v_campaign.schedule_type = 'once' then
      if v_campaign.scheduled_at is null or v_campaign.scheduled_at <= now() then
        raise invalid_parameter_value using message = 'O horário desta campanha única já passou.';
      end if;
      v_next := v_campaign.scheduled_at;
    else
      v_next := private.next_whatsapp_weekly_run_from_start(
        now(),
        v_campaign.start_date,
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
  select * into v_campaign
  from public.whatsapp_campaigns
  where id = p_campaign_id
  for update;

  if not found then
    return;
  end if;

  if v_campaign.schedule_type = 'weekly' then
    v_next := private.next_whatsapp_weekly_run_from_start(
      now() + interval '1 second',
      v_campaign.start_date,
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
