# WhatsApp / Z-API — PIB Jussara

## Visão geral

A central fica em `/adm/mensagens` e funciona como uma área de **campanhas de mensagem**.

- O administrador configura a Z-API diretamente no painel.
- As credenciais são enviadas somente para o backend e armazenadas no Supabase Vault.
- O navegador nunca recebe Instance Token, Client Token ou segredo do webhook depois do salvamento.
- O WhatsApp da igreja é vinculado à instância pelo QR Code da Z-API.
- Campanhas podem atingir todos os membros ou uma seleção individual de membros cadastrados.
- O banco agenda as execuções e um worker protegido envia as mensagens quando chega o horário.
- O webhook atualiza o histórico para `sent`, `received`, `read` ou `failed`.

A Z-API é usada para conexão e envio; o agendamento pertence à aplicação.

## Configuração da API pelo painel

Abra `/adm/mensagens` e clique em **Conectar API**.

O formulário solicita:

- Instance ID
- Instance Token
- Client Token
- Base URL, com padrão `https://api.z-api.io`

Ao salvar, o backend testa a instância consultando o status da Z-API. Somente depois de uma resposta válida as credenciais são persistidas no Vault.

O segredo do webhook é gerado automaticamente no servidor na primeira configuração e reutilizado. O administrador não precisa informá-lo.

As variáveis `ZAPI_INSTANCE_ID`, `ZAPI_INSTANCE_TOKEN`, `ZAPI_CLIENT_TOKEN`, `ZAPI_WEBHOOK_SECRET` e `ZAPI_BASE_URL` continuam aceitas apenas como fallback para instalações antigas; o fluxo normal é pelo painel.

## Campanhas

### Público

Uma campanha usa um destes públicos:

- `all_members`: todos os membros cadastrados em `profiles`.
- `selected_members`: somente os membros vinculados em `whatsapp_campaign_members`.

A seleção individual é feita no painel através de uma lista pesquisável dos membros reais.

### Frequência

- `once`: data e horário únicos no fuso `America/Sao_Paulo`.
- `weekly`: um ou mais dias da semana, horário e **data de início obrigatória**.

A próxima execução de uma campanha semanal nunca é calculada antes da sua `start_date`.

## Execução

- O worker `/api/cron/whatsapp` é chamado pelo `pg_cron`/`pg_net`.
- `claim_due_whatsapp_campaigns` evita que dois workers assumam a mesma campanha ao mesmo tempo.
- `whatsapp_deliveries` tem proteção de unicidade por campanha, membro e execução para impedir duplicidade.
- Para `selected_members`, o worker consulta `whatsapp_campaign_members` antes de carregar os perfis.
- Campanhas semanais calculam a execução seguinte ao final de cada rodada.

## Segurança

- Apenas `profiles.role = 'admin'` pode configurar a integração, criar campanhas e consultar histórico.
- As credenciais da Z-API não ficam em tabelas públicas, `localStorage`, variáveis `VITE_` ou respostas ao frontend.
- Segredos são armazenados no Supabase Vault.
- A interface recebe somente metadados, como `configured`, status da conexão e um Instance ID mascarado.
- Tokens e segredos não são escritos nos logs da aplicação.
- O worker usa um token próprio armazenado no Vault.

## Endpoints Z-API usados

- `GET /instances/{instanceId}/token/{token}/status`
- `GET /instances/{instanceId}/token/{token}/qr-code`
- `POST /instances/{instanceId}/token/{token}/send-text`
- `PUT /instances/{instanceId}/token/{token}/update-webhook-message-status`

Os requests usam o header `Client-Token`. Telefones são normalizados para o formato internacional antes do envio.

## Migrations

A infraestrutura foi dividida em migrations incrementais:

1. `20260916104000_zapi_whatsapp_messaging.sql` — campanhas, entregas, worker e cron.
2. `20260916111500_campaigns_and_zapi_vault.sql` — públicos segmentados, `start_date` semanal e configuração Z-API via Vault.

## Operação responsável

Use a central apenas para comunicações esperadas pelos membros da igreja. Volume, frequência e conteúdo devem respeitar as políticas aplicáveis do WhatsApp e da Z-API.
