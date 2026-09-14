import { useDeferredValue, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mail, Phone, RefreshCw, Search, UserRound, UsersRound } from "lucide-react";
import { AdminPageHeader } from "@/admin/AdminPageHeader";
import { adminQueryKeys, loadAdminMemberCount, loadAdminMembers } from "@/admin/admin-data";
import { formatBrazilianPhone } from "@/auth/member-auth";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/adm/membros")({
  component: AdminMembers,
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatCreatedAt(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
}

function AdminMembers() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const members = useQuery({
    queryKey: adminQueryKeys.members(deferredSearch),
    queryFn: ({ signal }) => loadAdminMembers(deferredSearch, signal),
  });
  const memberCount = useQuery({
    queryKey: adminQueryKeys.memberCount,
    queryFn: ({ signal }) => loadAdminMemberCount(signal),
  });

  const resultCount = members.data?.length ?? 0;

  return (
    <div>
      <AdminPageHeader
        title="Membros"
        description="Consulte os cadastros existentes. Senhas, tokens e outros dados de autenticação não são exibidos neste painel."
      />

      <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <label htmlFor="member-search" className="mb-2 block text-sm font-bold text-text-primary">
            Buscar membros
          </label>
          <Search
            className="pointer-events-none absolute bottom-3.5 left-4 h-4 w-4 text-text-secondary"
            aria-hidden="true"
          />
          <Input
            id="member-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome, e-mail ou telefone"
            className="h-12 rounded-xl bg-white pl-11 text-base shadow-none md:text-sm"
          />
        </div>

        <p className="text-sm font-semibold text-text-secondary" aria-live="polite">
          {memberCount.isPending ? (
            "Carregando total…"
          ) : memberCount.isError ? (
            "Total indisponível"
          ) : deferredSearch ? (
            <>
              <span className="font-extrabold tabular-nums text-green-900">{resultCount}</span> de{" "}
              <span className="font-extrabold tabular-nums text-green-900">{memberCount.data}</span>
            </>
          ) : (
            <>
              <span className="font-extrabold tabular-nums text-green-900">{memberCount.data}</span>{" "}
              {memberCount.data === 1 ? "membro" : "membros"}
            </>
          )}
        </p>
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-white">
        {members.isPending ? (
          <div className="space-y-px bg-border" role="status" aria-label="Carregando membros">
            {[0, 1, 2, 3, 4].map((item) => (
              <div key={item} className="grid gap-3 bg-white p-5 sm:grid-cols-3">
                <div className="h-5 animate-pulse rounded-md bg-surface-soft" />
                <div className="h-5 animate-pulse rounded-md bg-surface-soft" />
                <div className="h-5 animate-pulse rounded-md bg-surface-soft" />
              </div>
            ))}
          </div>
        ) : members.isError ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-semibold text-red-800">
              Não foi possível carregar os membros.
            </p>
            <button
              type="button"
              onClick={() => void members.refetch()}
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-bold text-green-900 transition-colors hover:bg-surface-soft"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Tentar novamente
            </button>
          </div>
        ) : members.data.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <UsersRound
              className="mx-auto h-7 w-7 text-green-700"
              strokeWidth={1.6}
              aria-hidden="true"
            />
            <h2 className="mt-4 text-base font-extrabold text-green-950">
              {deferredSearch ? "Nenhum membro encontrado" : "Nenhum membro cadastrado"}
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-text-secondary">
              {deferredSearch
                ? "Revise o termo informado ou limpe a busca para ver todos os cadastros."
                : "Os novos cadastros aparecerão aqui automaticamente."}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-surface-soft text-xs uppercase tracking-[0.1em] text-text-secondary">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-bold">
                      Nome
                    </th>
                    <th scope="col" className="px-6 py-4 font-bold">
                      Telefone
                    </th>
                    <th scope="col" className="px-6 py-4 font-bold">
                      E-mail
                    </th>
                    <th scope="col" className="px-6 py-4 text-right font-bold">
                      Cadastro
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {members.data.map((member) => (
                    <tr key={member.id} className="transition-colors hover:bg-surface-soft/55">
                      <td className="px-6 py-4 font-bold text-text-primary">{member.full_name}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-text-secondary">
                        {formatBrazilianPhone(member.phone) || member.phone}
                      </td>
                      <td className="max-w-xs break-all px-6 py-4 text-text-secondary">
                        {member.email || "—"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-text-secondary tabular-nums">
                        {formatCreatedAt(member.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-border md:hidden">
              {members.data.map((member) => (
                <li key={member.id} className="p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-soft text-green-700">
                      <UserRound className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="break-words text-sm font-extrabold text-text-primary">
                        {member.full_name}
                      </h2>
                      <p className="mt-1 text-xs text-text-secondary tabular-nums">
                        Cadastrado em {formatCreatedAt(member.created_at)}
                      </p>
                    </div>
                  </div>
                  <dl className="mt-4 space-y-3 pl-[3.25rem] text-sm">
                    <div className="flex min-w-0 gap-2.5">
                      <Phone
                        className="mt-0.5 h-4 w-4 shrink-0 text-green-700"
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <dt className="sr-only">Telefone</dt>
                        <dd className="break-words text-text-secondary">
                          {formatBrazilianPhone(member.phone) || member.phone}
                        </dd>
                      </div>
                    </div>
                    <div className="flex min-w-0 gap-2.5">
                      <Mail className="mt-0.5 h-4 w-4 shrink-0 text-green-700" aria-hidden="true" />
                      <div className="min-w-0">
                        <dt className="sr-only">E-mail</dt>
                        <dd className="break-all text-text-secondary">{member.email || "—"}</dd>
                      </div>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
