"use client";

import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Clock3,
  LoaderCircle,
  MessageSquareText,
  Pause,
  Play,
  QrCode,
  RefreshCw,
  Send,
  Trash2,
  UsersRound,
  Webhook,
  Wifi,
  WifiOff,
} from "lucide-react";
import { AdminPageHeader } from "@/admin/AdminPageHeader";
import { adminQueryKeys, loadAdminMemberCount } from "@/admin/admin-data";
import {
  configureZapiStatusWebhook,
  createWhatsappCampaign,
  deleteWhatsappCampaign,
  loadWhatsappCampaigns,
  loadWhatsappDeliveries,
  loadZapiQrCode,
  loadZapiStatus,
  setWhatsappCampaignStatus,
  whatsappQueryKeys,
  type WhatsappCampaign,
} from "@/admin/whatsapp-data";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/adm/mensagens")({
  component: AdminMessages,
});

const weekdayOptions = [
  { value: 1, short: "Seg", long: "segunda-feira" },
  { value: 2, short: "Ter", long: "terça-feira" },
  { value: 3, short: "Qua", long: "quarta-feira" },
  { value: 4, short: "Qui", long: "quinta-feira" },
  { value: 5, short: "Sex", long: "sexta-feira" },
  { value: 6, short: "Sáb", long: "sábado" },
  { value: 0, short: "Dom", long: "domingo" },
] as const;

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateTimeFormatter.format(date);
}

function formatTime(value: string | null) {
  if (!value) return "—";
  return value.slice(0, 5);
}

function campaignScheduleLabel(campaign: WhatsappCampaign) {
  if (campaign.schedule_type === "once") {
    return `Uma vez · ${formatDateTime(campaign.scheduled_at)}`;
  }

  const days = weekdayOptions
    .filter((day) => campaign.weekdays?.includes(day.value))
    .map((day) => day.short)
    .join(", ");

  return `${days || "Sem dias"} · ${formatTime(campaign.send_time)}`;
}

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 4) return "••••";
  return `${"•".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
}

const campaignStatusLabel: Record<WhatsappCampaign["status"], string> = {
  scheduled: "Agendada",
  processing: "Enviando",
  paused: "Pausada",
  completed: "Concluída",
  error: "Com erro",
};

function campaignBadgeClass(status: WhatsappCampaign["status"]) {
  if (status === "scheduled") return "bg-emerald-50 text-emerald-800";
  if (status === "processing") return "bg-blue-50 text-blue-800";
  if (status === "paused") return "bg-amber-50 text-amber-800";
  if (status === "completed") return "bg-slate-100 text-slate-700";
  return "bg-red-50 text-red-800";
}

function deliveryBadgeClass(status: string) {
  if (status === "read" || status === "received") return "bg-emerald-50 text-emerald-800";
  if (status === "sent") return "bg-blue-50 text-blue-800";
  if (status === "queued") return "bg-slate-100 text-slate-700";
  if (status === "skipped") return "bg-amber-50 text-amber-800";
  return "bg-red-50 text-red-800";
}

const deliveryStatusLabel: Record<string, string> = {
  queued: "Na fila",
  sent: "Enviado",
  received: "Recebido",
  read: "Lido",
  failed: "Falhou",
  skipped: "Pulado",
};

function AdminMessages() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [scheduleType, setScheduleType] = useState<"once" | "weekly">("once");
  const [sendDate, setSendDate] = useState("");
  const [sendTime, setSendTime] = useState("");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [feedback, setFeedback] = useState("");

  const memberCount = useQuery({
    queryKey: adminQueryKeys.memberCount,
    queryFn: ({ signal }) => loadAdminMemberCount(signal),
  });

  const zapiStatus = useQuery({
    queryKey: whatsappQueryKeys.status,
    queryFn: loadZapiStatus,
    refetchInterval: 30_000,
    retry: 1,
  });

  const campaigns = useQuery({
    queryKey: whatsappQueryKeys.campaigns,
    queryFn: ({ signal }) => loadWhatsappCampaigns(signal),
  });

  const deliveries = useQuery({
    queryKey: whatsappQueryKeys.deliveries,
    queryFn: ({ signal }) => loadWhatsappDeliveries(signal),
  });

  const qrMutation = useMutation({
    mutationFn: loadZapiQrCode,
  });

  const webhookMutation = useMutation({
    mutationFn: configureZapiStatusWebhook,
    onSuccess: () => setFeedback("Webhook de status configurado com sucesso."),
  });

  const createMutation = useMutation({
    mutationFn: createWhatsappCampaign,
    onSuccess: async () => {
      setTitle("");
      setMessage("");
      setSendDate("");
      setSendTime("");
      setWeekdays([]);
      setFeedback("Mensagem agendada com sucesso.");
      await queryClient.invalidateQueries({ queryKey: whatsappQueryKeys.campaigns });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "paused" | "scheduled" }) =>
      setWhatsappCampaignStatus(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: whatsappQueryKeys.campaigns });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWhatsappCampaign,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: whatsappQueryKeys.campaigns }),
        queryClient.invalidateQueries({ queryKey: whatsappQueryKeys.deliveries }),
      ]);
    },
  });

  const campaignTitles = useMemo(
    () => new Map((campaigns.data ?? []).map((campaign) => [campaign.id, campaign.title])),
    [campaigns.data],
  );

  const connected = zapiStatus.data?.configured === true && zapiStatus.data.connected === true;
  const formReady =
    connected &&
    title.trim().length > 0 &&
    message.trim().length > 0 &&
    (scheduleType === "once"
      ? Boolean(sendDate && sendTime)
      : Boolean(sendTime && weekdays.length > 0));

  const toggleWeekday = (day: number) => {
    setWeekdays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day],
    );
  };

  const handleCreate = () => {
    setFeedback("");
    if (!formReady) return;

    createMutation.mutate({
      title: title.trim(),
      message: message.trim(),
      scheduleType,
      scheduledLocal: scheduleType === "once" ? `${sendDate}T${sendTime}:00` : null,
      weekdays: scheduleType === "weekly" ? weekdays : null,
      sendTime: scheduleType === "weekly" ? `${sendTime}:00` : null,
    });
  };

  const handleDelete = (campaign: WhatsappCampaign) => {
    if (
      window.confirm(
        `Excluir "${campaign.title}"? O histórico de entregas desta campanha também será removido.`,
      )
    ) {
      deleteMutation.mutate(campaign.id);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Mensagens"
        description="Conecte o WhatsApp da igreja e programe comunicações para os membros cadastrados."
      />

      <section className="mt-9 rounded-2xl border border-border bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-surface-soft text-green-700">
              {connected ? (
                <Wifi className="h-6 w-6" strokeWidth={1.7} aria-hidden="true" />
              ) : (
                <WifiOff className="h-6 w-6" strokeWidth={1.7} aria-hidden="true" />
              )}
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-green-950">WhatsApp da igreja</h2>
              {zapiStatus.isPending ? (
                <p className="mt-2 text-sm text-text-secondary">Verificando conexão…</p>
              ) : zapiStatus.isError ? (
                <p className="mt-2 text-sm font-semibold text-red-800">
                  Não foi possível verificar a integração.
                </p>
              ) : !zapiStatus.data?.configured ? (
                <div className="mt-2">
                  <p className="text-sm font-semibold text-amber-800">Configuração pendente</p>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-text-secondary">
                    Adicione as credenciais Z-API no ambiente do servidor. Nenhum token é exibido
                    ou salvo neste painel.
                  </p>
                </div>
              ) : connected ? (
                <div className="mt-2">
                  <p className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Conectado
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">
                    O número vinculado à instância está pronto para os agendamentos.
                  </p>
                </div>
              ) : (
                <div className="mt-2">
                  <p className="text-sm font-semibold text-amber-800">Desconectado</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    Gere o QR Code e leia com o WhatsApp da igreja.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void zapiStatus.refetch()}
              disabled={zapiStatus.isFetching}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-bold text-green-900 transition-colors hover:bg-surface-soft disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${zapiStatus.isFetching ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
              Atualizar status
            </button>

            {zapiStatus.data?.configured && !connected ? (
              <button
                type="button"
                onClick={() => qrMutation.mutate()}
                disabled={qrMutation.isPending}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-green-900 px-4 text-sm font-bold text-white transition-colors hover:bg-green-950 disabled:opacity-60"
              >
                {qrMutation.isPending ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <QrCode className="h-4 w-4" aria-hidden="true" />
                )}
                Conectar WhatsApp
              </button>
            ) : null}

            {connected ? (
              <button
                type="button"
                onClick={() => webhookMutation.mutate()}
                disabled={webhookMutation.isPending}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-bold text-green-900 transition-colors hover:bg-surface-soft disabled:opacity-60"
              >
                <Webhook className="h-4 w-4" aria-hidden="true" />
                Ativar status de entrega
              </button>
            ) : null}
          </div>
        </div>

        {qrMutation.data?.value ? (
          <div className="mt-6 flex flex-col gap-5 rounded-2xl bg-surface-soft p-5 sm:flex-row sm:items-center">
            <img
              src={qrMutation.data.value}
              alt="QR Code para conectar o WhatsApp da igreja"
              className="h-48 w-48 rounded-xl bg-white object-contain p-2"
              width={192}
              height={192}
            />
            <div>
              <h3 className="font-extrabold text-green-950">Leia este QR Code no WhatsApp</h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary">
                Depois de concluir a leitura, use “Atualizar status”. O QR Code é solicitado
                diretamente à Z-API e não fica armazenado.
              </p>
            </div>
          </div>
        ) : null}

        {qrMutation.isError ? (
          <p className="mt-5 text-sm font-semibold text-red-800">
            {qrMutation.error instanceof Error ? qrMutation.error.message : "Falha ao gerar QR Code."}
          </p>
        ) : null}
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-white p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <MessageSquareText className="mt-0.5 h-5 w-5 text-green-700" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-extrabold text-green-950">Nova mensagem</h2>
            <p className="mt-1 text-sm leading-6 text-text-secondary">
              Crie uma comunicação única ou recorrente para todos os membros cadastrados.
            </p>
          </div>
        </div>

        <div className="mt-7 grid gap-6">
          <div>
            <label htmlFor="campaign-title" className="mb-2 block text-sm font-bold text-text-primary">
              Nome da campanha
            </label>
            <Input
              id="campaign-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              placeholder="Ex.: Aviso do culto de domingo"
              className="h-12 rounded-xl bg-white shadow-none"
            />
          </div>

          <div>
            <label htmlFor="campaign-message" className="mb-2 block text-sm font-bold text-text-primary">
              Mensagem
            </label>
            <Textarea
              id="campaign-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={4000}
              rows={6}
              placeholder="Digite a mensagem que será enviada aos membros."
              className="resize-y rounded-xl bg-white text-base shadow-none md:text-sm"
            />
            <p className="mt-2 text-right text-xs text-text-secondary tabular-nums">
              {message.length}/4000
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <span className="mb-2 block text-sm font-bold text-text-primary">Público</span>
              <div className="flex h-12 items-center gap-3 rounded-xl border border-border bg-surface-soft px-4">
                <UsersRound className="h-4 w-4 text-green-700" aria-hidden="true" />
                <span className="text-sm font-semibold text-text-primary">
                  Todos os membros cadastrados
                </span>
                <span className="ml-auto text-sm font-extrabold text-green-900 tabular-nums">
                  {memberCount.data ?? "—"}
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="schedule-type" className="mb-2 block text-sm font-bold text-text-primary">
                Frequência
              </label>
              <select
                id="schedule-type"
                value={scheduleType}
                onChange={(event) => {
                  setScheduleType(event.target.value as "once" | "weekly");
                  setSendDate("");
                  setSendTime("");
                  setWeekdays([]);
                }}
                className="h-12 w-full rounded-xl border border-border bg-white px-4 text-sm font-semibold text-text-primary outline-none focus:ring-2 focus:ring-green-700/20"
              >
                <option value="once">Agendar uma vez</option>
                <option value="weekly">Recorrente semanal</option>
              </select>
            </div>
          </div>

          {scheduleType === "once" ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="send-date" className="mb-2 block text-sm font-bold text-text-primary">
                  Data
                </label>
                <Input
                  id="send-date"
                  type="date"
                  value={sendDate}
                  onChange={(event) => setSendDate(event.target.value)}
                  className="h-12 rounded-xl bg-white shadow-none"
                />
              </div>
              <div>
                <label htmlFor="send-time-once" className="mb-2 block text-sm font-bold text-text-primary">
                  Horário
                </label>
                <Input
                  id="send-time-once"
                  type="time"
                  value={sendTime}
                  onChange={(event) => setSendTime(event.target.value)}
                  className="h-12 rounded-xl bg-white shadow-none"
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[1fr_14rem]">
              <div>
                <span className="mb-2 block text-sm font-bold text-text-primary">
                  Dias da semana
                </span>
                <div className="flex flex-wrap gap-2">
                  {weekdayOptions.map((day) => {
                    const active = weekdays.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleWeekday(day.value)}
                        aria-pressed={active}
                        title={day.long}
                        className={`h-11 min-w-12 rounded-xl border px-3 text-sm font-bold transition-colors ${
                          active
                            ? "border-green-900 bg-green-900 text-white"
                            : "border-border bg-white text-green-900 hover:bg-surface-soft"
                        }`}
                      >
                        {day.short}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label htmlFor="send-time-weekly" className="mb-2 block text-sm font-bold text-text-primary">
                  Horário
                </label>
                <Input
                  id="send-time-weekly"
                  type="time"
                  value={sendTime}
                  onChange={(event) => setSendTime(event.target.value)}
                  className="h-12 rounded-xl bg-white shadow-none"
                />
              </div>
            </div>
          )}

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xs leading-5 text-amber-900">
              Use esta central apenas para comunicações esperadas pelos membros que aceitaram
              receber mensagens da igreja. Evite envios excessivos ou conteúdo não solicitado.
            </p>
          </div>

          {(createMutation.isError || feedback || webhookMutation.isError) && (
            <div aria-live="polite">
              {createMutation.isError ? (
                <p className="text-sm font-semibold text-red-800">
                  {createMutation.error instanceof Error
                    ? createMutation.error.message
                    : "Não foi possível agendar a mensagem."}
                </p>
              ) : webhookMutation.isError ? (
                <p className="text-sm font-semibold text-red-800">
                  {webhookMutation.error instanceof Error
                    ? webhookMutation.error.message
                    : "Não foi possível configurar o webhook."}
                </p>
              ) : (
                <p className="text-sm font-semibold text-emerald-800">{feedback}</p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-text-secondary">
              Horários são tratados no fuso de Brasília (America/Sao_Paulo).
            </p>
            <button
              type="button"
              onClick={handleCreate}
              disabled={!formReady || createMutation.isPending}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-green-900 px-5 text-sm font-bold text-white transition-colors hover:bg-green-950 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {createMutation.isPending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <CalendarClock className="h-4 w-4" aria-hidden="true" />
              )}
              Agendar mensagem
            </button>
          </div>

          {!connected ? (
            <p className="text-xs font-semibold text-amber-800">
              Conecte o WhatsApp da igreja antes de criar um agendamento.
            </p>
          ) : null}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-white p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <Clock3 className="h-5 w-5 text-green-700" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-extrabold text-green-950">Mensagens agendadas</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Acompanhe, pause ou reative os próximos disparos.
            </p>
          </div>
        </div>

        {campaigns.isPending ? (
          <div className="mt-6 h-28 animate-pulse rounded-xl bg-surface-soft" />
        ) : campaigns.isError ? (
          <p className="mt-6 text-sm font-semibold text-red-800">
            Não foi possível carregar os agendamentos.
          </p>
        ) : campaigns.data.length === 0 ? (
          <div className="mt-6 rounded-xl bg-surface-soft px-5 py-8 text-center">
            <p className="text-sm font-bold text-green-950">Nenhuma mensagem agendada ainda.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {campaigns.data.map((campaign) => (
              <article key={campaign.id} className="rounded-xl border border-border px-5 py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words font-extrabold text-text-primary">
                        {campaign.title}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${campaignBadgeClass(campaign.status)}`}
                      >
                        {campaignStatusLabel[campaign.status]}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-text-secondary">
                      {campaignScheduleLabel(campaign)}
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">
                      Próxima execução: {formatDateTime(campaign.next_run_at)}
                    </p>
                    {campaign.last_error ? (
                      <p className="mt-2 max-w-2xl text-xs font-semibold text-red-800">
                        {campaign.last_error}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {campaign.status === "scheduled" ? (
                      <button
                        type="button"
                        onClick={() => statusMutation.mutate({ id: campaign.id, status: "paused" })}
                        disabled={statusMutation.isPending}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-xs font-bold text-green-900 hover:bg-surface-soft disabled:opacity-50"
                      >
                        <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                        Pausar
                      </button>
                    ) : campaign.status === "paused" || campaign.status === "error" ? (
                      <button
                        type="button"
                        onClick={() => statusMutation.mutate({ id: campaign.id, status: "scheduled" })}
                        disabled={statusMutation.isPending}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-xs font-bold text-green-900 hover:bg-surface-soft disabled:opacity-50"
                      >
                        <Play className="h-3.5 w-3.5" aria-hidden="true" />
                        Reativar
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleDelete(campaign)}
                      disabled={deleteMutation.isPending || campaign.status === "processing"}
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-100 px-3 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Excluir
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-white">
        <div className="border-b border-border p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Send className="h-5 w-5 text-green-700" aria-hidden="true" />
            <div>
              <h2 className="text-lg font-extrabold text-green-950">Histórico de envios</h2>
              <p className="mt-1 text-sm text-text-secondary">
                Últimas 100 entregas processadas pela automação.
              </p>
            </div>
          </div>
        </div>

        {deliveries.isPending ? (
          <div className="p-6 sm:p-8">
            <div className="h-28 animate-pulse rounded-xl bg-surface-soft" />
          </div>
        ) : deliveries.isError ? (
          <p className="p-6 text-sm font-semibold text-red-800 sm:p-8">
            Não foi possível carregar o histórico.
          </p>
        ) : deliveries.data.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-bold text-green-950">Nenhum envio processado ainda.</p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-surface-soft text-xs uppercase tracking-[0.1em] text-text-secondary">
                  <tr>
                    <th className="px-6 py-4 font-bold">Campanha</th>
                    <th className="px-6 py-4 font-bold">Membro</th>
                    <th className="px-6 py-4 font-bold">Telefone</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 text-right font-bold">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {deliveries.data.map((delivery) => (
                    <tr key={delivery.id}>
                      <td className="px-6 py-4 font-semibold text-text-primary">
                        {campaignTitles.get(delivery.campaign_id) ?? "Campanha removida"}
                      </td>
                      <td className="px-6 py-4 text-text-secondary">{delivery.member_name}</td>
                      <td className="px-6 py-4 font-mono text-xs text-text-secondary">
                        {maskPhone(delivery.phone)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${deliveryBadgeClass(delivery.status)}`}
                        >
                          {deliveryStatusLabel[delivery.status] ?? delivery.status}
                        </span>
                        {delivery.error ? (
                          <p className="mt-2 max-w-xs text-xs text-red-700">{delivery.error}</p>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-text-secondary">
                        {formatDateTime(delivery.sent_at ?? delivery.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-border md:hidden">
              {deliveries.data.map((delivery) => (
                <li key={delivery.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-text-primary">{delivery.member_name}</p>
                      <p className="mt-1 text-xs text-text-secondary">
                        {campaignTitles.get(delivery.campaign_id) ?? "Campanha removida"}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${deliveryBadgeClass(delivery.status)}`}
                    >
                      {deliveryStatusLabel[delivery.status] ?? delivery.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-text-secondary">
                    <span className="font-mono">{maskPhone(delivery.phone)}</span>
                    <span>{formatDateTime(delivery.sent_at ?? delivery.created_at)}</span>
                  </div>
                  {delivery.error ? (
                    <p className="mt-3 text-xs font-semibold text-red-700">{delivery.error}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <div className="mt-6 flex items-start gap-3 rounded-xl bg-surface-soft px-4 py-3">
        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-green-700" aria-hidden="true" />
        <p className="text-xs leading-5 text-text-secondary">
          O agendamento é executado no servidor; fechar o navegador não interrompe as mensagens.
          Falhas ficam registradas no histórico para conferência.
        </p>
      </div>
    </div>
  );
}
