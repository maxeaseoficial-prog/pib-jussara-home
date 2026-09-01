import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import { churchConfig } from "@/data/church";
import { Reveal } from "./Reveal";

export function VisitUs() {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    churchConfig.mapsQuery,
  )}`;

  return (
    <section id="contato" className="bg-background py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
        <Reveal>
          <p className="eyebrow text-green-700">Venha nos visitar</p>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="display-lg mt-6 max-w-lg text-text-primary">
            Será uma alegria ter você conosco!
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-[0.9fr_0.9fr_1.2fr]">
          <Reveal delay={120}>
            <div className="h-full rounded-3xl border border-border bg-surface p-8">
              <h3 className="eyebrow text-green-700">Informações</h3>
              <ul className="mt-7 space-y-6 text-sm">
                <li className="flex gap-4">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-green-700" strokeWidth={1.5} />
                  <span className="text-text-secondary">
                    <span className="block font-bold text-text-primary">Endereço</span>
                    {churchConfig.address.full}
                  </span>
                </li>
                <li className="flex gap-4">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-green-700" strokeWidth={1.5} />
                  <span className="text-text-secondary">
                    <span className="block font-bold text-text-primary">Telefone</span>
                    {churchConfig.phone}
                  </span>
                </li>
                <li className="flex gap-4">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-green-700" strokeWidth={1.5} />
                  <span className="min-w-0 text-text-secondary">
                    <span className="block font-bold text-text-primary">E-mail</span>
                    <span className="break-words">{churchConfig.email}</span>
                  </span>
                </li>
              </ul>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="h-full rounded-3xl bg-green-900 p-8 text-white">
              <h3 className="eyebrow text-brand-lime">Horários dos cultos</h3>
              <ul className="mt-7 divide-y divide-white/10">
                {churchConfig.services.map((s) => (
                  <li key={`${s.day}-${s.name}`} className="flex items-baseline justify-between gap-4 py-4">
                    <span className="min-w-0">
                      <span className="block text-sm font-bold">{s.name}</span>
                      <span className="block text-xs text-white/60">{s.day}</span>
                    </span>
                    <span className="shrink-0 text-sm font-extrabold text-brand-lime">{s.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={280}>
            <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-surface">
              <iframe
                title="Mapa da localização da PIB Jussara"
                src={`https://www.google.com/maps?q=${encodeURIComponent(churchConfig.mapsQuery)}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="min-h-64 w-full flex-1 border-0"
              />
              <div className="p-6">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 rounded-full bg-brand-green px-6 py-3.5 text-sm font-bold text-green-950 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-lime"
                >
                  Como chegar
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-[3px]"
                    strokeWidth={2}
                  />
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
