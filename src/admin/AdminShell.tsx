"use client";

import { useEffect, useState, type ComponentType } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  MessageSquareText,
  UsersRound,
} from "lucide-react";
import { Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  adminQueryKeys,
  loadAdminMemberCount,
  loadAdminMembers,
  loadPersistentSiteSettings,
} from "@/admin/admin-data";
import logo from "@/assets/logo.png";
import { useAuth } from "@/auth/useAuth";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { label: "Visão geral", to: "/adm", icon: LayoutDashboard, exact: true },
  { label: "Informações do site", to: "/adm/site", icon: Building2, exact: false },
  { label: "Membros", to: "/adm/membros", icon: UsersRound, exact: false },
  { label: "Mensagens", to: "/adm/mensagens", icon: MessageSquareText, exact: false },
] as const;

function AdminNavigation({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const location = useLocation();

  return (
    <nav aria-label="Navegação administrativa" className="mt-10">
      <ul className="space-y-1.5">
        {adminNavItems.map((item) => {
          const active = item.exact
            ? location.pathname === item.to || location.pathname === `${item.to}/`
            : location.pathname.startsWith(item.to);
          const Icon = item.icon as ComponentType<{ className?: string; strokeWidth?: number }>;

          return (
            <li key={item.to}>
              <Link
                to={item.to}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-colors",
                  active
                    ? "bg-white text-green-950"
                    : "text-white/68 hover:bg-white/8 hover:text-white",
                )}
              >
                <Icon className="h-[1.1rem] w-[1.1rem] shrink-0" strokeWidth={1.8} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const { member, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState("");

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setError("");
    const result = await signOut();
    setIsSigningOut(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onNavigate?.();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3">
        <img src={logo} alt="" className="h-11 w-11 object-contain" width={44} height={44} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-extrabold text-white">PIB Jussara</span>
          <span className="block text-xs text-white/52">Administração</span>
        </span>
      </div>

      <AdminNavigation onNavigate={onNavigate} />

      <div className="mt-auto border-t border-white/10 pt-5">
        {member ? (
          <div className="mb-4 px-2">
            <p className="truncate text-sm font-bold text-white">{member.fullName}</p>
            <p className="mt-1 truncate text-xs text-white/52">{member.email}</p>
          </div>
        ) : null}

        {error ? (
          <p
            className="mb-3 rounded-lg bg-red-950/40 px-3 py-2 text-xs font-semibold leading-5 text-red-100"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div className="space-y-1.5">
          <a
            href="/"
            onClick={onNavigate}
            className="flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white/68 transition-colors hover:bg-white/8 hover:text-white"
          >
            <ArrowLeft className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.8} aria-hidden="true" />
            Voltar ao site
          </a>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={isSigningOut}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-bold text-white/68 transition-colors hover:bg-white/8 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSigningOut ? (
              <LoaderCircle className="h-[1.1rem] w-[1.1rem] animate-spin" aria-hidden="true" />
            ) : (
              <LogOut className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.8} aria-hidden="true" />
            )}
            {isSigningOut ? "Saindo…" : "Sair"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminShell() {
  const { member } = useAuth();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    void Promise.all([
      queryClient.prefetchQuery({
        queryKey: adminQueryKeys.memberCount,
        queryFn: ({ signal }) => loadAdminMemberCount(signal),
      }),
      queryClient.prefetchQuery({
        queryKey: adminQueryKeys.siteSettings,
        queryFn: ({ signal }) => loadPersistentSiteSettings(signal),
      }),
      queryClient.prefetchQuery({
        queryKey: adminQueryKeys.members(""),
        queryFn: ({ signal }) => loadAdminMembers("", signal),
      }),
    ]);
  }, [queryClient]);

  return (
    <div className="admin-shell min-h-screen bg-background text-text-primary lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen bg-green-950 px-5 py-6 lg:block">
        <SidebarContent />
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/95 px-5 backdrop-blur sm:px-8 lg:px-12 xl:px-16">
          <Link
            to="/adm"
            className="flex min-w-0 items-center gap-2.5"
            aria-label="Visão geral do painel"
          >
            <img
              src={logo}
              alt=""
              className="h-9 w-9 shrink-0 object-contain lg:hidden"
              width={36}
              height={36}
            />
            <span className="truncate text-sm font-extrabold text-green-950">
              Painel Administrativo
            </span>
          </Link>
          {member ? (
            <p className="ml-6 hidden truncate text-sm font-semibold text-text-secondary lg:block">
              {member.fullName}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border bg-white text-green-900 transition-colors hover:bg-surface-soft lg:hidden"
            aria-label="Abrir menu administrativo"
            aria-controls="admin-mobile-navigation"
            aria-expanded={menuOpen}
          >
            <Menu className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
          </button>
        </header>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetContent
            id="admin-mobile-navigation"
            side="left"
            className="w-[min(21rem,88vw)] border-0 bg-green-950 px-5 py-6 text-white shadow-[18px_0_50px_rgba(2,44,30,0.25)] [&>button]:right-5 [&>button]:top-6 [&>button]:text-white"
          >
            <SheetTitle className="sr-only">Menu administrativo</SheetTitle>
            <SidebarContent onNavigate={() => setMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        <main className="admin-workspace min-h-[calc(100vh-4rem)] px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12 xl:px-16">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
