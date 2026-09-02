import { useEffect, useState } from "react";
import { ChevronDown, LoaderCircle, LogOut, Menu, UserRound, X } from "lucide-react";
import logo from "@/assets/logo.png";
import { navItems, churchConfig } from "@/data/church";
import { useAuth } from "@/auth/useAuth";
import { MemberAuthDialog } from "@/components/MemberAuthDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function MemberAction({
  onGuestClick,
  fullWidth = false,
}: {
  onGuestClick: () => void;
  fullWidth?: boolean;
}) {
  const { member, isLoading, signOut } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  if (isLoading) {
    return (
      <div
        className={`${fullWidth ? "w-full" : "w-36"} h-11 animate-pulse rounded-full bg-white/10`}
        aria-label="Verificando sessão de membro"
        role="status"
      />
    );
  }

  if (!member) {
    return (
      <button
        type="button"
        onClick={onGuestClick}
        className={`${fullWidth ? "w-full" : ""} inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-lime px-5 text-sm font-extrabold text-green-950 shadow-[0_7px_20px_rgba(120,221,27,0.2)] transition-[background-color,transform,box-shadow] hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_10px_24px_rgba(255,255,255,0.14)]`}
      >
        <UserRound className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        Sou membro
      </button>
    );
  }

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setLogoutError("");
    const result = await signOut();
    setIsSigningOut(false);

    if (!result.ok) {
      setLogoutError(result.message);
      return;
    }

    setAccountOpen(false);
  };

  return (
    <DropdownMenu
      open={accountOpen}
      onOpenChange={(nextOpen) => {
        setAccountOpen(nextOpen);
        if (!nextOpen) setLogoutError("");
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`${fullWidth ? "w-full" : "max-w-52"} inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 text-sm font-bold text-white transition-colors hover:bg-white/16`}
          aria-label={`Abrir menu da conta de ${member.fullName}`}
        >
          <UserRound className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
          <span className="truncate">Olá, {member.firstName}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-white/70" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={fullWidth ? "start" : "end"}
        sideOffset={10}
        className="w-[min(19rem,calc(100vw-2rem))] rounded-xl border-0 bg-white p-2 text-text-primary shadow-[0_18px_48px_rgba(2,44,30,0.24)]"
      >
        <div className="px-3 py-3">
          <p className="break-words text-sm font-extrabold text-green-950">{member.fullName}</p>
          <p className="mt-1 break-all text-xs leading-5 text-text-secondary">{member.email}</p>
        </div>
        {logoutError ? (
          <p
            className="mx-2 mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-800"
            role="alert"
          >
            {logoutError}
          </p>
        ) : null}
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem
          disabled={isSigningOut}
          onSelect={(event) => {
            event.preventDefault();
            void handleSignOut();
          }}
          className="h-10 cursor-pointer rounded-lg px-3 font-bold text-green-900 focus:bg-surface-soft focus:text-green-950"
        >
          {isSigningOut ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <LogOut aria-hidden="true" />
          )}
          {isSigningOut ? "Saindo…" : "Sair"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("#inicio");
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ids = navItems.map((n) => n.href.slice(1));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(`#${e.target.id}`);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "border-b border-white/10 bg-green-950/85 py-3 backdrop-blur-md"
            : "border-b border-transparent py-6"
        }`}
      >
        <div className="mx-auto grid max-w-[1360px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:px-12">
          <a
            href="#inicio"
            className="flex min-w-0 items-center gap-3"
            aria-label="Ir para o início"
          >
            <img
              src={logo}
              alt={`Logotipo da ${churchConfig.name}`}
              width={48}
              height={48}
              className="h-11 w-11 shrink-0 object-contain"
            />
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-extrabold tracking-tight text-white">
                PIB Jussara
              </span>
              <span className="block truncate text-[11px] tracking-wide text-white/60">
                Primeira Igreja Batista
              </span>
            </span>
          </a>

          <nav aria-label="Navegação principal" className="hidden lg:block">
            <ul className="flex items-center gap-9">
              {navItems.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    data-active={active === item.href}
                    className="link-underline text-sm font-semibold text-white/80 transition-colors hover:text-white data-[active=true]:text-white"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden lg:block">
            <MemberAction onGuestClick={() => setAuthOpen(true)} />
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid h-11 w-11 place-items-center rounded-full border border-white/25 text-white transition-colors hover:bg-white/10 lg:hidden"
            aria-label="Abrir menu"
            aria-expanded={open}
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-50 overflow-y-auto bg-green-950 transition-opacity duration-300 lg:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!open}
        inert={!open}
      >
        <div className="flex items-center justify-between px-5 py-6 sm:px-8">
          <span className="text-sm font-extrabold text-white">PIB Jussara</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid h-11 w-11 place-items-center rounded-full border border-white/25 text-white"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
        <nav aria-label="Navegação mobile" className="px-5 pt-6 sm:px-8">
          <ul className="flex flex-col gap-2">
            {navItems.map((item) => (
              <li key={item.href} className="border-b border-white/10">
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block py-5 text-2xl font-bold tracking-tight text-white"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <MemberAction
              fullWidth
              onGuestClick={() => {
                setOpen(false);
                setAuthOpen(true);
              }}
            />
          </div>
        </nav>
      </div>

      <MemberAuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}
