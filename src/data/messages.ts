export type Message = {
  videoId: string;
  title: string;
  preacher: string;
  date: string;
  duration?: string;
};

// Vídeo principal — substituir pelo ID do último culto transmitido.
export const featuredVideoId = "dQw4w9WgXcQ";

// Dados provisórios (mock) — substituir pelos vídeos oficiais do canal.
export const messages: Message[] = [
  {
    videoId: "dQw4w9WgXcQ",
    title: "A fé que sustenta em tempos difíceis",
    preacher: "Pr. Divino Ferreira",
    date: "24 de agosto de 2026",
    duration: "48 min",
  },
  {
    videoId: "dQw4w9WgXcQ",
    title: "O valor da comunhão na casa de Deus",
    preacher: "Pr. Divino Ferreira",
    date: "17 de agosto de 2026",
    duration: "52 min",
  },
  {
    videoId: "dQw4w9WgXcQ",
    title: "Servir com amor e propósito",
    preacher: "Pr. Divino Ferreira",
    date: "10 de agosto de 2026",
    duration: "45 min",
  },
];
