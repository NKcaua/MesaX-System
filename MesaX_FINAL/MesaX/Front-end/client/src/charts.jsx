/* Gráficos em SVG puro (sem dependências), na paleta quente do Caseirão. */

// Cores com contraste mínimo de 3:1 sobre o fundo creme (WCAG 1.4.11).
export const PALETTE = ["#14110c", "#a85f0d", "#4d7a3a", "#7a5a2b", "#2f6f8f"];

const GRID = "rgba(20,17,12,0.09)";
const AXIS = "#4a453d";

/** Texto para leitores de tela com os valores plotados. */
function summary(data, format) {
  const itens = data.filter((d) => d.value > 0).map((d) => `${d.label}: ${format(d.value)}`);
  return itens.length ? itens.join("; ") : "Sem dados no período";
}

function niceMax(value) {
  if (value <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(value));
  const n = value / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

function Frame({ W, H, padL, padR, padT, padB, max, format, children }) {
  const ticks = [0, 0.5, 1];
  return (
    <>
      {ticks.map((t) => {
        const y = padT + (H - padT - padB) * (1 - t);
        return (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y} y2={y} stroke={GRID} strokeDasharray={t ? "3 4" : ""} />
            <text x={padL - 6} y={y + 3.5} textAnchor="end" fontSize="10" fill={AXIS}>
              {format(max * t)}
            </text>
          </g>
        );
      })}
      {children}
    </>
  );
}

/** Barras verticais. data: [{ label, value, title? }] */
export function BarChart({ data, format = (v) => String(Math.round(v)), height = 180, color = "var(--ink)", label = "Gráfico de barras" }) {
  const W = 640;
  const H = height;
  const padL = 44;
  const padR = 8;
  const padT = 12;
  const padB = 24;
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const slot = (W - padL - padR) / Math.max(1, data.length);
  const bw = Math.min(34, slot * 0.64);
  const every = Math.ceil(data.length / 12);
  const plotH = H - padT - padB;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${label}. ${summary(data, format)}`}>
      <Frame {...{ W, H, padL, padR, padT, padB, max, format }}>
        {data.map((d, i) => {
          const h = (d.value / max) * plotH;
          const x = padL + slot * i + (slot - bw) / 2;
          return (
            <g key={i}>
              <rect
                x={x}
                y={padT + plotH - h}
                width={bw}
                height={Math.max(h, d.value > 0 ? 2 : 0)}
                rx={Math.min(6, bw / 2)}
                fill={color}
                opacity={d.value > 0 ? 1 : 0.15}
              >
                <title>{d.title ?? `${d.label}: ${format(d.value)}`}</title>
              </rect>
              {i % every === 0 ? (
                <text x={x + bw / 2} y={H - 7} textAnchor="middle" fontSize="10" fill={AXIS}>
                  {d.label}
                </text>
              ) : null}
            </g>
          );
        })}
      </Frame>
    </svg>
  );
}

/** Linha com área preenchida. data: [{ label, value, title? }] */
export function AreaChart({ data, format = (v) => String(Math.round(v)), height = 180, label = "Gráfico de linha" }) {
  const W = 640;
  const H = height;
  const padL = 44;
  const padR = 12;
  const padT = 12;
  const padB = 24;
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const pts = data.map((d, i) => [
    padL + (data.length === 1 ? plotW / 2 : (plotW * i) / (data.length - 1)),
    padT + plotH - (d.value / max) * plotH,
  ]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts.at(-1)[0].toFixed(1)} ${padT + plotH} L${pts[0][0].toFixed(1)} ${padT + plotH} Z`;
  const every = Math.ceil(data.length / 8);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${label}. ${summary(data, format)}`}>
      <defs>
        <linearGradient id="area-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#a85f0d" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#a85f0d" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <Frame {...{ W, H, padL, padR, padT, padB, max, format }}>
        <path d={area} fill="url(#area-fill)" />
        <path d={line} fill="none" stroke="#14110c" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={data.length > 20 ? 2 : 3.5} fill="#fffbf0" stroke="#14110c" strokeWidth="2">
              <title>{data[i].title ?? `${data[i].label}: ${format(data[i].value)}`}</title>
            </circle>
            {i % every === 0 ? (
              <text x={x} y={H - 7} textAnchor="middle" fontSize="10" fill={AXIS}>
                {data[i].label}
              </text>
            ) : null}
          </g>
        ))}
      </Frame>
    </svg>
  );
}

/** Rosca com legenda. data: [{ label, value, color? }] */
export function Donut({ data, center, format = (v) => String(v), label = "Gráfico de rosca" }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const R = 38;
  const C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="h-32 w-32 shrink-0 -rotate-90" role="img" aria-label={`${label}. ${data.map((d) => `${d.label}: ${format(d.value)}`).join("; ")}`}>
        <circle cx="50" cy="50" r={R} fill="none" stroke={GRID} strokeWidth="14" />
        {total > 0
          ? data.map((d, i) => {
              const len = (d.value / total) * C;
              const el = (
                <circle
                  key={d.label}
                  cx="50"
                  cy="50"
                  r={R}
                  fill="none"
                  stroke={d.color ?? PALETTE[i % PALETTE.length]}
                  strokeWidth="14"
                  strokeDasharray={`${Math.max(len - 1.2, 0)} ${C}`}
                  strokeDashoffset={-acc}
                >
                  <title>{`${d.label}: ${format(d.value)}`}</title>
                </circle>
              );
              acc += len;
              return el;
            })
          : null}
        {center ? (
          <text
            x="50"
            y="54"
            textAnchor="middle"
            fontSize="15"
            fontWeight="600"
            fill="#14110c"
            transform="rotate(90 50 50)"
          >
            {center}
          </text>
        ) : null}
      </svg>
      <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              <i
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: d.color ?? PALETTE[i % PALETTE.length] }}
              />
              <span className="truncate">{d.label}</span>
            </span>
            <span className="tnum shrink-0 font-semibold">
              {format(d.value)}
              {total ? <span className="ml-1 font-normal text-muted">{Math.round((d.value / total) * 100)}%</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Ranking em barras horizontais. data: [{ label, value, right }] */
export function RankBars({ data }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ol className="space-y-2.5">
      {data.map((d, i) => (
        <li key={d.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <p className="min-w-0 truncate font-medium">
              <span className="tnum mr-1.5 text-muted">{i + 1}.</span>
              {d.label}
            </p>
            <p className="tnum shrink-0 text-xs text-muted">{d.right}</p>
          </div>
          <div className="bar-track mt-1" style={{ height: 8 }} role="presentation">
            <div className="bar-fill" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}
