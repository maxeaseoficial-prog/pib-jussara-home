import { ArrowRight, Clock } from "lucide-react";
import { events } from "@/data/events";
import { Reveal } from "./Reveal";

export function UpcomingEvents() {
  return (
    <section id="programacao" className="bg-background py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Reveal>
              <p className="eyebrow text-green-700">Agenda da semana</p>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="display-lg mt-6 max-w-md text-text-primary">
                Próximos cultos e eventos
              </h2>
            </Reveal>
            <Reveal delay={140}>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg">
                Acompanhe nossa programação e participe dos momentos especiais que temos preparados
                para você e sua família.
              </p>
            </Reveal>
          </div>
          <Reveal delay={200}>
            <a
              href="#contato"
              className="group inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-3.5 text-sm font-bold text-green-800 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-green"
            >
              Ver programação
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-[3px]"
                strokeWidth={2}
              />
            </a>
          </Reveal>
        </div>

        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {events.map((ev, i) => (
            <Reveal as="li" key={ev.title} delay={i * 80}>
              <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-brand-green/50">
                <div className="relative overflow-hidden">
                  <img
                    src={ev.image}
                    alt={ev.title}
                    loading="lazy"
                    width={1200}
                    height={800}
                    className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                  <span className="absolute left-4 top-4 flex flex-col items-center rounded-2xl bg-surface px-3 py-2 leading-none">
                    <span className="text-xl font-extrabold text-text-primary">{ev.date}</span>
                    <span className="mt-1 text-[10px] font-bold tracking-widest text-green-700">
                      {ev.month}
                    </span>
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="eyebrow text-green-700">{ev.category}</p>
                  <h3 className="mt-3 text-lg font-extrabold tracking-tight text-text-primary">
                    {ev.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-text-secondary">
                    {ev.description}
                  </p>
                  <p className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-sm font-semibold text-text-primary">
                    <Clock className="h-4 w-4 text-green-700" strokeWidth={1.75} />
                    {ev.weekday} · {ev.time}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
