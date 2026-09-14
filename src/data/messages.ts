export type Message = {
  videoId: string;
  title: string;
  preacher: string;
  date: string;
  duration?: string;
};

export const featuredVideoId = "6wbCaXoq6cM";
export const featuredVideoTitle = "1º Louvorzão — Mini Vigília da Juventude Luz do Mundo";

// Conteúdo publicado no canal oficial da PIB Jussara.
export const messages: Message[] = [
  {
    videoId: "6wbCaXoq6cM",
    title: "1º Louvorzão — Mini Vigília da Juventude Luz do Mundo",
    preacher: "PIB Jussara",
    date: "5 de fevereiro de 2023",
  },
  {
    videoId: "V9B3TBVWuGY",
    title: "Contagem regressiva para o nosso Encontro Kids 2",
    preacher: "PIB Jussara",
    date: "3 de outubro de 2022",
  },
  {
    videoId: "V_zjjidnmRU",
    title: "Transmissão ao vivo de PIB Jussara",
    preacher: "PIB Jussara",
    date: "14 de março de 2021",
  },
];
