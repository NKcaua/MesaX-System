# Restaurante Caseirão

Sistema em **JavaScript + Node.js + React + PostgreSQL**.

Página inicial: `client/index.html` → `client/src/pages/Index.jsx`. Cardápio vem de `GET /api/produtos`. Mesa, cozinha, garçom, caixa e gerente usam as mesmas rotas.

Interface com **Fraunces** nos títulos, **Poppins** no restante, painéis em vidro fosco e botões em pílula. Status internos (`em_preparo`, `aguardando_pagamento`) aparecem na tela sem underscore: “Em preparo”, “Aguardando pagamento”.

## API Python (back-end integrado ao front)

A API padrão agora é a **FastAPI** de `../Back-end/api/`, construída sobre as classes OO do projeto (`Produto`, `Mesa`, `ItemPedido`, `Pedido`, `Conta`, `Pagamento`). Ela expõe as mesmas rotas e o mesmo JSON abaixo, então o React não mudou. Banco: SQLite em `Back-end/data/caseirao.db` (criado e populado sozinho); fotos enviadas ficam em `Back-end/data/uploads/`.

```bash
pip install -r ../Back-end/requirements.txt   # uma vez
npm install                                    # uma vez
npm run dev                                    # API Python :43124 + Vite :43123
npm run serve                                  # build + site e API juntos em :43123
```

O terminal interativo (`python main.py` em `Back-end/`) continua funcionando. A API Node antiga segue disponível com `npm run dev:api:node` (usa PGlite/Postgres).

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
| POST | `/api/auth` | `{ login, password }` → devolve `{ login, name, role, token }` |
| GET | `/api/relatorios/vendas?de=AAAA-MM-DD&ate=AAAA-MM-DD` | **RF09** — relatório de vendas (só gerente, header `Authorization: Bearer <token>`) |
| DELETE | `/api/estado` | Zera a demonstração (só gerente) |

### Relatório de vendas (RF09)

Aba **Vendas** na tela do gerente: valor recebido, contas pagas, ticket médio, produtos mais vendidos e formas de pagamento no período. Só entram contas com status `paga` e pagamento confirmado; o período é definido pela data do pagamento (`pagamento.data`, dia civil em America/Sao_Paulo, início e fim inclusivos). A quantidade vendida soma `item_pedido.quantidade` e a receita usa `preco_unitario`/`subtotal` gravados no pedido. Sem tabela nova.

## Pastas

- `client/` React (Vite) — **index** e telas
- `server/` Node/Express
- `db/schema.sql` PostgreSQL
