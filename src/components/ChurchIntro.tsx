import { BookOpen, HandHeart, Users, Sunrise } from "lucide-react";
import interior from "@/assets/interior.jpg";
import { Reveal } from "./Reveal";

const pillars = [
  { icon: BookOpen, strong: "Fundamentados", rest: "na Palavra de Deus e na verdade." },
  { icon: HandHeart, strong: "Comprometidos", rest: "com a cidade e o próximo." },
  { icon: Users, strong: "Uma comunidade", rest: "de fé, amor e acolhimento." },
  { icon: Sunrise, strong: "Vivendo o propósito", rest: "de Deus todos os dias." },
];

export function ChurchIntro() {
  return (
    <section id="a-igreja" className="bg-background py-20 sm:py-28 lg:py-32">
      <div className="mx-auto grid max-w-[1360px] items-start gap-14 px-5 sm:px-8 lg:grid-cols-[1fr_0.85fr] lg:gap-20 lg:px-12">
        <div>
          <Reveal>
            <p className="eyebrow text-green-700">A nossa igreja</p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="display-lg mt-6 max-w-lg text-text-primary">
              Uma família que ama a Deus e cuida de pessoas.
            </h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg">
              A Primeira Igreja Batista de Jussara é uma comunidade cristã que se reúne para adorar,
              aprender e servir. Aqui, cada pessoa é recebida com respeito e cuidado, e caminhamos
              juntos na fé, no discipulado e no serviço à nossa cidade.
            </p>
          </Reveal>

          <ul className="mt-12 divide-y divide-border border-y border-border">
            {pillars.map(({ icon: Icon, strong, rest }, i) => (
              <Reveal as="li" key={strong} delay={200 + i * 80}>
                <div className="group flex items-start gap-5 py-6 transition-colors duration-300 hover:bg-surface-soft/60">
                  <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-surface text-green-700 transition-colors duration-300 group-hover:border-brand-green">
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </span>
                  <p className="min-w-0 text-base leading-snug text-text-secondary">
                    <span className="font-extrabold text-text-primary">{strong}</span> {rest}
                  </p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>

        <Reveal delay={160} className="relative">
          <div className="absolute -left-4 -top-4 hidden h-24 w-24 rounded-tl-3xl border-l-2 border-t-2 border-brand-green/40 lg:block" />
          <div className="overflow-hidden rounded-[2rem] lg:mt-16">
            <img
              src={interior}
              alt="Pregação no templo da PIB Jussara"
              loading="lazy"
              width={1122}
              height={1402}
              className="aspect-[4/5] w-full object-cover"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
