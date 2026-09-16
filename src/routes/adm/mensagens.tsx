"use client";

import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Clock3,
  KeyRound,
  LoaderCircle,
  MessageSquareText,
  Pause,
  Pencil,
  Play,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Send,
  Trash2,
  UsersRound,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { AdminPageHeader } from "@/admin/AdminPageHeader";
import { adminQueryKeys, loadAdminMembers } from "@/admin/admin-data";
import {
  configureZapiStatusWebhook,
  createWhatsappCampaign,
  deleteWhatsappCampaign,
  loadWhatsappCampaignMembers,
  loadWhatsappCampaigns,
  loadWhatsappDeliveries,
  loadZapiQrCode,
  loadZapiStatus,
  saveZapiConfiguration,
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

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "America/Sao_Paulo",
});

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateTimeFormatter.format(date);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
}

function formatTime(value: string | null) {
  if (!value) return "—";
  return value.slice(0, 5);
}

function campaignScheduleLabel(campaign: WhatsappCampaign) {
  if (campaign.schedule_type === "once") {
    return `Envio único · ${formatDateTime(campaign.scheduled_at)}`;
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
  scheduled: "Ativa",
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
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [apiOpen, setApiOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<"all_members" | "selected_members">("all_members");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [scheduleType, setScheduleType] = useState<"once" | "weekly">("once");
  const [sendDate, setSendDate] = useState("");
  const [sendTime, setSendTime] = useState("");
  const [startDate, setStartDate] = useState("");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [feedback, setFeedback] = useState("");
  const [instanceId, setInstanceId] = useState("");
  const [instanceToken, setInstanceToken] = useState("");
  const [clientToken, setClientToken] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://api.z-api.io");

  const members = useQuery({
    queryKey: adminQueryKeys.members(""),
    queryFn: ({ signal }) => loadAdminMembers("", signal),
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

  const campaignMembers = useQuery({
    queryKey: whatsappQueryKeys.campaignMembers,
    queryFn: ({ signal }) => loadWhatsappCampaignMembers(signal),
  });

  const deliveries = useQuery({
    queryKey: whatsappQueryKeys.deliveries,
    queryFn: ({ signal }) => loadWhatsappDeliveries(signal),
  });

  const qrMutation = useMutation({ mutationFn: loadZapiQrCode });

  const webhookMutation = useMutation({
    mutationFn: configureZapiStatusWebhook,
    onSuccess: () => setFeedback("Status de entrega ativado com sucesso."),
  });

  const apiMutation = useMutation({
    mutationFn: saveZapiConfiguration,
    onSuccess: async () => {
      setInstanceToken("");
      setClientToken("");
      setApiOpen(false);
      setFeedback("API conectada e salva com segurança.");
      await queryClient.invalidateQueries({ queryKey: whatsappQueryKeys.status });
    },
  });

  const createMutation = useMutation({
    mutationFn: createWhatsappCampaign,
    onSuccess: async () => {
      setTitle("");
      setMessage("");
      setAudience("all_members");
      setSelectedMemberIds([]);
      setMemberSearch("");
      setScheduleType("once");
      setSendDate("");
      setSendTime("");
      setStartDate("");
      setWeekdays([]);
      setCampaignOpen(false);
      setFeedback("Campanha criada com sucesso.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: whatsappQueryKeys.campaigns }),
        queryClient.invalidateQueries({ queryKey: whatsappQueryKeys.campaignMembers }),
      ]);
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
        queryClient.invalidateQueries({ queryKey: whatsappQueryKeys.campaignMembers }),
        queryClient.invalidateQueries({ queryKey: whatsappQueryKeys.deliveries }),
      ]);
    },
  });

  const campaignTitles = useMemo(
    () => new Map((campaigns.data ?? []).map((campaign) => [campaign.id, campaign.title])),
    [campaigns.data],
  );

  const selectedCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const link of campaignMembers.data ?? []) {
      counts.set(link.campaign_id, (counts.get(link.campaign_id) ?? 0) + 1);
    }
    return counts;
  }, [campaignMembers.data]);

  const filteredMembers = useMemo(() => {
    const query = memberSearch.trim().toLowerCase();
    if (!query) return members.data ?? [];
    return (members.data ?? []).filter((member) =>
      [member.full_name, member.email, member.phone].some((value) =>
        String(value ?? "").toLowerCase().includes(query),
      ),
    );
  }, [members.data, memberSearch]);

  const connected = zapiStatus.data?.configured === true && zapiStatus.data.connected === true;
  const formReady =
    connected &&
    title.trim().length > 0 &&
    message.trim().length > 0 &&
    (audience === "all_members" || selectedMemberIds.length > 0) &&
    (scheduleType === "once"
      ? Boolean(sendDate && sendTime)
      : Boolean(startDate && sendTime && weekdays.length > 0));

  const toggleWeekday = (day: number) => {
    setWeekdays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day],
    );
  };

  const toggleMember = (memberId: string) => {
    setSelectedMemberIds((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId],
    );
  };

  const handleCreate = () => {
    setFeedback("");
    if (!formReady) return;
    createMutation.mutate({
      title: title.trim(),
      message: message.trim(),
      audience,
      memberIds: audience === "selected_members" ? selectedMemberIds : [],
      scheduleType,
      scheduledLocal: scheduleType === "once" ? `${sendDate}T${sendTime}:00` : null,
      weekdays: scheduleType === "weekly" ? weekdays : null,
      sendTime: scheduleType === "weekly" ? `${sendTime}:00` : null,
      startDate: scheduleType === "weekly" ? startDate : null,
    });
  };

  const handleDelete = (campaign: WhatsappCampaign) => {
    if (window.confirm(`Excluir a campanha “${campaign.title}”? O histórico dela também será removido.`)) {
      deleteMutation.mutate(campaign.id);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Mensagens"
        description="Gerencie campanhas e comunicações pelo WhatsApp para os membros cadastrados."
      />

      {feedback ? (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {feedback}
        </div>
      ) : null}

      <section className="mt-9 rounded-2xl border border-border bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-surface-soft text-green-700">
              {connected ? <Wifi className="h-6 w-6" /> : <WifiOff className="h-6 w-6" />}
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-green-950">Integração WhatsApp</h2>
              {zapiStatus.isPending ? (
                <p className="mt-2 text-sm text-text-secondary">Verificando conexão…</p>
              ) : !zapiStatus.data?.configured ? (
                <div className="mt-2">
                  <p className="text-sm font-semibold text-amber-800">API ainda não conectada</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    Configure a Z-API diretamente neste painel para começar.
                  </p>
                </div>
              ) : connected ? (
                <div className="mt-2">
                  <p className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800">
                    <CheckCircle2 className="h-4 w-4" /> Conectado
                  </p>
                  {zapiStatus.data.instanceIdMasked ? (
                    <p className="mt-1 text-xs text-text-secondary">
                      Instância: {zapiStatus.data.instanceIdMasked}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="mt-2">
                  <p className="text-sm font-semibold text-amber-800">API configurada · WhatsApp desconectado</p>
                  <p className="mt-1 text-sm text-text-secondary">Gere o QR Code para vincular o número da igreja.</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setApiOpen((open) => !open)}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-green-900 px-4 text-sm font-bold text-white hover:bg-green-950"
            >
              {zapiStatus.data?.configured ? <Pencil className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
              {zapiStatus.data?.configured ? "Editar API" : "Conectar API"}
            </button>
            <button
              type="button"
              onClick={() => void zapiStatus.refetch()}
              disabled={zapiStatus.isFetching}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-bold text-green-900 hover:bg-surface-soft disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${zapiStatus.isFetching ? "animate-spin" : ""}`} />
              Atualizar status
            </button>
            {zapiStatus.data?.configured && !connected ? (
              <button
                type="button"
                onClick={() => qrMutation.mutate()}
                disabled={qrMutation.isPending}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-bold text-green-900 hover:bg-surface-soft disabled:opacity-60"
              >
                {qrMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                Conectar WhatsApp
              </button>
            ) : null}
          </div>
        </div>

        {apiOpen ? (
          <div className="mt-6 rounded-2xl border border-border bg-surface-soft p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-green-950">Configuração da Z-API</h3>
                <p className="mt-1 text-xs text-text-secondary">Os tokens são enviados ao servidor e armazenados criptografados no Vault.</p>
              </div>
              <button type="button" onClick={() => setApiOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold">Instance ID</label>
                <Input value={instanceId} onChange={(e) => setInstanceId(e.target.value)} placeholder="ID da instância" className="h-12 rounded-xl bg-white" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold">Base URL</label>
                <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} className="h-12 rounded-xl bg-white" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold">Instance Token</label>
                <Input type="password" value={instanceToken} onChange={(e) => setInstanceToken(e.target.value)} placeholder="••••••••" className="h-12 rounded-xl bg-white" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold">Client Token</label>
                <Input type="password" value={clientToken} onChange={(e) => setClientToken(e.target.value)} placeholder="••••••••" className="h-12 rounded-xl bg-white" />
              </div>
            </div>
            {apiMutation.isError ? (
              <p className="mt-4 text-sm font-semibold text-red-800">
                {apiMutation.error instanceof Error ? apiMutation.error.message : "Não foi possível conectar a API."}
              </p>
            ) : null}
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => apiMutation.mutate({ instanceId, instanceToken, clientToken, baseUrl })}
                disabled={!instanceId.trim() || !instanceToken.trim() || !clientToken.trim() || apiMutation.isPending}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-green-900 px-5 text-sm font-bold text-white disabled:opacity-45"
              >
                {apiMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Salvar e conectar API
              </button>
            </div>
          </div>
        ) : null}

        {qrMutation.data?.value ? (
          <div className="mt-6 flex flex-col gap-5 rounded-2xl bg-surface-soft p-5 sm:flex-row sm:items-center">
            <img src={qrMutation.data.value} alt="QR Code para conectar o WhatsApp" className="h-48 w-48 rounded-xl bg-white object-contain p-2" />
            <div>
              <h3 className="font-extrabold text-green-950">Leia este QR Code no WhatsApp</h3>
              <p className="mt-2 text-sm leading-6 text-text-secondary">Depois da leitura, clique em “Atualizar status”.</p>
            </div>
          </div>
        ) : null}
      </section>

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={() => setCampaignOpen((open) => !open)}
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-green-900 px-5 text-sm font-bold text-white shadow-sm hover:bg-green-950"
        >
          <Plus className="h-4 w-4" />
          Criar campanha de mensagem
        </button>
      </div>

      {campaignOpen ? (
        <section className="mt-4 rounded-2xl border border-border bg-white p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <MessageSquareText className="mt-0.5 h-5 w-5 text-green-700" />
              <div>
                <h2 className="text-lg font-extrabold text-green-950">Criar campanha de mensagem</h2>
                <p className="mt-1 text-sm text-text-secondary">Defina público, frequência e início da automação.</p>
              </div>
            </div>
            <button type="button" onClick={() => setCampaignOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-surface-soft">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-7 grid gap-6">
            <div>
              <label className="mb-2 block text-sm font-bold">Nome da campanha</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Ex.: Aviso do culto de domingo" className="h-12 rounded-xl bg-white" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold">Mensagem</label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={4000} rows={6} placeholder="Digite a mensagem que será enviada aos membros." className="rounded-xl bg-white" />
              <p className="mt-2 text-right text-xs text-text-secondary">{message.length}/4000</p>
            </div>

            <div>
              <span className="mb-2 block text-sm font-bold">Público</span>
              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => setAudience("all_members")} className={`rounded-xl border p-4 text-left ${audience === "all_members" ? "border-green-900 bg-green-50" : "border-border"}`}>
                  <p className="font-bold text-green-950">Todos os membros</p>
                  <p className="mt-1 text-xs text-text-secondary">{members.data?.length ?? 0} cadastrados</p>
                </button>
                <button type="button" onClick={() => setAudience("selected_members")} className={`rounded-xl border p-4 text-left ${audience === "selected_members" ? "border-green-900 bg-green-50" : "border-border"}`}>
                  <p className="font-bold text-green-950">Selecionar membros</p>
                  <p className="mt-1 text-xs text-text-secondary">{selectedMemberIds.length} selecionado(s)</p>
                </button>
              </div>
            </div>

            {audience === "selected_members" ? (
              <div className="rounded-xl border border-border p-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-text-secondary" />
                  <Input value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="Buscar por nome, telefone ou e-mail" className="h-11 rounded-xl pl-10" />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-text-secondary">{selectedMemberIds.length} selecionado(s)</span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setSelectedMemberIds(Array.from(new Set([...selectedMemberIds, ...filteredMembers.map((member) => member.id)])))} className="font-bold text-green-800">Selecionar resultados</button>
                    <button type="button" onClick={() => setSelectedMemberIds([])} className="font-bold text-red-700">Limpar</button>
                  </div>
                </div>
                <div className="mt-3 max-h-64 divide-y divide-border overflow-y-auto rounded-xl border border-border">
                  {filteredMembers.map((member) => (
                    <label key={member.id} className="flex cursor-pointer items-center gap-3 p-3 hover:bg-surface-soft">
                      <input type="checkbox" checked={selectedMemberIds.includes(member.id)} onChange={() => toggleMember(member.id)} className="h-4 w-4" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-text-primary">{member.full_name}</p>
                        <p className="truncate text-xs text-text-secondary">{member.phone} · {member.email || "sem e-mail"}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <label className="mb-2 block text-sm font-bold">Frequência</label>
              <select value={scheduleType} onChange={(e) => { setScheduleType(e.target.value as "once" | "weekly"); setSendDate(""); setSendTime(""); setStartDate(""); setWeekdays([]); }} className="h-12 w-full rounded-xl border border-border bg-white px-4 text-sm font-semibold">
                <option value="once">Enviar uma vez</option>
                <option value="weekly">Semanal</option>
              </select>
            </div>

            {scheduleType === "once" ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <div><label className="mb-2 block text-sm font-bold">Data</label><Input type="date" value={sendDate} onChange={(e) => setSendDate(e.target.value)} className="h-12 rounded-xl" /></div>
                <div><label className="mb-2 block text-sm font-bold">Horário</label><Input type="time" value={sendTime} onChange={(e) => setSendTime(e.target.value)} className="h-12 rounded-xl" /></div>
              </div>
            ) : (
              <div className="grid gap-5">
                <div>
                  <span className="mb-2 block text-sm font-bold">Dias da semana</span>
                  <div className="flex flex-wrap gap-2">
                    {weekdayOptions.map((day) => {
                      const active = weekdays.includes(day.value);
                      return <button key={day.value} type="button" onClick={() => toggleWeekday(day.value)} className={`h-11 min-w-12 rounded-xl border px-3 text-sm font-bold ${active ? "border-green-900 bg-green-900 text-white" : "border-border bg-white text-green-900"}`}>{day.short}</button>;
                    })}
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div><label className="mb-2 block text-sm font-bold">Data de início</label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-12 rounded-xl" /></div>
                  <div><label className="mb-2 block text-sm font-bold">Horário</label><Input type="time" value={sendTime} onChange={(e) => setSendTime(e.target.value)} className="h-12 rounded-xl" /></div>
                </div>
              </div>
            )}

            {createMutation.isError ? (
              <p className="text-sm font-semibold text-red-800">{createMutation.error instanceof Error ? createMutation.error.message : "Não foi possível criar a campanha."}</p>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-text-secondary">Fuso de Brasília (America/Sao_Paulo).</p>
              <button type="button" onClick={handleCreate} disabled={!formReady || createMutation.isPending} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-green-900 px-5 text-sm font-bold text-white disabled:opacity-45">
                {createMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
                Criar campanha
              </button>
            </div>
            {!connected ? <p className="text-xs font-semibold text-amber-800">Conecte a API e o WhatsApp antes de criar a campanha.</p> : null}
          </div>
        </section>
      ) : null}

      <section className="mt-8 rounded-2xl border border-border bg-white p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <Clock3 className="h-5 w-5 text-green-700" />
          <div>
            <h2 className="text-lg font-extrabold text-green-950">Campanhas de mensagem</h2>
            <p className="mt-1 text-sm text-text-secondary">Acompanhe, pause ou reative suas automações.</p>
          </div>
        </div>

        {campaigns.isPending ? <div className="mt-6 h-28 animate-pulse rounded-xl bg-surface-soft" /> : campaigns.data?.length ? (
          <div className="mt-6 space-y-3">
            {campaigns.data.map((campaign) => (
              <article key={campaign.id} className="rounded-xl border border-border px-5 py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-text-primary">{campaign.title}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${campaignBadgeClass(campaign.status)}`}>{campaignStatusLabel[campaign.status]}</span>
                    </div>
                    <p className="mt-2 text-sm text-text-secondary">
                      Público: {campaign.audience === "all_members" ? "Todos os membros" : `${selectedCounts.get(campaign.id) ?? 0} membros selecionados`}
                    </p>
                    <p className="mt-1 text-sm text-text-secondary">{campaignScheduleLabel(campaign)}</p>
                    {campaign.schedule_type === "weekly" ? <p className="mt-1 text-xs text-text-secondary">Início: {formatDate(campaign.start_date)}</p> : null}
                    <p className="mt-1 text-xs text-text-secondary">Próxima execução: {formatDateTime(campaign.next_run_at)}</p>
                    {campaign.last_error ? <p className="mt-2 text-xs font-semibold text-red-800">{campaign.last_error}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {campaign.status === "scheduled" ? (
                      <button type="button" onClick={() => statusMutation.mutate({ id: campaign.id, status: "paused" })} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-xs font-bold text-green-900"><Pause className="h-3.5 w-3.5" />Pausar</button>
                    ) : campaign.status === "paused" || campaign.status === "error" ? (
                      <button type="button" onClick={() => statusMutation.mutate({ id: campaign.id, status: "scheduled" })} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-xs font-bold text-green-900"><Play className="h-3.5 w-3.5" />Reativar</button>
                    ) : null}
                    <button type="button" onClick={() => handleDelete(campaign)} disabled={campaign.status === "processing"} className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-100 px-3 text-xs font-bold text-red-700 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" />Excluir</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-xl bg-surface-soft px-5 py-8 text-center"><p className="text-sm font-bold text-green-950">Nenhuma campanha criada ainda.</p></div>
        )}
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-white">
        <div className="border-b border-border p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Send className="h-5 w-5 text-green-700" />
            <div><h2 className="text-lg font-extrabold text-green-950">Histórico de envios</h2><p className="mt-1 text-sm text-text-secondary">Últimas 100 entregas processadas.</p></div>
          </div>
        </div>
        {deliveries.data?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-surface-soft text-xs uppercase tracking-[0.1em] text-text-secondary"><tr><th className="px-6 py-4">Campanha</th><th className="px-6 py-4">Membro</th><th className="px-6 py-4">Telefone</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Data</th></tr></thead>
              <tbody className="divide-y divide-border">
                {deliveries.data.map((delivery) => (
                  <tr key={delivery.id}><td className="px-6 py-4 font-semibold">{campaignTitles.get(delivery.campaign_id) ?? "Campanha removida"}</td><td className="px-6 py-4 text-text-secondary">{delivery.member_name}</td><td className="px-6 py-4 font-mono text-xs text-text-secondary">{maskPhone(delivery.phone)}</td><td className="px-6 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${deliveryBadgeClass(delivery.status)}`}>{deliveryStatusLabel[delivery.status] ?? delivery.status}</span></td><td className="px-6 py-4 text-right text-text-secondary">{formatDateTime(delivery.sent_at ?? delivery.created_at)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="p-8 text-center"><p className="text-sm font-bold text-green-950">Nenhum envio processado ainda.</p></div>}
      </section>

      <div className="mt-6 flex items-start gap-3 rounded-xl bg-surface-soft px-4 py-3">
        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-green-700" />
        <p className="text-xs leading-5 text-text-secondary">As campanhas são executadas no servidor. Fechar o navegador não interrompe os envios.</p>
      </div>
    </div>
  );
}
