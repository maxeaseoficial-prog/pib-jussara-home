import pastor from "@/assets/pastor-placeholder.jpg";
import { churchConfig } from "@/data/church";
import { Reveal } from "./Reveal";

export function Leadership() {
  return (
    <section className="bg-green-900 py-20 sm:py-28 lg:py-32">
      <div className="mx-auto grid max-w-[1360px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[0.8fr_1fr] lg:gap-20 lg:px-12">
        <Reveal className="order-2 lg:order-1">
          <figure className="overflow-hidden rounded-[2rem]">
            <img
              src={pastor}
              alt="Espaço reservado para a fotografia oficial do Pr. Divino Ferreira"
              loading="lazy"
              width={1200}
              height={1500}
              className="aspect-[4/5] w-full object-cover"
            />
            <figcaption className="bg-green-950 px-6 py-4 text-xs text-white/50">
              Placeholder — substituir pela fotografia oficial do pastor.
            </figcaption>
          </figure>
        </Reveal>

        <div className="order-1 lg:order-2">
          <Reveal>
            <p className="eyebrow text-brand-lime">Nossa liderança</p>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="display-lg mt-6 max-w-xl text-white">
              Pastor e liderança comprometidos com você
            </h2>
          </Reveal>
          <Reveal delay={140}>
            <div className="mt-8 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-white/15 pt-8">
              <p className="text-xl font-extrabold text-white">{churchConfig.leadership.name}</p>
              <p className="eyebrow text-white/50">{churchConfig.leadership.role}</p>
            </div>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
              Nossa liderança está dedicada ao ensino fiel das Escrituras, ao cuidado pastoral das
              famílias e ao acompanhamento de cada pessoa que chega à nossa igreja. Você não caminha
              sozinho.
            </p>
          </Reveal>

          <Reveal delay={260}>
            <blockquote className="mt-14 border-l-2 border-brand-green pl-6 sm:pl-8">
              <p className="text-2xl leading-snug font-semibold tracking-tight text-white sm:text-3xl">
                “Porque onde estiverem dois ou três reunidos em meu nome, ali eu estou no meio
                deles.”
              </p>
              <footer className="eyebrow mt-5 text-brand-lime">Mateus 18:20</footer>
            </blockquote>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
