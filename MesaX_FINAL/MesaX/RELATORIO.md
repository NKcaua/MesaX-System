# Relatório — back-end e integração do MesaX

## Resumo honesto
- **Back-end (API Python + SQLite): testado e funcionando.**
- **Front-end: NÃO foi executado.** O ambiente onde o trabalho foi feito não tinha Node.js e não foi autorizado baixar. Nenhuma tela foi aberta ou compilada. Não há validação visual.
- **Integração front ↔ API:** verificada **só lendo o código** e simulando as mesmas chamadas por HTTP. Não foi testada com o navegador.
- A configuração do GitHub Codespaces (`.devcontainer/`) foi escrita, mas **não foi executada**.

## O que existia
A API em `Back-end/api/` (FastAPI) e o banco SQLite já estavam escritos pela equipe. Foi aproveitado tudo, sem trocar tecnologias.

## O que foi corrigido
1. `Back-end/api/services.py`, função `criar_pedido`: um pedido com a lista de itens malformada (ex.: `items: ["x"]`) causava **erro 500**. Agora responde **400** ("Item inválido" / "Escolha pelo menos um item").

Nada mais foi alterado no código do Cauã. Adicionados: `.devcontainer/`, `iniciar.sh`, `.gitignore`, `.gitattributes`, `Back-end/testes/`, este relatório e o topo do `README.md`.

## Testes executados (resultado real)
Ambiente: Python 3.13, FastAPI 0.163, em ambiente virtual isolado.

**A) `testes/teste_api.py` — 54 verificações, 54 OK, 0 falhas** (banco temporário):
| Área | Verificado |
|---|---|
| Inicialização | API sobe, banco criado e populado (15 produtos, 8 mesas) |
| Produtos | listar; esgotar/liberar; editar nome/descrição/preço (gerente); preço 0 recusado; upload de foto; foto inválida recusada |
| Mesas | ocupa ao pedir; libera ao pagar |
| Pedidos | criar; vários pedidos na mesma conta; total correto; mesa/produto inexistente, sem itens, quantidade inválida, produto esgotado → 400 |
| Cozinha | status recebido → em preparo → pronto → entregue; status inválido → 400 |
| Contas | pedir conta; bloqueia novo pedido depois; nova conta após pagar |
| Pagamentos | pix/dinheiro/crédito; forma inválida → 400; pagar duas vezes → 400 |
| Login | 4 perfis entram; senha errada → 401; sem token → 401; caixa em rota do gerente → 403 |
| Relatórios | vendas e histórico corretos; período inválido/invertido/maior que 1 ano → 400 |
| Gerente | zerar demonstração só com token |

**B) `testes/teste_http.py` — 13 verificações, 13 OK** (servidor uvicorn real, requisições HTTP iguais às do `api.js`, servidor reiniciado no meio):
saúde; CORS libera a origem do front (`127.0.0.1:43123`) e não libera origem estranha; login; pedido; cozinha; estado; pedir conta; **dados continuam no banco depois de reiniciar a API**; pagamento; relatórios.

**C) Conferência por leitura do código (não é execução):** todas as funções de `Front-end/client/src/api.js` têm rota correspondente na API, e os campos lidos pelas telas (Mesa, Cozinha, Garçom, Caixa, Gerente) existem nas respostas.

## NÃO testado / pendente
- Compilar e abrir o front (`npm install`, `npm run dev`) — **não executado**.
- Telas, botões, formulários, upload de foto e gráficos no navegador — **sem validação visual**.
- Rotas do React (`/mesa/3`, `/equipe`, `/gerente`…) e o proxy do Vite para `/api` — não testados.
- Codespaces: `.devcontainer/` não foi executado; pode precisar de ajuste.
- O vídeo de demonstração não foi assistido.
- O front **não tem tela de cadastro de produto novo**: só lista, edita (nome, descrição, preço, foto) e esgota/libera os 15 existentes. Nada foi inventado.

## Inconsistências conhecidas
- O README antigo e `Front-end/README.md` citam Node.js/PostgreSQL; o back-end real é Python + SQLite. A pasta `Front-end/server` (API Node antiga) e `Front-end/db/schema.sql` (Postgres) continuam no projeto, sem uso. O script `dev:api:node` ainda existe.
