import { ArrowRight } from "lucide-react";
import worship from "@/assets/worship.jpg";
import { Reveal } from "./Reveal";

export function FinalCTA() {
  return (
    <section className="relative isolate overflow-hidden">
      <img
        src={worship}
        alt=""
        aria-hidden="true"
        loading="lazy"
        width={1600}
        height={1072}
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-green-950/90" />
      <div className="mx-auto max-w-[1360px] px-5 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-40">
        <div className="max-w-2xl">
          <Reveal>
            <h2 className="display-xl text-white">
              Há um lugar para <span className="text-brand-green">você</span> aqui.
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
              Deus tem algo especial para a sua vida e para a sua família. Venha viver momentos que
              transformam corações.
            </p>
          </Reveal>
          <Reveal delay={180}>
            <a
              href="#programacao"
              className="group mt-10 inline-flex items-center gap-2 rounded-full bg-brand-green px-7 py-4 text-sm font-bold text-green-950 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-lime"
            >
              Próximos cultos
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-[3px]"
                strokeWidth={2}
              />
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
