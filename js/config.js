const CONFIG = {
  settings: {
    cartStorageKey: "osb_cart",
    cartTTL: 4 * 60 * 60 * 1000, // 4 horas
  },

  contato: {
    numero: "5522981104103",
    formatado: "(22) 9-8110-4103",
    whatsappMensagem: "Olá!+Gostaria+de+fazer+um+pedido.",
  },

  endereco: {
    texto: "São Pedro da Aldeia",
    completo: "Estr. do Boqueirão, Baleia, São Pedro da Aldeia – RJ",
    mapLink: "https://share.google/J5IHdEkIUK4utzDgb",
  },

  tempos: {
    entrega: "30 min",
    retirada: "20 min",
  },

  horarios: [
    { dia: "Domingo",  abertura: "18:00", fechamento: "23:59" },
    { dia: "Segunda",  abertura: "18:00", fechamento: "23:59" },
    { dia: "Terça",    abertura: "18:00", fechamento: "23:59" },
    { dia: "Quarta",   abertura: "18:00", fechamento: "23:59" },
    { dia: "Quinta",   abertura: "18:00", fechamento: "23:59" },
    { dia: "Sexta",    abertura: "18:00", fechamento: "23:59" },
    { dia: "Sábado",   abertura: "18:00", fechamento: "23:59" },
  ],

  cidade: "São Pedro da Aldeia/RJ",

  bairros: [
    { nome: "Baleia",            taxa: 3.00  },
    { nome: "Base Aero Naval",   taxa: 10.00 },
    { nome: "Boqueirão",         taxa: 3.00  },
    { nome: "Camerum",           taxa: 4.00  },
    { nome: "Centro",            taxa: 5.00  },
    { nome: "Estação",           taxa: 10.00 },
    { nome: "Fluminense",        taxa: 10.00 },
    { nome: "Mossoró",           taxa: 4.00  },
    { nome: "Nova São Pedro",    taxa: 5.00  },
    { nome: "Poço Fundo",        taxa: 3.00  },
    { nome: "Ponta da Areia",    taxa: 3.00  },
    { nome: "Porto da Aldeia",   taxa: 4.00  },
    { nome: "Praia do Sudoeste", taxa: 3.00  },
    { nome: "São José",          taxa: 10.00 },
  ],
};