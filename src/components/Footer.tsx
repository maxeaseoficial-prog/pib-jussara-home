import { Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";
import logo from "@/assets/logo.png";
import { churchConfig, navItems } from "@/data/church";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-green-950 text-white/70">
      <div className="mx-auto max-w-[1360px] px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt={`Logotipo da ${churchConfig.name}`}
                width={48}
                height={48}
                loading="lazy"
                className="h-12 w-12 object-contain"
              />
              <span className="text-sm font-extrabold text-white">PIB Jussara</span>
            </div>
            <p className="mt-6 max-w-xs text-sm leading-relaxed">
              Uma comunidade cristã de fé, comunhão e serviço em {churchConfig.city}.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href={churchConfig.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram da PIB Jussara"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/15 transition-colors hover:border-brand-green hover:text-white"
              >
                <Instagram className="h-4 w-4" strokeWidth={1.75} />
              </a>
              <a
                href={churchConfig.youtube}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Canal da PIB Jussara no YouTube"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/15 transition-colors hover:border-brand-green hover:text-white"
              >
                <Youtube className="h-4 w-4" strokeWidth={1.75} />
              </a>
            </div>
          </div>

          <nav aria-label="Links rápidos">
            <h2 className="eyebrow text-white">Links rápidos</h2>
            <ul className="mt-6 space-y-3 text-sm">
              {navItems.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="transition-colors hover:text-brand-lime">
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="eyebrow text-white">Horários dos cultos</h2>
            <ul className="mt-6 space-y-3 text-sm">
              {churchConfig.services.map((s) => (
                <li key={`${s.day}-${s.name}`}>
                  <span className="block text-white/90">{s.name}</span>
                  <span className="text-white/55">
                    {s.day} · {s.time}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="eyebrow text-white">Contato</h2>
            <ul className="mt-6 space-y-4 text-sm">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" strokeWidth={1.75} />
                {churchConfig.address.full}
              </li>
              <li className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" strokeWidth={1.75} />
                <a
                  href={`tel:${churchConfig.phone.replace(/\D/g, "")}`}
                  className="hover:text-brand-lime"
                >
                  {churchConfig.phone}
                </a>
              </li>
              <li className="flex min-w-0 gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" strokeWidth={1.75} />
                <a
                  href={`mailto:${churchConfig.email}`}
                  className="break-words hover:text-brand-lime"
                >
                  {churchConfig.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-white/10 pt-8 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {churchConfig.name}. Todos os direitos reservados.
          </p>
          <p>Desenvolvido por MaxEase</p>
        </div>
      </div>
    </footer>
  );
}
