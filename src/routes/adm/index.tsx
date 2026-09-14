import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, Mail, MapPin, Phone, RefreshCw, UsersRound } from "lucide-react";
import { AdminPageHeader } from "@/admin/AdminPageHeader";
import { loadAdminMemberCount, loadPersistentSiteSettings } from "@/admin/admin-data";

export const Route = createFileRoute("/adm/")({
  component: AdminOverview,
});

function AdminOverview() {
  const memberCount = useQuery({
    queryKey: ["admin", "member-count"],
    queryFn: loadAdminMemberCount,
  });
  const siteSettings = useQuery({
    queryKey: ["site-settings", "admin"],
    queryFn: loadPersistentSiteSettings,
  });

  return (
    <div>
      <AdminPageHeader
        title="Visão geral"
        description="Acompanhe os cadastros da comunidade e confira as informações públicas que estão sob responsabilidade do painel."
      />

      <section className="mt-10 overflow-hidden rounded-2xl bg-green-900 text-white shadow-[0_16px_40px_-24px_rgba(2,44,30,0.55)]">
        <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[auto_1fr_auto] md:items-center">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/10 text-brand-lime">
            <UsersRound className="h-6 w-6" strokeWidth={1.7} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-white/70">Membros cadastrados</h2>
            {memberCount.isPending ? (
              <div
                className="mt-2 h-10 w-24 animate-pulse rounded-lg bg-white/10"
                role="status"
                aria-label="Carregando total de membros"
              />
            ) : memberCount.isError ? (
              <p className="mt-2 text-sm font-semibold text-red-100">
                Não foi possível carregar o total.
              </p>
            ) : (
              <p className="mt-1 text-4xl font-extrabold tracking-[-0.03em] tabular-nums">
                {memberCount.data}
              </p>
            )}
          </div>
          {memberCount.isError ? (
            <button
              type="button"
              onClick={() => void memberCount.refetch()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-bold text-white transition-colors hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Tentar novamente
            </button>
          ) : (
            <Link
              to="/adm/membros"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-green-950 transition-colors hover:bg-surface-soft"
            >
              Ver membros
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-green-700" strokeWidth={1.7} aria-hidden="true" />
              <h2 className="text-lg font-extrabold text-green-950">Informações do site</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Dados de contato, endereço, redes sociais e transmissão exibidos na Home.
            </p>
          </div>
          <Link
            to="/adm/site"
            className="inline-flex min-h-11 items-center gap-2 self-start rounded-xl border border-border px-4 text-sm font-bold text-green-900 transition-colors hover:bg-surface-soft"
          >
            Editar informações
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {siteSettings.isPending ? (
          <div
            className="grid gap-5 pt-7 sm:grid-cols-2"
            role="status"
            aria-label="Carregando informações do site"
          >
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-14 animate-pulse rounded-xl bg-surface-soft" />
            ))}
          </div>
        ) : siteSettings.isError ? (
          <div className="flex flex-col items-start gap-4 pt-7">
            <p className="text-sm font-semibold text-red-800">
              Não foi possível carregar as informações do site.
            </p>
            <button
              type="button"
              onClick={() => void siteSettings.refetch()}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-bold text-green-900 transition-colors hover:bg-surface-soft"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Tentar novamente
            </button>
          </div>
        ) : (
          <dl className="grid gap-x-8 gap-y-6 pt-7 sm:grid-cols-2">
            <div className="flex min-w-0 gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-green-700" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-xs font-bold uppercase tracking-[0.12em] text-text-secondary">
                  Telefone
                </dt>
                <dd className="mt-1 break-words text-sm font-semibold text-text-primary">
                  {siteSettings.data.phone}
                </dd>
              </div>
            </div>
            <div className="flex min-w-0 gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-green-700" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-xs font-bold uppercase tracking-[0.12em] text-text-secondary">
                  E-mail
                </dt>
                <dd className="mt-1 break-words text-sm font-semibold text-text-primary">
                  {siteSettings.data.institutional_email}
                </dd>
              </div>
            </div>
            <div className="flex min-w-0 gap-3 sm:col-span-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-green-700" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-xs font-bold uppercase tracking-[0.12em] text-text-secondary">
                  Endereço
                </dt>
                <dd className="mt-1 break-words text-sm font-semibold text-text-primary">
                  {siteSettings.data.full_address}
                </dd>
              </div>
            </div>
          </dl>
        )}
      </section>
    </div>
  );
}
