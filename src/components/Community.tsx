import family from "@/assets/family.jpg";
import youth from "@/assets/youth.jpg";
import volunteers from "@/assets/volunteers.jpg";
import worship from "@/assets/worship.jpg";
import { Reveal } from "./Reveal";

export function Community() {
  return (
    <section className="bg-surface-soft py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
        <div className="max-w-2xl">
          <Reveal>
            <h2 className="display-lg text-text-primary">Mais que uma igreja, somos família.</h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="mt-6 text-base leading-relaxed text-text-secondary sm:text-lg">
              Aqui, você encontra acolhimento, amizade e apoio para caminhar junto na jornada da fé.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
          <Reveal className="lg:col-span-2 lg:row-span-2">
            <img
              src={worship}
              alt="Momento de adoração durante o culto"
              loading="lazy"
              width={1600}
              height={1072}
              className="h-full min-h-64 w-full rounded-[2rem] object-cover"
            />
          </Reveal>
          <Reveal delay={80}>
            <img
              src={family}
              alt="Famílias chegando para o culto"
              loading="lazy"
              width={1200}
              height={1500}
              className="h-full min-h-56 w-full rounded-[2rem] object-cover"
            />
          </Reveal>
          <Reveal delay={160}>
            <img
              src={youth}
              alt="Jovens em encontro na igreja"
              loading="lazy"
              width={1200}
              height={900}
              className="h-full min-h-56 w-full rounded-[2rem] object-cover"
            />
          </Reveal>
          <Reveal delay={240} className="sm:col-span-2">
            <img
              src={volunteers}
              alt="Voluntários em ação social da igreja"
              loading="lazy"
              width={1200}
              height={900}
              className="h-full min-h-56 w-full rounded-[2rem] object-cover"
            />
          </Reveal>
        </div>
        <p className="mt-6 text-xs text-text-secondary">
          Imagens ilustrativas — substituir pelas fotografias reais da comunidade.
        </p>
      </div>
    </section>
  );
}
