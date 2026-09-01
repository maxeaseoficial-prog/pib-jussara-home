import { ArrowRight, BookOpen, HandHeart, Users, Sunrise } from "lucide-react";
import facade from "@/assets/facade.avif";
import { Reveal } from "./Reveal";

const principles = [
  { icon: Users, strong: "Uma comunidade", rest: "de fé, amor e acolhimento." },
  { icon: BookOpen, strong: "Fundamentados", rest: "na Palavra de Deus." },
  { icon: HandHeart, strong: "Comprometidos", rest: "com a cidade e o próximo." },
  { icon: Sunrise, strong: "Vivendo o propósito", rest: "de Deus todos os dias." },
];

export function Hero() {
  return (
    <section id="inicio" className="relative isolate bg-green-950 pt-32 sm:pt-40 lg:pt-48">
      <div className="absolute inset-0 -z-10">
        <img
          src={facade}
          alt="Fachada da Primeira Igreja Batista de Jussara ao final da tarde"
          width={1672}
          height={941}
          fetchPriority="high"
          decoding="async"
          className="h-full w-full object-cover object-[72%_center] sm:object-[65%_center] lg:object-[55%_center]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,44,30,0.96)_0%,rgba(2,44,30,0.90)_52%,rgba(2,44,30,0.72)_78%,rgba(2,44,30,0.54)_100%)] sm:bg-[linear-gradient(90deg,rgba(2,44,30,0.98)_0%,rgba(2,44,30,0.94)_38%,rgba(2,44,30,0.70)_62%,rgba(2,44,30,0.26)_82%,rgba(2,44,30,0.08)_100%)] lg:bg-[linear-gradient(90deg,rgba(2,44,30,0.98)_0%,rgba(2,44,30,0.94)_24%,rgba(2,44,30,0.76)_42%,rgba(2,44,30,0.38)_58%,rgba(2,44,30,0.10)_72%,rgba(2,44,30,0)_86%)]" />
        <div className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,rgba(2,44,30,0.40)_0%,rgba(2,44,30,0.12)_60%,rgba(2,44,30,0)_100%)]" />
      </div>

      <div className="mx-auto max-w-[1360px] px-5 pb-16 sm:px-8 lg:px-12 lg:pb-24">
        <div className="max-w-3xl">
          <Reveal>
            <p className="eyebrow text-brand-lime">Bem-vindo à PIB Jussara</p>
          </Reveal>
          <Reveal delay={90}>
            <h1 className="display-xl mt-6 text-white">
              Uma igreja para <span className="text-brand-green">viver a fé</span>, construir
              comunhão e <span className="text-brand-green">transformar vidas.</span>
            </h1>
          </Reveal>
          <Reveal delay={180}>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
              Existimos para glorificar a Deus, amar pessoas e anunciar o Evangelho que transforma.
            </p>
          </Reveal>
          <Reveal delay={260}>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a
                href="#programacao"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-brand-green px-7 py-4 text-sm font-bold text-green-950 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-lime"
              >
                Próximos cultos
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-[3px]"
                  strokeWidth={2}
                />
              </a>
              <a
                href="#a-igreja"
                className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-7 py-4 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/10"
              >
                Conheça nossa igreja
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-[3px]"
                  strokeWidth={2}
                />
              </a>
            </div>
          </Reveal>
        </div>
      </div>

      <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
        <Reveal delay={340}>
          <ul className="grid gap-px overflow-hidden rounded-3xl bg-border shadow-[0_30px_60px_-40px_rgba(2,44,30,0.55)] sm:grid-cols-2 lg:grid-cols-4">
            {principles.map(({ icon: Icon, strong, rest }) => (
              <li
                key={strong}
                className="bg-surface p-7 transition-colors duration-300 hover:bg-surface-soft"
              >
                <Icon className="h-6 w-6 text-green-700" strokeWidth={1.5} />
                <p className="mt-5 text-[0.95rem] leading-snug text-text-secondary">
                  <span className="block font-extrabold text-text-primary">{strong}</span>
                  {rest}
                </p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
      <div className="h-14 bg-background sm:h-20" aria-hidden="true" />
    </section>
  );
}
