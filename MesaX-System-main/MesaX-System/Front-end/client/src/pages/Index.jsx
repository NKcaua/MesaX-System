import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProdutos } from "../api.js";
import { formatBRL, site } from "../site.js";

function CupLogo({ className }) {
  return (
    <svg viewBox="0 0 68 53" className={className} fill="none" aria-hidden>
      <path
        d="M18 20h26c1.2 0 2.2 1 2.2 2.2v12.6c0 6.2-5.4 11.2-12.2 11.2h-6c-6.8 0-12.2-5-12.2-11.2V22.2c0-1.2 1-2.2 2.2-2.2Z"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <path
        d="M46.2 24.5h5.2c2.8 0 5.1 2.2 5.1 5s-2.3 5-5.1 5h-5.2"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path d="M16 48.5h30" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
      <div
        className={`pointer-events-auto mx-auto w-[min(1400px,calc(100%-1.25rem))] ${
          open ? "mt-0" : "mt-3"
        }`}
      >
        <div
          className={`glass-strong flex items-center justify-between px-4 sm:px-7 ${
            open ? "min-h-dvh flex-col rounded-[28px]" : "h-[68px] rounded-full"
          }`}
        >
          <Link
            to="/"
            className="relative z-20 flex items-center gap-2 py-3"
            onClick={() => setOpen(false)}
          >
            <CupLogo className="h-10 w-[52px] text-ink" />
            <span className="hidden font-display text-[1.15rem] font-semibold tracking-tight sm:inline">
              Caseirão
            </span>
          </Link>
          <button
            type="button"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            className="absolute right-4 top-3 z-20 flex h-12 w-12 flex-col items-center justify-center gap-1.5 rounded-full md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            <span className={`block h-[2.5px] w-7 rounded-full bg-ink ${open ? "translate-y-[5px] rotate-45" : ""}`} />
            <span className={`block h-[2.5px] w-7 rounded-full bg-ink ${open ? "-translate-y-[4px] -rotate-45" : ""}`} />
          </button>
          <nav
            className={
              open
                ? "flex w-full flex-col items-center gap-8 pb-28 pt-16"
                : "hidden items-center gap-1 md:flex"
            }
          >
            <a
              href="/#menu"
              onClick={() => setOpen(false)}
              className="rounded-full px-4 py-2 text-[15px] font-medium tracking-wide"
            >
              Cardápio
            </a>
            <Link
              to="/mesa"
              onClick={() => setOpen(false)}
              className="rounded-full px-4 py-2 text-[15px] font-medium tracking-wide"
            >
              Pedir na mesa
            </Link>
            <Link
              to="/equipe"
              onClick={() => setOpen(false)}
              className="btn btn-primary btn-sm ml-1"
            >
              Equipe
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

const slides = [
  { src: "/images/prato-bife.jpg", alt: "Bife acebolado" },
  { src: "/images/prato-frango.jpg", alt: "Frango grelhado" },
  { src: "/images/cafe-tables.png", alt: "Salão" },
  { src: "/images/prato-peixe.jpg", alt: "Peixe" },
  { src: "/images/bebida-suco.jpg", alt: "Suco" },
];

function Carousel() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 3800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative mx-auto h-[380px] w-full max-w-[920px] sm:h-[520px]">
      {slides.map((slide, i) => {
        const offset = (i - index + slides.length) % slides.length;
        const visible = offset < 3;
        const x = offset === 0 ? 0 : offset === 1 ? 18 : 34;
        const scale = offset === 0 ? 1 : offset === 1 ? 0.92 : 0.84;
        const rotate = offset === 0 ? -2 : offset === 1 ? 4 : -6;
        return (
          <button
            key={slide.src}
            type="button"
            onClick={() => setIndex(i)}
            className="absolute left-1/2 top-0 h-full w-[78%] max-w-[640px] overflow-hidden rounded-[32px] shadow-[0_24px_60px_rgba(70,42,8,0.18)]"
            style={{
              transform: `translateX(calc(-50% + ${x}%)) scale(${scale}) rotate(${rotate}deg)`,
              zIndex: visible ? 10 - offset : 0,
              opacity: visible ? 1 : 0,
              transition: "transform 700ms cubic-bezier(.22,.9,.3,1), opacity 500ms",
            }}
          >
            <img src={slide.src} alt={slide.alt} className="h-full w-full object-cover" />
          </button>
        );
      })}
    </div>
  );
}

export default function Index() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getProdutos()
      .then(setProducts)
      .catch((err) => setError(err.message));
  }, []);

  const executivos = products.filter((p) => p.category === "executivo");
  const bebidas = products.filter((p) => p.category === "bebida");
  const categories = [
    {
      id: "executivo",
      title: "Pratos executivos",
      image: "/images/prato-bife.jpg",
      label: "Almoço",
      items: executivos,
    },
    {
      id: "bebida",
      title: "Bebidas",
      image: "/images/bebida-suco.jpg",
      label: "Bebidas",
      items: bebidas,
    },
  ];

  return (
    <div className="min-h-dvh text-ink">
      <Header />
      <main className="mx-auto flex w-[90%] max-w-[1400px] flex-col items-center gap-16 pb-10 pt-32 sm:gap-20 sm:pt-40">
        <section className="flex flex-col items-center gap-7 text-center">
          <p className="eyebrow">Google · 4,8</p>
          <h1 className="max-w-[14ch] text-[48px] sm:text-[58px] lg:text-[68px]">{site.tagline}</h1>
          <p className="max-w-[32ch] text-lg font-medium leading-relaxed text-muted">{site.subtitle}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/mesa" className="btn btn-primary">
              Pedir na mesa
            </Link>
            <a href="/#menu" className="btn btn-ghost">
              Ver cardápio
            </a>
          </div>
          <Carousel />
        </section>

        <section className="w-full">
          <h2 className="text-[32px] sm:text-[42px]">Como pedir</h2>
          <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-muted">
            O cliente pede sozinho. Cozinha, garçom e caixa acompanham a mesma mesa.
          </p>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["01", "Sente na mesa", "QR na mesa ou tablet da casa."],
              ["02", "Leia o cardápio", "Pratos executivos e bebidas com preço."],
              ["03", "Confirme o pedido", "Vai direto para a cozinha, na sua mesa."],
              ["04", "Acompanhe", "Recebido, em preparo, pronto e entregue."],
              ["05", "Peça a conta", "Pix, dinheiro, débito ou crédito."],
            ].map(([n, title, text]) => (
              <li key={n} className="glass rounded-[28px] p-5">
                <p className="eyebrow">{n}</p>
                <h3 className="mt-3 text-[1.35rem]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="menu" className="w-full scroll-mt-28">
          <h2 className="text-[32px] sm:text-[42px]">Cardápio</h2>
          {error ? (
            <p className="glass mt-6 rounded-[24px] p-6 text-muted">
              Não foi possível conectar à API ({error}). Suba o servidor Node em{" "}
              <code className="rounded-full bg-ink/5 px-2 py-0.5 text-sm">server/index.js</code> e o
              Postgres com <code className="rounded-full bg-ink/5 px-2 py-0.5 text-sm">db/schema.sql</code>.
            </p>
          ) : null}
          {!error && products.length === 0 ? (
            <p className="mt-6 text-muted">Carregando cardápio…</p>
          ) : null}
          <div className="mt-10 flex flex-col gap-6">
            {categories
              .filter((c) => c.items.length)
              .map((category, index) => (
                <article
                  key={category.id}
                  className={`flex flex-col gap-4 lg:flex-row ${
                    index % 2 === 1 ? "lg:flex-row-reverse" : ""
                  }`}
                >
                  <div className="glass flex-1 rounded-[32px] p-6 sm:p-10">
                    <h3 className="text-[1.75rem]">{category.title}</h3>
                    <ul className="mt-8 flex flex-col gap-8">
                      {category.items.map((item) => (
                        <li key={item.id}>
                          <div className="flex justify-between gap-4">
                            <p className="text-lg font-medium tracking-tight">{item.name}</p>
                            <p className="text-lg font-semibold tracking-tight">{formatBRL(item.price)}</p>
                          </div>
                          <p className="mt-1 max-w-[52ch] text-[15px] leading-relaxed text-muted">
                            {item.description}
                          </p>
                          {!item.available ? (
                            <p className="mt-1 text-sm font-medium">Indisponível</p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="relative h-[60vh] w-full overflow-hidden rounded-[32px] lg:sticky lg:top-24 lg:h-[80vh] lg:w-[42%] lg:flex-none">
                    <img src={category.image} alt="" className="h-full w-full object-cover" />
                    <span className="glass-strong absolute left-6 top-6 rounded-full px-4 py-1.5 text-sm font-semibold tracking-wide">
                      {category.label}
                    </span>
                  </div>
                </article>
              ))}
          </div>
        </section>

        <section className="relative min-h-[70vh] w-full overflow-hidden rounded-[32px]">
          <img
            src="/images/cafe-tables.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="relative z-10 flex max-w-xl flex-col gap-5 p-6 sm:p-12">
            <div className="glass-dark rounded-[28px] p-6 sm:p-8">
              <h2 className="text-[32px] text-cream sm:text-[42px]">Comida de casa</h2>
              <p className="mt-4 text-lg leading-relaxed text-cream/90">{site.about}</p>
              <p className="mt-3 font-medium text-cream">{site.aboutInvite}</p>
              <p className="mt-4 text-cream/90">
                {site.address.name}
                <br />
                {site.address.line1}
                <br />
                {site.address.line2}
              </p>
              <Link to="/mesa" className="btn btn-primary mt-6 w-fit">
                Pedir na mesa
              </Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="mt-10 px-4 pb-8">
        <div className="glass mx-auto grid w-full max-w-[1400px] gap-10 rounded-[32px] px-[5%] py-14 sm:grid-cols-3">
          <p className="text-sm leading-relaxed text-muted">{site.aboutInvite}</p>
          <div>
            <p className="eyebrow">Horário</p>
            <ul className="mt-3 space-y-1 text-[15px] font-medium">
              {site.hours.map((row) => (
                <li key={row.days}>
                  {row.days}: {row.time}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow">Telefone</p>
            <a href={site.phoneHref} className="mt-2 block font-display text-2xl">
              {site.phone}
            </a>
            <Link to="/equipe" className="mt-4 inline-block text-sm font-medium">
              Área da equipe
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
