import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { criarPedido, getEstado, pedirConta } from "../api.js";
import { FormNotice, LegalLinks, useTitle } from "../components.jsx";
import { formatBRL, labelOf, ORDER_STATUS_LABEL } from "../site.js";

function Category({ title, list, cart, setCart, waitingPay }) {
  return (
    <section className="px-4 pt-8">
      <h2 className="text-[28px]">{title}</h2>
      <ul className="mt-4 space-y-4">
        {list.map((product) => {
          const qty = cart[product.id] || 0;
          return (
            <li
              key={product.id}
              className={`glass lift flex gap-3 rounded-[24px] p-3 ${product.available ? "" : "opacity-50"}`}
            >
              <img
                src={product.image}
                alt={`Foto de ${product.name}`}
                loading="lazy"
                className="h-24 w-24 rounded-[18px] object-cover"
              />
              <div className="flex-1">
                <div className="flex justify-between gap-2">
                  <p className="font-medium tracking-tight">{product.name}</p>
                  <p className="tnum text-sm font-semibold">{formatBRL(product.price)}</p>
                </div>
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">
                  {product.description}
                </p>
                {product.available ? (
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      aria-label={`Remover ${product.name}`}
                      disabled={qty === 0}
                      className="h-9 w-9 rounded-full bg-cream/80 text-lg font-medium shadow-sm disabled:opacity-40"
                      onClick={() => setCart((c) => ({ ...c, [product.id]: Math.max(0, qty - 1) }))}
                    >
                      −
                    </button>
                    <span className="tnum w-5 text-center text-sm font-semibold" aria-live="polite">
                      {qty}
                    </span>
                    <button
                      type="button"
                      aria-label={`Adicionar ${product.name}`}
                      disabled={waitingPay}
                      className="h-9 w-9 rounded-full bg-ink text-lg font-medium text-cream disabled:opacity-40"
                      onClick={() => setCart((c) => ({ ...c, [product.id]: qty + 1 }))}
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <span className="badge badge-off mt-2">Indisponível</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function MesaPage() {
  const { numero } = useParams();
  const n = Number(numero);
  useTitle(numero ? `Mesa ${numero}` : "Escolher mesa");
  const [data, setData] = useState(null);
  const [cart, setCart] = useState({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    setData(await getEstado());
  }

  useEffect(() => {
    load().catch((e) => setMessage(e.message));
    const t = setInterval(() => load().catch(() => {}), 2500);
    return () => clearInterval(t);
  }, []);

  const table = data?.tables.find((t) => t.number === n);
  const account = data?.accounts.find((a) => a.tableId === table?.id && a.status !== "paga");
  const orders = data?.orders.filter((o) => account?.orderIds.includes(o.id)) ?? [];
  const waitingPay = account?.status === "aguardando_pagamento";
  const cartItems = useMemo(() => {
    if (!data) return [];
    return Object.entries(cart)
      .filter(([, q]) => q > 0)
      .map(([id, quantity]) => {
        const product = data.products.find((p) => p.id === id);
        return product ? { product, quantity } : null;
      })
      .filter(Boolean);
  }, [cart, data]);
  const cartTotal = cartItems.reduce((s, r) => s + r.product.price * r.quantity, 0);
  const cartCount = cartItems.reduce((s, r) => s + r.quantity, 0);

  if (!numero) {
    const tables =
      data?.tables ?? [1, 2, 3, 4, 5, 6, 7, 8].map((num) => ({ number: num, capacity: 4 }));
    return (
      <main id="conteudo" tabIndex={-1} className="mx-auto max-w-lg px-4 py-10">
        <p className="eyebrow">Salão</p>
        <h1 className="mt-2 text-[36px]">Qual é a sua mesa?</h1>
        <p className="mt-3 leading-relaxed text-muted">
          No salão isso é o QR. Aqui você escolhe o número.
        </p>
        <ul className="mt-8 grid grid-cols-2 gap-3">
          {tables.map((tableRow) => (
            <li key={tableRow.number}>
              <Link
                to={`/mesa/${tableRow.number}`}
                className="glass flex h-24 flex-col justify-center rounded-[24px] px-4"
              >
                <span className="font-display text-2xl">Mesa {tableRow.number}</span>
                <span className="text-sm text-muted">{tableRow.capacity} lugares</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link to="/" className="mt-8 inline-block text-sm font-medium text-muted underline underline-offset-4">
          ← Início
        </Link>
        <LegalLinks className="mt-6" />
      </main>
    );
  }

  if (data && !table) {
    return (
      <main id="conteudo" tabIndex={-1} className="mx-auto max-w-lg px-4 py-10">
        <p className="glass rounded-[24px] p-6 text-muted">Mesa {n} não encontrada.</p>
        <Link to="/mesa" className="mt-6 inline-block text-sm font-medium text-muted">
          ← Escolher outra mesa
        </Link>
      </main>
    );
  }

  if (!data || !table) {
    return (
      <main id="conteudo" tabIndex={-1} className="mx-auto max-w-lg space-y-3 px-4 py-10" aria-busy={!message}>
        {message ? (
          <>
            <p role="alert" className="glass rounded-[24px] p-6 text-muted">
              {message}
            </p>
            <Link to="/mesa" className="inline-block text-sm font-medium text-muted">
              ← Escolher outra mesa
            </Link>
          </>
        ) : (
          <>
            <div className="skeleton h-16" />
            <div className="skeleton h-32" />
            <div className="skeleton h-32" />
          </>
        )}
      </main>
    );
  }

  async function send() {
    setBusy(true);
    try {
      await criarPedido(
        n,
        cartItems.map((r) => ({ productId: r.product.id, quantity: r.quantity })),
      );
      setCart({});
      setMessage("Pedido enviado para a cozinha.");
      await load();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function bill() {
    setBusy(true);
    try {
      await pedirConta(n);
      setMessage("Conta pedida. O caixa registra o pagamento.");
      await load();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="conteudo" tabIndex={-1} className="mx-auto max-w-lg pb-36">
      <header className="sticky top-0 z-10 px-3 pt-3">
        <div className="glass-strong flex items-center justify-between rounded-full px-5 py-3">
          <div>
            <p className="eyebrow">Caseirão</p>
            <h1 className="font-display text-lg">Mesa {table.number}</h1>
          </div>
          <Link to="/mesa" className="text-sm font-medium text-muted">
            Trocar mesa
          </Link>
        </div>
      </header>
      {waitingPay ? (
        <section className="glass m-4 rounded-[24px] p-5">
          <h2 className="text-xl">Aguardando pagamento</h2>
          <p className="mt-2 text-sm text-muted">Total: {formatBRL(account?.total ?? 0)}</p>
        </section>
      ) : null}
      {orders.map((order) => (
        <div key={order.id} className="glass rise mx-4 mt-3 rounded-[20px] p-4">
          <div className="flex justify-between text-sm">
            <span
              className={`badge ${order.status === "pronto" || order.status === "entregue" ? "badge-ok" : "badge-warn"}`}
            >
              {labelOf(order.status, ORDER_STATUS_LABEL)}
            </span>
            <span className="tnum font-medium">{formatBRL(order.total)}</span>
          </div>
          <p className="mt-2 text-sm text-muted">
            {order.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
          </p>
        </div>
      ))}
      <Category
        title="Pratos executivos"
        list={data.products.filter((p) => p.category === "executivo")}
        cart={cart}
        setCart={setCart}
        waitingPay={waitingPay}
      />
      <Category
        title="Bebidas"
        list={data.products.filter((p) => p.category === "bebida")}
        cart={cart}
        setCart={setCart}
        waitingPay={waitingPay}
      />
      {message ? (
        <p role="status" className="px-4 pt-4 text-sm font-medium text-muted">
          {message}
        </p>
      ) : null}
      <div className="space-y-3 px-4 pt-6">
        <FormNotice>
          Ao confirmar o pedido registramos apenas a mesa, os itens e os valores; não pedimos dados pessoais.
        </FormNotice>
        <LegalLinks />
      </div>
      <div className="fixed inset-x-0 bottom-0 p-4">
        <div className="glass-strong mx-auto flex max-w-lg gap-3 rounded-full p-2">
          {orders.length > 0 && !waitingPay ? (
            <button type="button" onClick={bill} className="btn btn-ghost btn-sm">
              Pedir conta
            </button>
          ) : null}
          <button
            type="button"
            disabled={busy || waitingPay || !cartItems.length}
            onClick={send}
            className="btn btn-primary btn-sm flex-1 justify-between px-5"
          >
            <span>
              {busy
                ? "Enviando…"
                : cartCount
                  ? `Confirmar pedido (${cartCount})`
                  : "Confirmar pedido"}
            </span>
            <span className="tnum">{formatBRL(cartTotal)}</span>
          </button>
        </div>
      </div>
    </main>
  );
}
