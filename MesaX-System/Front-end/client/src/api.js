const API = import.meta.env.VITE_API_URL || "/api";

async function request(path, options) {
  const response = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Erro na API");
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
