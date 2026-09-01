export const churchConfig = {
  name: "Primeira Igreja Batista de Jussara",
  shortName: "PIB Jussara",
  city: "Jussara - GO",
  address: {
    street: "Rua Principal, s/n — Centro",
    city: "Jussara",
    state: "GO",
    zip: "76270-000",
    // TODO: substituir pelo endereço oficial completo
    full: "Rua Principal, s/n — Centro, Jussara - GO, 76270-000",
  },
  phone: "(62) 98171-7501",
  whatsapp: "(62) 00000-0000", // TODO: substituir
  email: "contato@pibjussara.com.br", // TODO: substituir
  instagram: "https://instagram.com/",
  youtube: "https://youtube.com/",
  mapsQuery: "Primeira Igreja Batista de Jussara GO",
  services: [
    { day: "Domingo", name: "Culto de Celebração", time: "19h00" },
    { day: "Domingo", name: "Escola Bíblica Dominical", time: "09h00" },
    { day: "Quarta-feira", name: "Culto de Oração e Palavra", time: "19h30" },
    { day: "Sábado", name: "Encontro de Jovens", time: "19h30" },
  ],
  leadership: {
    name: "Pr. Divino Ferreira",
    role: "Pastor Titular",
  },
} as const;

export const navItems = [
  { label: "Início", href: "#inicio" },
  { label: "A Igreja", href: "#a-igreja" },
  { label: "Programação", href: "#programacao" },
  { label: "Transmissões", href: "#transmissoes" },
  { label: "Contato", href: "#contato" },
] as const;
