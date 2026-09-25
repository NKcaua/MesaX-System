import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  atualizarPedido,
  getEstado,
  login,
  pagarConta,
  resetDemo,
  toggleProduto,
} from "../api.js";
import {
  ACCOUNT_STATUS_LABEL,
  formatBRL,
  labelOf,
  ORDER_STATUS_LABEL,
  PAYMENT_LABEL,
  ROLE_LABEL,
  TABLE_STATUS_LABEL,
} from "../site.js";

const DEST = {
  cozinha: "/cozinha",
  garcom: "/garcom",
  caixa: "/caixa",
  gerente: "/gerente",
};

export function EquipeLogin() {
  const navigate = useNavigate();
  const [user, setUser] = useState("cozinha");
  const [password, setPassword] = useState("caseirao");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    try {
      const session = await login(user, password);
      sessionStorage.setItem("caseirao-user", JSON.stringify(session));
      navigate(DEST[session.role]);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5">
      <div className="glass rounded-[32px] p-7 sm:p-9">
        <p className="eyebrow">Equipe</p>
        <h1 className="mt-2 text-[34px]">Entrar no sistema</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Senha de demonstração: <strong className="text-ink">caseirao</strong>
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block text-sm font-semibold">
            Função
            <select
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="field mt-2"
            >
              {Object.entries(ROLE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Senha
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field mt-2"
            />
          </label>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button type="submit" className="btn btn-primary mt-2 w-full">
            Entrar
          </button>
        </form>
      </div>
      <Link to="/" className="mt-6 text-center text-sm font-medium text-muted">
        ← Início
      </Link>
    </main>
  );
}

function useSession(allowKey) {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  useEffect(() => {
    const raw = sessionStorage.getItem("caseirao-user");
    const parsed = raw ? JSON.parse(raw) : null;
    const allow = allowKey.split(",");
    if (!parsed || !allow.includes(parsed.role)) {
      navigate("/equipe");
      return;
    }
    setSession(parsed);
  }, [allowKey, navigate]);
  return session;
}

function useEstado() {
  const [data, setData] = useState(null);
  async function load() {
    setData(await getEstado());
  }
  useEffect(() => {
    load().catch(() => {});
    const t = setInterval(() => load().catch(() => {}), 2500);
    return () => clearInterval(t);
  }, []);
  return { data, load };
}

function Shell({ title, children }) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 px-3 pt-3">
        <div className="glass-strong mx-auto flex max-w-5xl items-center justify-between rounded-full px-5 py-3">
          <h1 className="font-display text-lg">{title}</h1>
          <div className="flex items-center gap-2 text-sm font-medium">
            <Link to="/" className="rounded-full px-3 py-2">
              Início
            </Link>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                sessionStorage.removeItem("caseirao-user");
                window.location.href = "/equipe";
              }}
            >
              Sair
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
    </div>
  );
}

export function Cozinha() {
  const session = useSession("cozinha,gerente");
  const { data, load } = useEstado();
  if (!session) return null;
  const queue = data?.orders.filter((o) => o.status === "recebido" || o.status === "em_preparo") ?? [];
  return (
    <Shell title="Cozinha">
      {queue.length === 0 ? (
        <p className="glass rounded-[24px] p-6 text-muted">Nenhum pedido na fila.</p>
      ) : (
        <ul className="space-y-4">
          {queue.map((order) => (
            <li key={order.id} className="glass rounded-[24px] p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl">Mesa {order.tableNumber}</h2>
                <span className="rounded-full bg-ink/10 px-3 py-1 text-sm font-semibold">
                  {labelOf(order.status, ORDER_STATUS_LABEL)}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed">
                {order.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm mt-4"
                onClick={async () => {
                  await atualizarPedido(
                    order.id,
                    order.status === "recebido" ? "em_preparo" : "pronto",
                  );
                  await load();
                }}
              >
                {order.status === "recebido" ? "Iniciar preparo" : "Marcar como pronto"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}

export function Garcom() {
  const session = useSession("garcom,gerente");
  const { data, load } = useEstado();
  if (!session) return null;
  const ready = data?.orders.filter((o) => o.status === "pronto") ?? [];
  return (
    <Shell title="Garçom">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {data?.tables.map((table) => (
          <li key={table.id} className="glass rounded-[24px] p-4">
            <p className="font-display text-lg">Mesa {table.number}</p>
            <p className="text-sm text-muted">{labelOf(table.status, TABLE_STATUS_LABEL)}</p>
          </li>
        ))}
      </ul>
      <h2 className="eyebrow mt-8">Para entregar</h2>
      <ul className="mt-3 space-y-3">
        {ready.length === 0 ? (
          <li className="glass rounded-[24px] p-5 text-muted">Nenhum prato pronto no momento.</li>
        ) : null}
        {ready.map((order) => (
          <li key={order.id} className="glass flex items-center justify-between rounded-[24px] p-5">
            <div>
              <p className="font-display text-xl">Mesa {order.tableNumber}</p>
              <p className="text-sm text-muted">
                {order.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={async () => {
                await atualizarPedido(order.id, "entregue");
                await load();
              }}
            >
              Entregue
            </button>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

export function Caixa() {
  const session = useSession("caixa,gerente");
  const { data, load } = useEstado();
  const [method, setMethod] = useState("pix");
  if (!session) return null;
  const open = data?.accounts.filter((a) => a.status !== "paga") ?? [];
  return (
    <Shell title="Caixa">
      <label className="block max-w-xs text-sm font-semibold">
        Forma de pagamento
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="field mt-2"
        >
          {Object.entries(PAYMENT_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <ul className="mt-6 space-y-3">
        {open.length === 0 ? (
          <li className="glass rounded-[24px] p-5 text-muted">Nenhuma conta aberta.</li>
        ) : null}
        {open.map((account) => (
          <li key={account.id} className="glass rounded-[24px] p-5">
            <div className="flex justify-between">
              <h3 className="font-display text-xl">Mesa {account.tableNumber}</h3>
              <p className="font-semibold">{formatBRL(account.total)}</p>
            </div>
            <p className="mt-1 text-sm text-muted">
              {labelOf(account.status, ACCOUNT_STATUS_LABEL)}
            </p>
            <button
              type="button"
              className="btn btn-primary btn-sm mt-4"
              onClick={async () => {
                await pagarConta(account.tableNumber, method);
                await load();
              }}
            >
              Registrar pagamento
            </button>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

export function Gerente() {
  const session = useSession("gerente");
  const { data, load } = useEstado();
  if (!session) return null;
  return (
    <Shell title="Gerente">
      <ul className="glass divide-y divide-ink/5 overflow-hidden rounded-[24px]">
        {data?.products.map((product) => (
          <li key={product.id} className="flex items-center justify-between gap-3 px-5 py-3">
            <span className="font-medium tracking-tight">
              {product.name} · {formatBRL(product.price)}
            </span>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={async () => {
                await toggleProduto(product.id, !product.available);
                await load();
              }}
            >
              {product.available ? "Disponível" : "Esgotado"}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="btn btn-ghost btn-sm mt-8"
        onClick={async () => {
          await resetDemo();
          await load();
        }}
      >
        Zerar demonstração
      </button>
    </Shell>
  );
}
