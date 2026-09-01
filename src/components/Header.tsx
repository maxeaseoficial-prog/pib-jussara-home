import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "@/assets/logo.png.asset.json";
import { navItems, churchConfig } from "@/data/church";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("#inicio");

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
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-white/10 bg-green-950/85 py-3 backdrop-blur-md"
          : "border-b border-transparent py-6"
      }`}
    >
      <div className="mx-auto grid max-w-[1360px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 sm:px-8 lg:px-12">
        <a href="#inicio" className="flex min-w-0 items-center gap-3" aria-label="Ir para o início">
          <img
            src={logo.url}
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

      <div
        className={`fixed inset-0 z-50 bg-green-950 transition-opacity duration-300 lg:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!open}
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
        </nav>
      </div>
    </header>
  );
}
