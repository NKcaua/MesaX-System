export const site = {
  name: "Caseirão",
  tagline: "Comida de verdade",
  subtitle: "Pratos executivos e bebidas, com pedido feito direto pela mesa.",
  phone: "(11) 3456-7890",
  phoneHref: "tel:+551134567890",
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

/**
 * Dados da empresa exibidos no rodapé e nas páginas legais.
 * PREENCHA com os dados reais: campos vazios não aparecem no site
 * (nada é inventado). Telefone, endereço e horários acima também
 * precisam ser conferidos.
 */
export const company = {
  brand: "MesaX-System", // aparece no © do rodapé
  tradeName: "Restaurante Caseirão",
  legalName: "", // razão social
  cnpj: "", // 00.000.000/0000-00
  email: "", // canal para pedidos de titulares (LGPD) e atendimento
};

export const LEGAL_UPDATED = "15 de novembro de 2026";

if (import.meta.env?.DEV) {
  const missing = Object.entries({ legalName: company.legalName, cnpj: company.cnpj, email: company.email })
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length) {
    console.warn(`[site.js] Dados da empresa ainda não preenchidos: ${missing.join(", ")}`);
  }
}

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

/** Data local no formato AAAA-MM-DD (aceita deslocamento em dias). */
export function toISODate(date = new Date(), offsetDays = 0) {
  const d = new Date(date);
  d.setDate(d.getDate() + offsetDays);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "2026-11-15" -> "15/11/2026" (sem passar por fuso). */
export function formatISODate(iso) {
  const [y, m, d] = String(iso).split("-");
  return y && m && d ? `${d}/${m}/${y}` : "";
}

/** Minutos decorridos desde um instante, em texto curto ("agora", "12 min"). */
export function timeAgo(value) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (Number.isNaN(minutes) || minutes < 1) return "agora";
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}
