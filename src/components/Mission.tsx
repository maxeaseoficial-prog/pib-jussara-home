import { BookMarked } from "lucide-react";
import { Reveal } from "./Reveal";

export function Mission() {
  return (
    <section className="bg-surface-soft py-20 sm:py-24">
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
        <Reveal>
          <div className="overflow-hidden rounded-[2rem] bg-surface">
            <div className="p-8 sm:p-12 lg:p-16">
              <BookMarked className="h-8 w-8 text-green-700" strokeWidth={1.5} />
              <h2 className="display-lg mt-8 text-text-primary">Nossa missão</h2>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary sm:text-xl">
                Glorificar a Deus, edificar vidas e anunciar o Evangelho que transforma, gerando
                discípulos e servindo com amor.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
