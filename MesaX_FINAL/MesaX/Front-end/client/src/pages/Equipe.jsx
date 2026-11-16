import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FormNotice, LegalLinks, useTitle } from "../components.jsx";
import {
  atualizarPedido,
  clearSession,
  getEstado,
  getSession,
  login,
  pagarConta,
  saveSession,
} from "../api.js";
import {
  ACCOUNT_STATUS_LABEL,
  formatBRL,
  labelOf,
  ORDER_STATUS_LABEL,
  PAYMENT_LABEL,
  ROLE_LABEL,
  TABLE_STATUS_LABEL,
  timeAgo,
} from "../site.js";

const DEST = {
  cozinha: "/cozinha",
  garcom: "/garcom",
  caixa: "/caixa",
  gerente: "/gerente",
};

const NAV = [
  ["/cozinha", "Cozinha", "cozinha"],
  ["/garcom", "Garçom", "garcom"],
  ["/caixa", "Caixa", "caixa"],
  ["/gerente", "Gerente", "gerente"],
];

/* ---------- Login ---------- */

export function EquipeLogin() {
  const navigate = useNavigate();
  useTitle("Entrar");
  const [user, setUser] = useState("cozinha");
  // A senha de demonstração só aparece e é preenchida no ambiente de desenvolvimento.
  const [password, setPassword] = useState(import.meta.env.DEV ? "caseirao" : "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const session = await login(user, password);
      saveSession(session);
      navigate(DEST[session.role]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="conteudo" tabIndex={-1} className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5">
      <div className="glass rise rounded-[32px] p-7 sm:p-9">
        <p className="eyebrow">Equipe</p>
        <h1 className="mt-2 text-[34px]">Entrar no sistema</h1>
        {import.meta.env.DEV ? (
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Senha de demonstração (só em desenvolvimento): <strong className="text-ink">caseirao</strong>
          </p>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-muted">Área restrita à equipe do restaurante.</p>
        )}
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
              required
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              className="field mt-2"
            />
          </label>
          {error ? (
            <p role="alert" className="rounded-2xl bg-red-700/10 px-4 py-3 text-sm font-medium text-red-800">
              {error}
            </p>
          ) : null}
          <button type="submit" disabled={busy} className="btn btn-primary mt-2 w-full">
            {busy ? "Entrando…" : "Entrar"}
          </button>
          <FormNotice>
            Usamos o login apenas para identificar o seu perfil de acesso e não guardamos a senha em texto aberto.
          </FormNotice>
        </form>
      </div>
      <Link to="/" className="mt-6 text-center text-sm font-medium text-muted underline underline-offset-4">
        ← Início
      </Link>
      <LegalLinks center className="mt-4 pb-6" />
    </main>
  );
}

/* ---------- Infraestrutura das telas ---------- */

export function useSession(allowKey) {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  useEffect(() => {
    const parsed = getSession();
    const allow = allowKey.split(",");
    if (!parsed || !allow.includes(parsed.role)) {
      navigate("/equipe");
      return;
    }
    setSession(parsed);
  }, [allowKey, navigate]);
  return session;
}

export function useEstado() {
  const [data, setData] = useState(null);
  const [offline, setOffline] = useState(false);
  const load = useCallback(async () => {
    try {
      setData(await getEstado());
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }, []);
  useEffect(() => {
    load();
    const t = setInterval(load, 2500);
    return () => clearInterval(t);
  }, [load]);
  return { data, load, offline };
}

export function Shell({ title, session, offline, children }) {
  useTitle(title);
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 px-3 pt-3">
        <div className="glass-strong mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-[28px] px-5 py-3 sm:rounded-full">
          <div className="flex items-baseline gap-3">
            <h1 className="font-display text-lg">{title}</h1>
            {session ? (
              <span className="hidden text-sm text-muted sm:inline">{session.name}</span>
            ) : null}
          </div>
          <nav aria-label="Áreas da equipe" className="flex flex-wrap items-center gap-1 text-sm font-medium">
            {session?.role === "gerente"
              ? NAV.map(([to, label]) => (
                  <Link
                    key={to}
                    to={to}
                    aria-current={title === label ? "page" : undefined}
                    className={`rounded-full px-3 py-2 ${
                      title === label ? "bg-ink text-cream" : "text-muted"
                    }`}
                  >
                    {label}
                  </Link>
                ))
              : null}
            <Link to="/" className="rounded-full px-3 py-2 text-muted">
              Início
            </Link>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                clearSession();
                window.location.href = "/equipe";
              }}
            >
              Sair
            </button>
          </nav>
        </div>
      </header>
      <main id="conteudo" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-5">
        {offline ? (
          <p role="status" className="mb-4 rounded-2xl bg-red-700/10 px-4 py-3 text-sm font-medium text-red-800">
            Sem conexão com o servidor. Tentando novamente…
          </p>
        ) : null}
        {children}
      </main>
      <LegalLinks className="mx-auto max-w-6xl px-4 pb-8" />
    </div>
  );
}

export function Kpi({ label, value, hint, tone }) {
  return (
    <div className="glass rise rounded-[20px] px-4 py-3">
      <p className="eyebrow !text-[0.66rem]">{label}</p>
      <p className={`stat-value !text-[1.6rem] mt-1 ${tone ?? ""}`}>{value}</p>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function Empty({ children }) {
  return <p className="glass rise rounded-[24px] p-6 text-muted">{children}</p>;
}

export function Loading({ rows = 3 }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton h-24" />
      ))}
    </div>
  );
}

const ORDER_TONE = { recebido: "badge-warn", em_preparo: "badge-warn", pronto: "badge-ok" };

export function itemsText(order) {
  return order.items.map((i) => `${i.quantity}× ${i.name}`).join(", ");
}

/* ---------- Cozinha ---------- */

export function Cozinha() {
  const session = useSession("cozinha,gerente");
  const { data, load, offline } = useEstado();
  if (!session) return null;
  const queue = data?.orders.filter((o) => o.status === "recebido" || o.status === "em_preparo") ?? [];
  return (
    <Shell title="Cozinha" session={session} offline={offline}>
      <div className="mb-4 grid grid-cols-3 gap-3">
        <Kpi label="Na fila" value={queue.length} />
        <Kpi label="Recebidos" value={queue.filter((o) => o.status === "recebido").length} />
        <Kpi label="Em preparo" value={queue.filter((o) => o.status === "em_preparo").length} />
      </div>
      {!data ? (
        <Loading />
      ) : queue.length === 0 ? (
        <Empty>Nenhum pedido na fila.</Empty>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {queue.map((order) => (
            <li key={order.id} className="glass lift rise rounded-[22px] p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl">Mesa {order.tableNumber}</h2>
                <span className={`badge ${ORDER_TONE[order.status]}`}>
                  {labelOf(order.status, ORDER_STATUS_LABEL)}
                </span>
              </div>
              <p className="mt-1 text-xs font-medium text-muted">
                Pedido #{order.id} · há {timeAgo(order.createdAt)}
              </p>
              <ul className="mt-3 space-y-1 text-[15px]">
                {order.items.map((i) => (
                  <li key={i.id}>
                    <strong className="tnum">{i.quantity}×</strong> {i.name}
                  </li>
                ))}
              </ul>
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

/* ---------- Garçom ---------- */

export function Garcom() {
  const session = useSession("garcom,gerente");
  const { data, load, offline } = useEstado();
  if (!session) return null;
  const ready = data?.orders.filter((o) => o.status === "pronto") ?? [];
  return (
    <Shell title="Garçom" session={session} offline={offline}>
      <div className="mb-4 grid grid-cols-3 gap-3">
        <Kpi label="Mesas ocupadas" value={data?.tables.filter((t) => t.status === "ocupada").length ?? "–"} />
        <Kpi label="Mesas livres" value={data?.tables.filter((t) => t.status === "livre").length ?? "–"} />
        <Kpi label="Para entregar" value={ready.length} />
      </div>
      {!data ? (
        <Loading rows={2} />
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {data.tables.map((table) => (
              <li key={table.id} className="glass rise rounded-[20px] p-3">
                <p className="font-display text-lg">Mesa {table.number}</p>
                <span
                  className={`badge mt-1 ${table.status === "ocupada" ? "badge-warn" : "badge-ok"}`}
                >
                  {labelOf(table.status, TABLE_STATUS_LABEL)}
                </span>
              </li>
            ))}
          </ul>
          <h2 className="eyebrow mt-8">Para entregar</h2>
          {ready.length === 0 ? (
            <div className="mt-3">
              <Empty>Nenhum prato pronto no momento.</Empty>
            </div>
          ) : null}
          <ul className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {ready.map((order) => (
              <li
                key={order.id}
                className="glass rise flex items-center justify-between gap-3 rounded-[22px] p-4"
              >
                <div>
                  <p className="font-display text-xl">Mesa {order.tableNumber}</p>
                  <p className="text-sm text-muted">{itemsText(order)}</p>
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
        </>
      )}
    </Shell>
  );
}

/* ---------- Caixa ---------- */

export function Caixa() {
  const session = useSession("caixa,gerente");
  const { data, load, offline } = useEstado();
  const [method, setMethod] = useState("pix");
  const [paying, setPaying] = useState(null);
  const [error, setError] = useState("");
  if (!session) return null;
  const open = data?.accounts.filter((a) => a.status !== "paga") ?? [];
  const pending = open.reduce((sum, a) => sum + a.total, 0);

  async function pay(account) {
    setPaying(account.id);
    setError("");
    try {
      await pagarConta(account.tableNumber, method);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setPaying(null);
    }
  }

  return (
    <Shell title="Caixa" session={session} offline={offline}>
      <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_auto]">
        <label className="block w-full text-sm font-semibold">
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
        <Kpi label="A receber" value={formatBRL(pending)} />
        <Kpi label="Contas abertas" value={open.length} />
      </div>
      {error ? (
        <p role="alert" className="mt-4 rounded-2xl bg-red-700/10 px-4 py-3 text-sm font-medium text-red-800">
          {error}
        </p>
      ) : null}
      {!data ? (
        <div className="mt-6">
          <Loading rows={2} />
        </div>
      ) : (
        <>
        {open.length === 0 ? (
          <div className="mt-5">
            <Empty>Nenhuma conta aberta.</Empty>
          </div>
        ) : null}
        <ul className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {open.map((account) => {
            const orders = data.orders.filter((o) => account.orderIds.includes(o.id));
            return (
              <li key={account.id} className="glass lift rise rounded-[22px] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl">Mesa {account.tableNumber}</h2>
                    <span
                      className={`badge mt-1 ${
                        account.status === "aguardando_pagamento" ? "badge-warn" : ""
                      }`}
                    >
                      {labelOf(account.status, ACCOUNT_STATUS_LABEL)}
                    </span>
                  </div>
                  <p className="stat-value !text-[1.6rem]">{formatBRL(account.total)}</p>
                </div>
                {orders.length ? (
                  <ul className="mt-3 space-y-0.5 text-sm text-muted">
                    {orders.map((o) => (
                      <li key={o.id}>{itemsText(o)}</li>
                    ))}
                  </ul>
                ) : null}
                <button
                  type="button"
                  disabled={paying === account.id}
                  className="btn btn-primary btn-sm mt-4"
                  onClick={() => pay(account)}
                >
                  {paying === account.id ? "Registrando…" : `Registrar pagamento · ${PAYMENT_LABEL[method]}`}
                </button>
              </li>
            );
          })}
        </ul>
        </>
      )}
    </Shell>
  );
}
