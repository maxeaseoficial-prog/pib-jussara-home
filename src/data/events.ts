import worship from "@/assets/worship.jpg";
import interior from "@/assets/interior.jpg";
import youth from "@/assets/youth.jpg";
import family from "@/assets/family.jpg";

export type ChurchEvent = {
  date: string;
  month: string;
  weekday: string;
  title: string;
  time: string;
  description: string;
  category: string;
  image: string;
};

// Dados provisórios — substituir pela programação oficial.
export const events: ChurchEvent[] = [
  {
    date: "07",
    month: "SET",
    weekday: "Domingo",
    title: "Culto de Celebração",
    time: "19h00",
    description:
      "Um tempo de adoração, louvor e pregação da Palavra com toda a igreja reunida.",
    category: "Culto",
    image: worship,
  },
  {
    date: "10",
    month: "SET",
    weekday: "Quarta-feira",
    title: "Culto de Oração",
    time: "19h30",
    description:
      "Momento de intercessão, comunhão e busca pela presença de Deus no meio da semana.",
    category: "Oração",
    image: interior,
  },
  {
    date: "13",
    month: "SET",
    weekday: "Sábado",
    title: "Encontro de Jovens",
    time: "19h30",
    description:
      "Louvor, mensagem e comunhão entre adolescentes e jovens da nossa comunidade.",
    category: "Jovens",
    image: youth,
  },
  {
    date: "21",
    month: "SET",
    weekday: "Domingo",
    title: "Culto da Família",
    time: "19h00",
    description:
      "Uma celebração preparada para reunir pais, filhos e toda a casa diante de Deus.",
    category: "Família",
    image: family,
  },
];
