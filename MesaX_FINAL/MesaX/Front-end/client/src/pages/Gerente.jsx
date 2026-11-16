import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  atualizarProduto,
  clearSession,
  enviarImagemProduto,
  getRelatorioHistorico,
  getRelatorioVendas,
  resetDemo,
  toggleProduto,
} from "../api.js";
import { AreaChart, BarChart, Donut, RankBars } from "../charts.jsx";
import {
  formatBRL,
  formatISODate,
  labelOf,
  ORDER_STATUS_LABEL,
  PAYMENT_LABEL,
  toISODate,
} from "../site.js";
import { Empty, Kpi, Loading, Shell, useEstado, useSession } from "./Equipe.jsx";

/* ---------- Período ---------- */

const PRESETS = [
  ["hoje", "Hoje", () => [toISODate(), toISODate()]],
  ["ontem", "Ontem", () => [toISODate(new Date(), -1), toISODate(new Date(), -1)]],
  ["7d", "7 dias", () => [toISODate(new Date(), -6), toISODate()]],
  ["30d", "30 dias", () => [toISODate(new Date(), -29), toISODate()]],
  [
    "mes",
    "Este mês",
    () => {
      const now = new Date();
      return [toISODate(new Date(now.getFullYear(), now.getMonth(), 1)), toISODate()];
    },
  ],
];

const shortDay = (iso) => formatISODate(iso).slice(0, 5);
const brlShort = (v) => (v >= 1000 ? `R$ ${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k` : `R$ ${Math.round(v)}`);
const STATUS_COLOR = { recebido: "#a85f0d", em_preparo: "#2f6f8f", pronto: "#4d7a3a", entregue: "#14110c" };

function PeriodBar({ period, onApply }) {
  const [from, setFrom] = useState(period.from);
  const [to, setTo] = useState(period.to);
  useEffect(() => {
    setFrom(period.from);
    setTo(period.to);
  }, [period.from, period.to]);
  const invalid = !from || !to || from > to;
  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!invalid) onApply({ from, to, preset: "" });
      }}
    >
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Períodos rápidos">
        {PRESETS.map(([key, label, calc]) => (
          <button
            key={key}
            type="button"
            className="chip"
            aria-pressed={period.preset === key}
            onClick={() => {
              const [f, t] = calc();
              onApply({ from: f, to: t, preset: key });
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <input
        type="date"
        aria-label="Data inicial"
        value={from}
        max={to || undefined}
        onChange={(e) => setFrom(e.target.value)}
        className="field field-sm"
      />
      <span className="text-sm text-muted">até</span>
      <input
        type="date"
        aria-label="Data final"
        value={to}
        min={from || undefined}
        onChange={(e) => setTo(e.target.value)}
        className="field field-sm"
      />
      <button type="submit" disabled={invalid} className="btn btn-primary btn-xs">
        Aplicar
      </button>
    </form>
  );
}

/* ---------- Dados ---------- */

function useReports(period, fetchers) {
  const navigate = useNavigate();
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const ticket = useRef(0);
  const fetchersRef = useRef(fetchers);
  fetchersRef.current = fetchers;

  const run = useCallback(
    async (quiet) => {
      const current = ++ticket.current;
      if (!quiet) setState((s) => ({ ...s, loading: true, error: "" }));
      try {
        const data = await Promise.all(fetchersRef.current.map((f) => f(period.from, period.to)));
        if (current === ticket.current) setState({ data, loading: false, error: "" });
      } catch (err) {
        if (current !== ticket.current) return;
        if (err.status === 401 || err.status === 403) {
          clearSession();
          navigate("/equipe");
          return;
        }
        setState((s) => ({ data: quiet ? s.data : null, loading: false, error: err.message }));
      }
    },
    [period.from, period.to, navigate],
  );

  useEffect(() => {
    run(false);
    const t = setInterval(() => run(true), 20000);
    return () => clearInterval(t);
  }, [run]);

  return state;
}

function Card({ title, aside, className = "", children }) {
  return (
    <section className={`glass rise rounded-[22px] p-4 ${className}`}>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-[1.05rem]">{title}</h2>
        {aside ? <span className="text-xs text-muted">{aside}</span> : null}
      </div>
      {children}
    </section>
  );
}

function ErrorBox({ children }) {
  return (
    <p role="alert" className="rounded-2xl bg-red-700/10 px-4 py-3 text-sm font-medium text-red-800">
      {children}
    </p>
  );
}

function DashSkeleton() {
  return (
    <div className="grid gap-3 lg:grid-cols-12" aria-busy="true" aria-label="Carregando">
      {[3, 3, 3, 3].map((c, i) => (
        <div key={i} className="skeleton h-24 lg:col-span-3" />
      ))}
      <div className="skeleton h-56 lg:col-span-8" />
      <div className="skeleton h-56 lg:col-span-4" />
    </div>
  );
}

const fetchGeral = [getRelatorioVendas, getRelatorioHistorico];

/* ---------- Visão geral ---------- */

function VisaoGeral({ period, estado }) {
  const { data, loading, error } = useReports(period, fetchGeral);
  if (error) return <ErrorBox>{error}</ErrorBox>;
  if (!data) return <DashSkeleton />;
  const [sales, history] = data;
  const dailyData = sales.daily.map((d) => ({
    label: shortDay(d.day),
    value: d.total,
    title: `${formatISODate(d.day)}: ${formatBRL(d.total)} · ${d.accounts} conta(s)`,
  }));
  const hourData = history.byHour
    .filter((h) => h.hour >= 6)
    .map((h) => ({ label: `${h.hour}h`, value: h.orders, title: `${h.hour}h: ${h.orders} pedido(s)` }));
  const live = estado
    ? {
        occupied: estado.tables.filter((t) => t.status === "ocupada").length,
        tables: estado.tables.length,
        queue: estado.orders.filter((o) => o.status === "recebido" || o.status === "em_preparo").length,
        ready: estado.orders.filter((o) => o.status === "pronto").length,
        waiting: estado.accounts.filter((a) => a.status === "aguardando_pagamento").length,
      }
    : null;

  return (
    <div className={`grid gap-3 lg:grid-cols-12 ${loading ? "opacity-70" : ""}`}>
      <div className="grid grid-cols-2 gap-3 lg:col-span-12 lg:grid-cols-4">
        <Kpi label="Valor recebido" value={formatBRL(sales.totalReceived)} />
        <Kpi
          label="Contas pagas"
          value={sales.paidAccounts}
          hint={sales.byMethod.length ? `${sales.byMethod.length} forma(s) de pagamento` : "Nenhuma no período"}
        />
        <Kpi label="Ticket médio" value={formatBRL(sales.averageTicket)} hint="Por conta paga" />
        <Kpi label="Pedidos" value={history.totalOrders} hint={`${formatBRL(history.totalValue)} em pedidos`} />
      </div>

      <Card
        title="Faturamento por dia"
        aside={`${formatISODate(sales.from)}${sales.from === sales.to ? "" : ` a ${formatISODate(sales.to)}`}`}
        className="lg:col-span-8"
      >
        {sales.paidAccounts === 0 ? (
          <p className="py-10 text-center text-sm text-muted">Nenhuma conta paga neste período.</p>
        ) : dailyData.length > 14 ? (
          <AreaChart data={dailyData} format={brlShort} label="Faturamento por dia" />
        ) : (
          <BarChart data={dailyData} format={brlShort} label="Faturamento por dia" />
        )}
      </Card>

      <Card title="Formas de pagamento" className="lg:col-span-4">
        {sales.byMethod.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">Sem pagamentos.</p>
        ) : (
          <Donut
            center={`${sales.paidAccounts}`}
            format={formatBRL}
            label="Formas de pagamento"
            data={sales.byMethod.map((m) => ({ label: labelOf(m.method, PAYMENT_LABEL), value: m.total }))}
          />
        )}
      </Card>

      <Card title="Mais vendidos" aside="unidades" className="lg:col-span-5">
        {sales.topProducts.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">Sem vendas no período.</p>
        ) : (
          <RankBars
            data={sales.topProducts.slice(0, 6).map((p) => ({
              label: p.name,
              value: p.quantity,
              right: `${p.quantity} un. · ${formatBRL(p.revenue)}`,
            }))}
          />
        )}
      </Card>

      <Card title="Pedidos por horário" className="lg:col-span-4">
        {history.totalOrders === 0 ? (
          <p className="py-10 text-center text-sm text-muted">Sem pedidos no período.</p>
        ) : (
          <BarChart data={hourData} color="#a85f0d" height={170} label="Pedidos por horário" />
        )}
      </Card>

      <Card title="Agora no salão" aside="ao vivo" className="lg:col-span-3">
        {live ? (
          <ul className="space-y-2.5 text-sm">
            {[
              ["Mesas ocupadas", `${live.occupied}/${live.tables}`],
              ["Na cozinha", live.queue],
              ["Para entregar", live.ready],
              ["Aguardando pagamento", live.waiting],
            ].map(([label, value]) => (
              <li key={label} className="flex items-center justify-between gap-2">
                <span className="text-muted">{label}</span>
                <span className="stat-value !text-[1.4rem]">{value}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="skeleton h-28" />
        )}
      </Card>
    </div>
  );
}

/* ---------- Histórico ---------- */

const fetchHistorico = [getRelatorioHistorico];

function Historico({ period }) {
  const { data, loading, error } = useReports(period, fetchHistorico);
  if (error) return <ErrorBox>{error}</ErrorBox>;
  if (!data) return <DashSkeleton />;
  const [h] = data;
  const dayData = h.byDay.map((d) => ({
    label: shortDay(d.day),
    value: d.orders,
    title: `${formatISODate(d.day)}: ${d.orders} pedido(s) · ${formatBRL(d.total)}`,
  }));
  const hourData = h.byHour
    .filter((x) => x.hour >= 6)
    .map((x) => ({ label: `${x.hour}h`, value: x.orders, title: `${x.hour}h: ${x.orders} pedido(s)` }));
  const statusData = ["recebido", "em_preparo", "pronto", "entregue"]
    .map((status) => ({
      label: labelOf(status, ORDER_STATUS_LABEL),
      value: h.byStatus.find((s) => s.status === status)?.orders ?? 0,
      color: STATUS_COLOR[status],
    }))
    .filter((s) => s.value > 0);
  const empty = h.totalOrders === 0;

  return (
    <div className={`grid gap-3 lg:grid-cols-12 ${loading ? "opacity-70" : ""}`}>
      <div className="grid grid-cols-3 gap-3 lg:col-span-12">
        <Kpi label="Pedidos" value={h.totalOrders} />
        <Kpi label="Valor em pedidos" value={formatBRL(h.totalValue)} />
        <Kpi label="Pedido médio" value={formatBRL(h.averageOrder)} />
      </div>

      <Card title="Pedidos por dia" className="lg:col-span-5">
        {empty ? (
          <p className="py-10 text-center text-sm text-muted">Nenhum pedido neste período.</p>
        ) : dayData.length > 14 ? (
          <AreaChart data={dayData} height={170} label="Pedidos por dia" />
        ) : (
          <BarChart data={dayData} height={170} label="Pedidos por dia" />
        )}
      </Card>

      <Card title="Pedidos por horário" className="lg:col-span-4">
        {empty ? (
          <p className="py-10 text-center text-sm text-muted">Sem pedidos.</p>
        ) : (
          <BarChart data={hourData} color="#a85f0d" height={170} label="Pedidos por horário" />
        )}
      </Card>

      <Card title="Situação dos pedidos" className="lg:col-span-3">
        {empty ? (
          <p className="py-10 text-center text-sm text-muted">Sem pedidos.</p>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Donut center={`${h.totalOrders}`} data={statusData} label="Situação dos pedidos" />
          </div>
        )}
      </Card>

      <Card title="Últimos pedidos" aside={`${h.recent.length} de ${h.totalOrders}`} className="lg:col-span-12">
        {empty ? (
          <Empty>Nenhum pedido neste período.</Empty>
        ) : (
          <div className="max-h-[22rem] overflow-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Últimos pedidos do período</caption>
              <thead className="sticky top-0 bg-cream/90 text-xs uppercase tracking-wider text-muted backdrop-blur">
                <tr>
                  <th scope="col" className="py-2 pr-3 font-semibold">Pedido</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Mesa</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Data</th>
                  <th scope="col" className="hidden py-2 pr-3 font-semibold md:table-cell">Itens</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Situação</th>
                  <th scope="col" className="py-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {h.recent.map((o) => (
                  <tr key={o.id}>
                    <td className="tnum py-2 pr-3 font-medium">#{o.id}</td>
                    <td className="py-2 pr-3">Mesa {o.tableNumber}</td>
                    <td className="tnum whitespace-nowrap py-2 pr-3 text-muted">
                      {new Date(o.createdAt).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="hidden max-w-[22rem] truncate py-2 pr-3 text-muted md:table-cell">{o.items}</td>
                    <td className="py-2 pr-3">
                      <span className={`badge ${o.status === "entregue" ? "badge-ok" : "badge-warn"}`}>
                        {labelOf(o.status, ORDER_STATUS_LABEL)}
                      </span>
                    </td>
                    <td className="tnum py-2 text-right font-semibold">{formatBRL(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ---------- Cardápio ---------- */

/** Reduz a foto no navegador (lado maior 900px, JPEG) antes de enviar. */
function prepararImagem(file) {
  return new Promise((resolve, reject) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      reject(new Error("Escolha uma imagem JPG, PNG ou WebP."));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 900 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler a imagem."));
    };
    img.src = url;
  });
}

function EditarProduto({ product, onClose, onSaved }) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [price, setPrice] = useState(String(product.price).replace(".", ","));
  const [preview, setPreview] = useState(product.image);
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const dialogRef = useRef(null);
  useEffect(() => {
    const opener = document.activeElement;
    const box = dialogRef.current;
    box?.querySelector("input[type=text], input:not([type])")?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab" || !box) return;
      const items = [...box.querySelectorAll("button, input, textarea, [href]")].filter((el) => !el.disabled);
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [onClose]);

  async function pick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await prepararImagem(file);
      setPhoto(dataUrl);
      setPreview(dataUrl);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await atualizarProduto(product.id, {
        name,
        description,
        price: Number(price.replace(/\./g, "").replace(",", ".")),
      });
      if (photo) await enviarImagemProduto(product.id, photo);
      await onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 p-3 backdrop-blur-sm sm:items-center"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="editar-titulo"
        className="glass-strong rise max-h-[92dvh] w-full max-w-2xl overflow-auto rounded-[28px] p-5 sm:p-6"
      >
      <form onSubmit={save} className="grid gap-5 sm:grid-cols-[220px_1fr]">
        <div>
          <div className="aspect-square overflow-hidden rounded-[22px] bg-ink/5">
            {preview ? <img src={preview} alt="Pré-visualização da foto do produto" className="h-full w-full object-cover" /> : null}
          </div>
          <label className="btn btn-ghost btn-sm mt-3 w-full cursor-pointer">
            {photo ? "Trocar foto" : "Alterar foto"}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} className="sr-only" />
          </label>
          <p className="mt-2 text-center text-xs text-muted">JPG, PNG ou WebP. Envie apenas fotos suas ou com licença de uso.</p>
        </div>
        <div className="space-y-3">
          <h2 id="editar-titulo" className="text-[1.4rem]">Editar produto</h2>
          <label className="block text-sm font-semibold">
            Nome
            <input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} className="field field-sm mt-1.5 !w-full" />
          </label>
          <label className="block text-sm font-semibold">
            Preço (R$)
            <input
              value={price}
              inputMode="decimal"
              onChange={(e) => setPrice(e.target.value)}
              className="field field-sm mt-1.5 !w-full"
            />
          </label>
          <label className="block text-sm font-semibold">
            Descrição
            <textarea
              value={description}
              maxLength={300}
              rows={3}
              onChange={(e) => setDescription(e.target.value)}
              className="field mt-1.5 !h-auto rounded-[20px] py-3 text-sm"
            />
          </label>
          {error ? <ErrorBox>{error}</ErrorBox> : null}
          <p className="text-xs text-muted">Pedidos já feitos mantêm o preço da época.</p>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" disabled={busy} className="btn btn-primary btn-sm">
              {busy ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </div>
      </form>
      </div>
    </div>
  );
}

function Cardapio({ data, load }) {
  const [resetting, setResetting] = useState(false);
  const [editing, setEditing] = useState(null);
  if (!data) return <Loading />;
  const groups = [
    ["Pratos executivos", data.products.filter((p) => p.category === "executivo")],
    ["Bebidas", data.products.filter((p) => p.category === "bebida")],
  ];
  return (
    <section aria-label="Cardápio">
      {groups.map(([title, list]) => (
        <div key={title} className="mb-5">
          <p className="eyebrow mb-2">
            {title} · {list.filter((p) => p.available).length}/{list.length} disponíveis
          </p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((product) => (
              <li key={product.id} className="glass lift flex items-center gap-3 rounded-[20px] p-2.5">
                <img
                  src={product.image}
                  alt={`Foto de ${product.name}`}
                  loading="lazy"
                  className={`h-16 w-16 shrink-0 rounded-[14px] object-cover ${product.available ? "" : "opacity-40"}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium tracking-tight">{product.name}</p>
                  <p className="tnum text-sm font-semibold">{formatBRL(product.price)}</p>
                  <button type="button" className="mt-0.5 text-xs font-semibold underline underline-offset-2" onClick={() => setEditing(product)}>
                    Editar preço e foto
                  </button>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={product.available}
                  aria-label={`${product.name}: ${product.available ? "disponível" : "esgotado"}`}
                  title={product.available ? "Disponível" : "Esgotado"}
                  className="switch"
                  onClick={async () => {
                    await toggleProduto(product.id, !product.available);
                    await load();
                  }}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
      {editing ? (
        <EditarProduto product={editing} onClose={() => setEditing(null)} onSaved={load} />
      ) : null}
      <button
        type="button"
        disabled={resetting}
        className="btn btn-ghost btn-sm mt-2"
        onClick={async () => {
          if (
            !window.confirm(
              "Zerar a demonstração apaga todos os pedidos, contas e pagamentos (e o histórico do relatório). Continuar?",
            )
          )
            return;
          setResetting(true);
          try {
            await resetDemo();
            await load();
          } finally {
            setResetting(false);
          }
        }}
      >
        {resetting ? "Zerando…" : "Zerar demonstração"}
      </button>
    </section>
  );
}

/* ---------- Página ---------- */

const TABS = [
  ["geral", "Visão geral"],
  ["historico", "Histórico"],
  ["cardapio", "Cardápio"],
];

export default function Gerente() {
  const session = useSession("gerente");
  const { data: estado, load, offline } = useEstado();
  const [tab, setTab] = useState("geral");
  const [period, setPeriod] = useState(() => {
    const [from, to] = PRESETS[2][2]();
    return { from, to, preset: "7d" };
  });
  if (!session) return null;
  return (
    <Shell title="Gerente" session={session} offline={offline}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div
          className="tabs"
          role="tablist"
          aria-label="Áreas do gerente"
          onKeyDown={(e) => {
            const i = TABS.findIndex(([key]) => key === tab);
            const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: TABS.length - 1 }[e.key];
            if (next === undefined) return;
            e.preventDefault();
            const target = TABS[(next + TABS.length) % TABS.length][0];
            setTab(target);
            document.getElementById(`aba-${target}`)?.focus();
          }}
        >
          {TABS.map(([key, label]) => (
            <button
              key={key}
              id={`aba-${key}`}
              type="button"
              role="tab"
              aria-selected={tab === key}
              aria-controls="painel-gerente"
              tabIndex={tab === key ? 0 : -1}
              className="tab"
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
        {tab !== "cardapio" ? <PeriodBar period={period} onApply={setPeriod} /> : null}
      </div>
      <div id="painel-gerente" role="tabpanel" aria-labelledby={`aba-${tab}`}>
        {tab === "geral" ? <VisaoGeral period={period} estado={estado} /> : null}
        {tab === "historico" ? <Historico period={period} /> : null}
        {tab === "cardapio" ? <Cardapio data={estado} load={load} /> : null}
      </div>
    </Shell>
  );
}
