import { ArrowUpRight, Play } from "lucide-react";
import { YouTubeVideo } from "./YouTubeVideo";
import { featuredVideoId, messages } from "@/data/messages";
import { churchConfig } from "@/data/church";
import { Reveal } from "./Reveal";

export function Transmissions() {
  return (
    <section id="transmissoes" className="bg-background py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <Reveal>
              <p className="eyebrow text-green-700">Transmissões</p>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="display-lg mt-6 text-text-primary">
                Acompanhe nossos cultos onde estiver
              </h2>
            </Reveal>
          </div>
          <Reveal delay={140}>
            <p className="max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg lg:pb-2">
              Não pôde estar presente? Assista às nossas celebrações online e participe da Palavra e
              da adoração de onde você estiver.
            </p>
          </Reveal>
        </div>

        <Reveal delay={160} className="mt-12">
          <YouTubeVideo videoId={featuredVideoId} title="Último culto transmitido — PIB Jussara" />
        </Reveal>

        <Reveal delay={220}>
          <a
            href={churchConfig.youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-8 inline-flex items-center gap-2 rounded-full bg-green-800 px-7 py-4 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-green-700"
          >
            Assistir no YouTube
            <ArrowUpRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-[3px]"
              strokeWidth={2}
            />
          </a>
        </Reveal>

        <div className="mt-20">
          <Reveal>
            <h3 className="eyebrow border-b border-border pb-4 text-green-700">Últimas mensagens</h3>
          </Reveal>
          <ul className="mt-8 grid gap-5 lg:grid-cols-3">
            {messages.map((m, i) => (
              <Reveal as="li" key={m.title} delay={i * 80}>
                <a
                  href={`https://www.youtube.com/watch?v=${m.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full items-center gap-4 rounded-2xl border border-border bg-surface p-4 transition-all duration-300 hover:-translate-y-1 hover:border-brand-green/50"
                >
                  <span className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-xl bg-green-950">
                    <img
                      src={`https://i.ytimg.com/vi/${m.videoId}/mqdefault.jpg`}
                      alt=""
                      loading="lazy"
                      width={320}
                      height={180}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                    <span className="absolute inset-0 grid place-items-center bg-green-950/30">
                      <Play className="h-6 w-6 text-white" strokeWidth={1.5} fill="currentColor" />
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-extrabold text-text-primary">
                      {m.title}
                    </span>
                    <span className="mt-1 block text-xs text-text-secondary">{m.preacher}</span>
                    <span className="mt-1 block text-xs text-text-secondary">
                      {m.date}
                      {m.duration ? ` · ${m.duration}` : ""}
                    </span>
                  </span>
                </a>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
