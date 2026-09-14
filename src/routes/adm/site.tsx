import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, LoaderCircle, RefreshCw, Save } from "lucide-react";
import { AdminPageHeader } from "@/admin/AdminPageHeader";
import {
  adminQueryKeys,
  loadPersistentSiteSettings,
  savePersistentSiteSettings,
} from "@/admin/admin-data";
import { isValidEmail, toCanonicalBrazilianPhone } from "@/auth/member-auth";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { isHttpUrl, normalizeYouTubeLiveUrl } from "@/site/site-settings";
import { useSiteSettings } from "@/site/useSiteSettings";

export const Route = createFileRoute("/adm/site")({
  component: AdminSiteSettings,
});

type SettingsForm = {
  phone: string;
  institutionalEmail: string;
  fullAddress: string;
  instagramUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  youtubeLiveUrl: string;
};

type SettingsErrors = Partial<Record<keyof SettingsForm, string>>;

const emptyForm: SettingsForm = {
  phone: "",
  institutionalEmail: "",
  fullAddress: "",
  instagramUrl: "",
  facebookUrl: "",
  youtubeUrl: "",
  youtubeLiveUrl: "",
};

function formFromRow(data: Awaited<ReturnType<typeof loadPersistentSiteSettings>>): SettingsForm {
  return {
    phone: data.phone,
    institutionalEmail: data.institutional_email,
    fullAddress: data.full_address,
    instagramUrl: data.instagram_url,
    facebookUrl: data.facebook_url,
    youtubeUrl: data.youtube_url,
    youtubeLiveUrl: data.youtube_live_url,
  };
}

function trimmedForm(form: SettingsForm): SettingsForm {
  return {
    phone: form.phone.trim(),
    institutionalEmail: form.institutionalEmail.trim().toLowerCase(),
    fullAddress: form.fullAddress.trim(),
    instagramUrl: form.instagramUrl.trim(),
    facebookUrl: form.facebookUrl.trim(),
    youtubeUrl: form.youtubeUrl.trim(),
    youtubeLiveUrl: form.youtubeLiveUrl.trim(),
  };
}

function validateForm(form: SettingsForm) {
  const errors: SettingsErrors = {};
  if (!toCanonicalBrazilianPhone(form.phone)) errors.phone = "Informe um telefone válido com DDD.";
  if (!isValidEmail(form.institutionalEmail))
    errors.institutionalEmail = "Informe um e-mail válido.";
  if (form.fullAddress.trim().length < 8) errors.fullAddress = "Informe o endereço completo.";
  if (!isHttpUrl(form.instagramUrl)) errors.instagramUrl = "Informe um link completo do Instagram.";
  if (!isHttpUrl(form.facebookUrl)) errors.facebookUrl = "Informe um link completo do Facebook.";
  if (!isHttpUrl(form.youtubeUrl)) errors.youtubeUrl = "Informe um link completo do YouTube.";
  if (!normalizeYouTubeLiveUrl(form.youtubeLiveUrl)) {
    errors.youtubeLiveUrl = "Informe o link de um vídeo ou transmissão válida do YouTube.";
  }
  return errors;
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-bold text-text-primary">
        {label}
      </label>
      {hint ? <p className="mt-1 text-xs leading-5 text-text-secondary">{hint}</p> : null}
      <div className="mt-2">{children}</div>
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-xs font-semibold text-red-800" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function AdminSiteSettings() {
  const queryClient = useQueryClient();
  const { refresh: refreshPublicSettings } = useSiteSettings();
  const settingsQuery = useQuery({
    queryKey: adminQueryKeys.siteSettings,
    queryFn: ({ signal }) => loadPersistentSiteSettings(signal),
  });
  const [form, setForm] = useState<SettingsForm>(emptyForm);
  const [errors, setErrors] = useState<SettingsErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (settingsQuery.data) setForm(formFromRow(settingsQuery.data));
  }, [settingsQuery.data]);

  const normalizedCurrentForm = useMemo(() => trimmedForm(form), [form]);
  const isDirty = settingsQuery.data
    ? JSON.stringify(normalizedCurrentForm) !== JSON.stringify(formFromRow(settingsQuery.data))
    : false;

  const updateField = (field: keyof SettingsForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setNotice(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = trimmedForm(form);
    const nextErrors = validateForm(normalized);
    setErrors(nextErrors);
    setNotice(null);
    if (Object.keys(nextErrors).length > 0) return;

    const normalizedLiveUrl = normalizeYouTubeLiveUrl(normalized.youtubeLiveUrl);
    if (!normalizedLiveUrl) return;

    setIsSaving(true);
    try {
      const saved = await savePersistentSiteSettings({
        phone: normalized.phone,
        institutional_email: normalized.institutionalEmail,
        full_address: normalized.fullAddress,
        instagram_url: normalized.instagramUrl,
        facebook_url: normalized.facebookUrl,
        youtube_url: normalized.youtubeUrl,
        youtube_live_url: normalizedLiveUrl,
      });
      queryClient.setQueryData(adminQueryKeys.siteSettings, saved);
      setForm(formFromRow(saved));
      await refreshPublicSettings();
      setNotice({ tone: "success", text: "Alterações salvas com sucesso." });
    } catch {
      setNotice({
        tone: "error",
        text: "Não foi possível salvar as alterações. Tente novamente.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (settingsQuery.isPending) {
    return (
      <div>
        <AdminPageHeader
          title="Informações do site"
          description="Atualize os dados institucionais exibidos na página inicial."
        />
        <div
          className="mt-9 space-y-5 rounded-2xl border border-border bg-white p-6 sm:p-8"
          role="status"
          aria-label="Carregando formulário"
        >
          {[0, 1, 2, 3, 4].map((item) => (
            <div key={item} className="h-16 animate-pulse rounded-xl bg-surface-soft" />
          ))}
        </div>
      </div>
    );
  }

  if (settingsQuery.isError) {
    return (
      <div>
        <AdminPageHeader
          title="Informações do site"
          description="Atualize os dados institucionais exibidos na página inicial."
        />
        <section className="mt-9 rounded-2xl border border-border bg-white px-6 py-14 text-center">
          <p className="text-sm font-semibold text-red-800">
            Não foi possível carregar as informações salvas.
          </p>
          <button
            type="button"
            onClick={() => void settingsQuery.refetch()}
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-bold text-green-900 transition-colors hover:bg-surface-soft"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Tentar novamente
          </button>
        </section>
      </div>
    );
  }

  const inputClass = (field: keyof SettingsForm) =>
    cn(
      "h-12 rounded-xl bg-white text-base shadow-none md:text-sm",
      errors[field] && "border-red-500 focus-visible:ring-red-500",
    );

  return (
    <div>
      <AdminPageHeader
        title="Informações do site"
        description="Estes dados alimentam o contato, a localização, as redes sociais e a transmissão principal da Home."
      />

      <form className="mt-9 space-y-6" onSubmit={handleSubmit} noValidate>
        <fieldset className="rounded-2xl border border-border bg-white p-6 sm:p-8">
          <legend className="px-2 text-lg font-extrabold text-green-950">
            Contato e localização
          </legend>
          <div className="mt-3 grid gap-6 sm:grid-cols-2">
            <Field id="site-phone" label="Telefone" error={errors.phone}>
              <Input
                id="site-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                aria-invalid={Boolean(errors.phone) || undefined}
                aria-describedby={errors.phone ? "site-phone-error" : undefined}
                className={inputClass("phone")}
                placeholder="(62) 99999-9999"
              />
            </Field>
            <Field id="site-email" label="E-mail institucional" error={errors.institutionalEmail}>
              <Input
                id="site-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={form.institutionalEmail}
                onChange={(event) => updateField("institutionalEmail", event.target.value)}
                aria-invalid={Boolean(errors.institutionalEmail) || undefined}
                aria-describedby={errors.institutionalEmail ? "site-email-error" : undefined}
                className={inputClass("institutionalEmail")}
                placeholder="contato@igreja.com.br"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field
                id="site-address"
                label="Endereço completo"
                hint="Use o endereço como deve aparecer no site e na busca do mapa."
                error={errors.fullAddress}
              >
                <Textarea
                  id="site-address"
                  value={form.fullAddress}
                  onChange={(event) => updateField("fullAddress", event.target.value)}
                  aria-invalid={Boolean(errors.fullAddress) || undefined}
                  aria-describedby={errors.fullAddress ? "site-address-error" : undefined}
                  className={cn(
                    "min-h-24 resize-y rounded-xl bg-white text-base shadow-none md:text-sm",
                    errors.fullAddress && "border-red-500 focus-visible:ring-red-500",
                  )}
                />
              </Field>
            </div>
          </div>
        </fieldset>

        <fieldset className="rounded-2xl border border-border bg-white p-6 sm:p-8">
          <legend className="px-2 text-lg font-extrabold text-green-950">Canais digitais</legend>
          <div className="mt-3 grid gap-6 sm:grid-cols-2">
            <Field id="site-instagram" label="Instagram" error={errors.instagramUrl}>
              <Input
                id="site-instagram"
                type="url"
                inputMode="url"
                value={form.instagramUrl}
                onChange={(event) => updateField("instagramUrl", event.target.value)}
                aria-invalid={Boolean(errors.instagramUrl) || undefined}
                aria-describedby={errors.instagramUrl ? "site-instagram-error" : undefined}
                className={inputClass("instagramUrl")}
                placeholder="https://www.instagram.com/..."
              />
            </Field>
            <Field id="site-facebook" label="Facebook" error={errors.facebookUrl}>
              <Input
                id="site-facebook"
                type="url"
                inputMode="url"
                value={form.facebookUrl}
                onChange={(event) => updateField("facebookUrl", event.target.value)}
                aria-invalid={Boolean(errors.facebookUrl) || undefined}
                aria-describedby={errors.facebookUrl ? "site-facebook-error" : undefined}
                className={inputClass("facebookUrl")}
                placeholder="https://www.facebook.com/..."
              />
            </Field>
            <Field id="site-youtube" label="Canal do YouTube" error={errors.youtubeUrl}>
              <Input
                id="site-youtube"
                type="url"
                inputMode="url"
                value={form.youtubeUrl}
                onChange={(event) => updateField("youtubeUrl", event.target.value)}
                aria-invalid={Boolean(errors.youtubeUrl) || undefined}
                aria-describedby={errors.youtubeUrl ? "site-youtube-error" : undefined}
                className={inputClass("youtubeUrl")}
                placeholder="https://www.youtube.com/@canal"
              />
            </Field>
            <Field
              id="site-youtube-live"
              label="Vídeo ou transmissão principal"
              hint="Aceita links watch, live, shorts, youtu.be ou o ID do vídeo."
              error={errors.youtubeLiveUrl}
            >
              <Input
                id="site-youtube-live"
                type="text"
                inputMode="url"
                value={form.youtubeLiveUrl}
                onChange={(event) => updateField("youtubeLiveUrl", event.target.value)}
                aria-invalid={Boolean(errors.youtubeLiveUrl) || undefined}
                aria-describedby={errors.youtubeLiveUrl ? "site-youtube-live-error" : undefined}
                className={inputClass("youtubeLiveUrl")}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </Field>
          </div>
        </fieldset>

        <div className="sticky bottom-4 z-20 rounded-2xl border border-border bg-background/95 p-4 shadow-[0_14px_40px_-24px_rgba(2,44,30,0.45)] backdrop-blur sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div className="min-h-6" aria-live="polite">
            {notice ? (
              <p
                className={cn(
                  "flex items-start gap-2 text-sm font-semibold leading-6",
                  notice.tone === "success" ? "text-green-800" : "text-red-800",
                )}
                role={notice.tone === "error" ? "alert" : "status"}
              >
                {notice.tone === "success" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                ) : null}
                {notice.text}
              </p>
            ) : (
              <p className="text-xs leading-5 text-text-secondary">
                As alterações só entram em vigor depois de salvar.
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSaving || !isDirty}
            className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-green-800 px-5 text-sm font-bold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-55 sm:mt-0 sm:w-auto"
          >
            {isSaving ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
            )}
            {isSaving ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
