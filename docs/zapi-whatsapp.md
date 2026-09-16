# WhatsApp / Z-API — PIB Jussara

## Arquitetura

A central de mensagens fica em `/adm/mensagens`.

- O navegador acessa somente campanhas, histórico e endpoints internos do próprio site.
- `ZAPI_INSTANCE_ID`, `ZAPI_INSTANCE_TOKEN`, `ZAPI_CLIENT_TOKEN` e `ZAPI_WEBHOOK_SECRET` são lidos apenas no servidor.
- O número da igreja é vinculado à instância Z-API pelo QR Code.
- Campanhas são armazenadas no Supabase com RLS administrativo.
- Um worker protegido processa campanhas vencidas e registra uma entrega por membro/execução.
- O banco usa `pg_cron` + `pg_net` para chamar o worker a cada minuto. O token do worker é gerado na migration e fica criptografado no Supabase Vault.
- O webhook da Z-API atualiza entregas para `sent`, `received`, `read` ou `failed`.

A Z-API não é o agendador. O agendamento pertence à aplicação; quando chega o horário, o worker chama o endpoint `send-text` da Z-API.

## Variáveis de ambiente

Configure no ambiente **server-side** do projeto:

```text
ZAPI_INSTANCE_ID=
ZAPI_INSTANCE_TOKEN=
ZAPI_CLIENT_TOKEN=
ZAPI_WEBHOOK_SECRET=
ZAPI_BASE_URL=https://api.z-api.io
```

Não use prefixo `VITE_` nessas variáveis. Isso impediria que os segredos fossem enviados ao bundle do navegador.

As credenciais da instância são obtidas no painel da Z-API. A instância precisa existir antes de o administrador conectar o WhatsApp pelo QR Code.

## Fluxo de ativação

1. Aplicar a migration `20260916104000_zapi_whatsapp_messaging.sql`.
2. Publicar a versão do site contendo os endpoints `/api/admin/zapi`, `/api/cron/whatsapp` e `/api/webhooks/zapi/status`.
3. Adicionar as quatro variáveis Z-API no ambiente do servidor.
4. Abrir `/adm/mensagens`.
5. Clicar em **Conectar WhatsApp** e ler o QR Code com o WhatsApp da igreja.
6. Depois que o status aparecer como conectado, clicar em **Ativar status de entrega** para registrar o webhook de status na Z-API.
7. Criar um agendamento futuro e acompanhar a execução no histórico.

## Agendamento

- `once`: data e horário únicos no fuso `America/Sao_Paulo`.
- `weekly`: um ou mais dias da semana + horário.
- O worker é chamado a cada minuto.
- A função `claim_due_whatsapp_campaigns` usa lock/claim para impedir que dois workers assumam a mesma campanha ao mesmo tempo.
- A tabela `whatsapp_deliveries` possui índice único por campanha, membro e horário da execução para evitar envio duplicado.
- Uma campanha semanal calcula a próxima execução no banco depois de cada rodada.

## Segurança

- Apenas administradores podem criar/alterar campanhas e consultar entregas.
- Credenciais Z-API nunca são persistidas nas tabelas nem retornadas à interface.
- O cron usa token gerado no banco e armazenado no Supabase Vault.
- O webhook exige `ZAPI_WEBHOOK_SECRET`.
- O endpoint administrativo exige sessão Supabase válida e `profiles.role = 'admin'`.
- Erros técnicos não registram os tokens da Z-API.

## Endpoints Z-API usados

- `GET /instances/{instanceId}/token/{token}/status`
- `GET /instances/{instanceId}/token/{token}/qr-code`
- `POST /instances/{instanceId}/token/{token}/send-text`
- `PUT /instances/{instanceId}/token/{token}/update-webhook-message-status`

Os requests usam o header `Client-Token`. O envio de texto usa telefone somente com dígitos em formato internacional e `delayMessage: 5`.

## Operação responsável

Envie mensagens somente a pessoas que esperam receber comunicações da igreja. Não use a central para listas adquiridas, prospecção ou disparos não solicitados. Volume, frequência e conteúdo devem respeitar as políticas do WhatsApp e da Z-API.
