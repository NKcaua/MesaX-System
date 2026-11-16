# Restaurante Caseirão

Sistema em **JavaScript + Node.js + React + PostgreSQL**.

Página inicial: `client/index.html` → `client/src/pages/Index.jsx`. Cardápio vem de `GET /api/produtos`. Mesa, cozinha, garçom, caixa e gerente usam as mesmas rotas.

Interface com **Fraunces** nos títulos, **Poppins** no restante, painéis em vidro fosco e botões em pílula. Status internos (`em_preparo`, `aguardando_pagamento`) aparecem na tela sem underscore: “Em preparo”, “Aguardando pagamento”.

## Como integrar

1. Suba o Postgres e rode `db/schema.sql`.
2. Defina `DATABASE_URL` (veja `.env.example`).
3. A API Node (`server/index.js`) fala com o banco.
4. O React (`client/src/api.js`) chama `/api/...`. Troque `VITE_API_URL` se a API estiver em outro host.
5. Importe o index no seu app:

```js
import Index from "./pages/Index.jsx";
```

Sem `DATABASE_URL`, a API usa PGlite (Postgres embutido) só para demonstração local.

## Rodar

```bash
npm install
npm run dev
```

- Front: http://127.0.0.1:43123
- API: http://127.0.0.1:43124

Site completo (build + API na mesma porta):

```bash
npm run serve
```

Abre http://127.0.0.1:43123 — cardápio, mesa, cozinha, garçom, caixa e gerente. Senha da equipe: `caseirao`.

Senha da equipe: `caseirao`

## Postgres

```bash
# docker
docker compose up -d
export DATABASE_URL=postgres://caseirao:caseirao@localhost:5432/caseirao
npm run dev:api
```

Tabelas: `usuario`, `produto`, `mesa`, `cliente`, `conta`, `pedido`, `item_pedido`, `pagamento` — iguais ao UML do PDF.

## Rotas da API

| Método | Rota | Uso |
| --- | --- | --- |
| GET | `/api/produtos` | Cardápio do index |
| GET | `/api/estado` | Mesas, pedidos, contas |
| POST | `/api/pedidos` | `{ tableNumber, items: [{ productId, quantity }] }` |
| PATCH | `/api/pedidos/:id` | `{ status }` recebido → em_preparo → pronto → entregue |
| POST | `/api/conta` | `{ tableNumber, action: "pedir" \| "pagar", method }` |
| PATCH | `/api/produtos` | `{ id, available }` esgotar item |
| POST | `/api/auth` | `{ login, password }` |

## Pastas

- `client/` React (Vite) — **index** e telas
- `server/` Node/Express
- `db/schema.sql` PostgreSQL
