import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { company, site } from "./site.js";

/** Define o título da aba (leitores de tela anunciam a mudança de página). */
export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${site.name}` : "Restaurante Caseirão";
  }, [title]);
}

/** Dados da empresa: mostra só o que foi preenchido em site.js. */
export function CompanyInfo({ className = "" }) {
  const rows = [
    ["Nome fantasia", company.tradeName],
    ["Razão social", company.legalName],
    ["CNPJ", company.cnpj],
    ["Endereço", `${site.address.line1}, ${site.address.line2}`],
    ["Telefone", site.phone],
    ["E-mail", company.email],
  ].filter(([, v]) => v);
  return (
    <dl className={`grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[max-content_1fr] ${className}`}>
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="font-semibold">{k}</dt>
          <dd className="text-muted">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

const LEGAL = [
  ["/privacidade", "Política de privacidade"],
  ["/termos", "Termos de serviço"],
  ["/reembolso", "Reembolso e cancelamento"],
];

/** Direitos autorais da empresa. */
export function Copyright({ className = "" }) {
  return (
    <p className={`text-xs text-muted ${className}`}>
      © {new Date().getFullYear()} {company.brand}. Todos os direitos reservados.
    </p>
  );
}

/** Links legais em linha + direitos autorais (rodapé das páginas). */
export function LegalLinks({ className = "", center = false }) {
  return (
    <div className={`${center ? "text-center" : ""} ${className}`}>
      <nav
        aria-label="Informações legais"
        className={`flex flex-wrap gap-x-5 gap-y-1 text-sm font-medium ${center ? "justify-center" : ""}`}
      >
        {LEGAL.map(([to, label]) => (
          <Link key={to} to={to} className="underline underline-offset-4">
            {label}
          </Link>
        ))}
      </nav>
      <Copyright className="mt-2" />
    </div>
  );
}

/** Aviso curto junto de formulários (LGPD: transparência e minimização). */
export function FormNotice({ children, className = "" }) {
  return (
    <p className={`text-xs leading-relaxed text-muted ${className}`}>
      {children}{" "}
      <Link to="/privacidade" className="font-semibold underline underline-offset-2">
        Política de privacidade
      </Link>
      .
    </p>
  );
}

const NOTICE_KEY = "caseirao-aviso-v1";

function noticeSeen() {
  try {
    return localStorage.getItem(NOTICE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Aviso de cookies e armazenamento. O site não usa cookies de publicidade,
 * análise ou rastreamento: só guarda o essencial. O aviso informa isso e
 * lembra a escolha apenas neste navegador.
 */
export function CookieNotice() {
  const [open, setOpen] = useState(() => !noticeSeen());
  const { pathname } = useLocation();
  if (!open) return null;

  function close() {
    try {
      localStorage.setItem(NOTICE_KEY, "1");
    } catch {
      /* navegador sem armazenamento: o aviso só reaparece na próxima visita */
    }
    setOpen(false);
  }

  return (
    <section
      role="region"
      aria-label="Aviso de cookies e armazenamento"
      className={`glass-strong fixed inset-x-3 z-[60] mx-auto max-w-2xl rounded-[24px] p-4 sm:p-5 ${
        pathname.startsWith("/mesa/") ? "bottom-24" : "bottom-3"
      }`}
    >
      <p className="text-sm leading-relaxed">
        <strong>Cookies e privacidade.</strong> Este site não usa cookies de publicidade, de análise ou de
        rastreamento e não carrega serviços de terceiros. Guardamos apenas o essencial no seu navegador: o
        login da equipe (apagado ao fechar a aba) e esta escolha. Saiba mais na{" "}
        <Link to="/privacidade#cookies" className="font-semibold underline underline-offset-2">
          Política de privacidade
        </Link>
        .
      </p>
      <div className="mt-3 flex justify-end">
        <button type="button" onClick={close} className="btn btn-primary btn-sm">
          Entendi
        </button>
      </div>
    </section>
  );
}
