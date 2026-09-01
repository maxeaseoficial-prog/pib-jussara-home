import { useState } from "react";
import { Play } from "lucide-react";

type Props = {
  videoId: string;
  title?: string;
  className?: string;
};

export function YouTubeVideo({ videoId, title = "Vídeo do YouTube", className = "" }: Props) {
  const [active, setActive] = useState(false);
  const thumb = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

  return (
    <div
      className={`relative aspect-video w-full overflow-hidden rounded-3xl bg-green-950 ${className}`}
    >
      {active ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setActive(true)}
          className="group absolute inset-0 h-full w-full cursor-pointer"
          aria-label={`Reproduzir vídeo: ${title}`}
        >
          <img
            src={thumb}
            alt=""
            loading="lazy"
            width={1280}
            height={720}
            className="h-full w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-[1.03]"
          />
          <span className="absolute inset-0 bg-green-950/45" />
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-20 w-20 place-items-center rounded-full bg-brand-green text-green-950 shadow-xl transition-transform duration-300 group-hover:scale-105">
              <Play className="ml-1 h-8 w-8" strokeWidth={1.75} fill="currentColor" />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
