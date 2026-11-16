const API = import.meta.env.VITE_API_URL || "/api";

const SESSION_KEY = "caseirao-user";

export function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

export function saveSession(session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

async function request(path, options) {
  const token = getSession()?.token;
  let response;
  try {
    response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers || {}),
      },
    });
  } catch {
    throw new Error("Sem conexão com o servidor.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Erro na API");
    error.status = response.status;
    throw error;
  }
  return data;
}

/** Cardápio — use no index e nas telas de pedido */
export function getProdutos() {
  return request("/produtos");
}

/** Snapshot do restaurante (mesas, pedidos, contas) */
export function getEstado() {
  return request("/estado");
}

export function criarPedido(tableNumber, items) {
  return request("/pedidos", {
    method: "POST",
    body: JSON.stringify({ tableNumber, items }),
  });
}

export function atualizarPedido(id, status) {
  return request(`/pedidos/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function pedirConta(tableNumber) {
  return request("/conta", {
    method: "POST",
    body: JSON.stringify({ tableNumber, action: "pedir" }),
  });
}

export function pagarConta(tableNumber, method) {
  return request("/conta", {
    method: "POST",
    body: JSON.stringify({ tableNumber, action: "pagar", method }),
  });
}

export function toggleProduto(id, available) {
  return request("/produtos", {
    method: "PATCH",
    body: JSON.stringify({ id, available }),
  });
}

export function login(user, password) {
  return request("/auth", {
    method: "POST",
    body: JSON.stringify({ login: user, password }),
  });
}

export function resetDemo() {
  return request("/estado", { method: "DELETE" });
}

/** RF09 — relatório de vendas (gerente). Datas no formato AAAA-MM-DD. */
export function getRelatorioVendas(de, ate) {
  const query = new URLSearchParams({ de, ate });
  return request(`/relatorios/vendas?${query}`);
}

/** Histórico de pedidos (gerente): séries por dia/hora/status e últimos pedidos. */
export function getRelatorioHistorico(de, ate) {
  const query = new URLSearchParams({ de, ate });
  return request(`/relatorios/historico?${query}`);
}

/** Gerente: edita nome, descrição e preço do produto. */
export function atualizarProduto(id, { name, description, price }) {
  return request(`/produtos/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name, description, price }),
  });
}

/** Gerente: envia a foto do produto (data URL jpeg/png/webp). */
export function enviarImagemProduto(id, dataUrl) {
  return request(`/produtos/${id}/imagem`, {
    method: "POST",
    body: JSON.stringify({ dataUrl }),
  });
}
