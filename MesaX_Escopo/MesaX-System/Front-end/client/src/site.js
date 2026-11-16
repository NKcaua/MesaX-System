export const site = {
  name: "Caseirão",
  tagline: "Comida de verdade",
  subtitle:
    "Pratos executivos e bebidas para o almoço e o jantar, sem fila de garçom.",
  rating: "4.8",
  phone: "(11) 3456-7890",
  phoneHref: "tel:+551134567890",
  whatsapp: "https://wa.me/5511987654321",
  instagram: "https://instagram.com/",
  facebook: "https://facebook.com/",
  about:
    "O Caseirão é um restaurante tradicional de pequeno porte: poucas mesas, refeição rápida e gosto de casa. Arroz, feijão, um prato do dia e uma bebida — do jeito que o almoço brasileiro pede.",
  aboutInvite: "Sente, leia o QR da mesa e peça direto pelo celular.",
  address: {
    name: "Restaurante Caseirão",
    line1: "Rua das Oliveiras, 120",
    line2: "Centro — São Paulo, SP",
  },
  hours: [
    { days: "Seg. a sex.", time: "11:00 – 15:00 · 18:00 – 22:00" },
    { days: "Sábado", time: "11:00 – 16:00 · 18:00 – 22:30" },
    { days: "Domingo", time: "11:00 – 16:00" },
  ],
};

export function formatBRL(value) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Troca snake_case interno por texto de tela, sem underscore. */
export function labelOf(value, map = {}) {
  if (value == null || value === "") return "";
  if (map[value]) return map[value];
  return String(value)
    .split(/[_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const ORDER_STATUS_LABEL = {
  recebido: "Recebido",
  em_preparo: "Em preparo",
  pronto: "Pronto",
  entregue: "Entregue",
};

export const ACCOUNT_STATUS_LABEL = {
  aberta: "Aberta",
  aguardando_pagamento: "Aguardando pagamento",
  paga: "Paga",
};

export const TABLE_STATUS_LABEL = {
  livre: "Livre",
  ocupada: "Ocupada",
};

export const PAYMENT_LABEL = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  debito: "Débito",
  credito: "Crédito",
};

export const ROLE_LABEL = {
  cozinha: "Cozinha",
  garcom: "Garçom",
  caixa: "Caixa",
  gerente: "Gerente",
};
