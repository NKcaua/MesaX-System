# Conformidade: LGPD, acessibilidade e transparência

Checklist de 17 itens aplicado ao sistema. **Feito** = implementado e verificado; **Pendente (dono)** = depende de dado ou decisão do restaurante. Este documento não substitui revisão jurídica.

| # | Item | Situação | Onde / o que falta |
|---|------|----------|--------------------|
| 1 | Política de privacidade | Feito | `/privacidade` (`pages/Legal.jsx`). Revisar com advogado. |
| 2 | Termos de serviço | Feito | `/termos` |
| 3 | Aviso de cookies | Feito | `CookieNotice` em `components.jsx`. O site não usa cookies de publicidade/análise; guarda só sessão da equipe e a escolha do aviso. |
| 4 | Política de reembolso | Feito (proposta) | `/reembolso`. As regras de cancelamento (só antes do preparo) e de devolução são **propostas**: o restaurante precisa confirmar. |
| 5 | Formulários na LGPD | Feito | Aviso com link à política no login da equipe e no pedido da mesa (`FormNotice`). |
| 6 | Só dados necessários | Feito | O cliente não informa dado pessoal (só mesa e itens). Equipe: nome, login, hash da senha. Sem dados de cartão. |
| 7 | Scripts de tracking | Feito | Nenhum. As fontes do Google foram trocadas por fontes locais (`@fontsource`), então não há requisição a terceiros (conferido no navegador). |
| 8 | Acessibilidade | Feito | Link "Ir para o conteúdo", landmarks (`main`, `nav` rotulados), título por página, carrossel com pausa, abas com setas, modal com foco preso, tabelas com legenda, gráficos com texto alternativo. Auditado com axe-core (WCAG 2.2 AA): 0 violações nas telas testadas. |
| 9 | Alt nas imagens | Feito | Fotos de conteúdo têm `alt` descritivo; decorativas usam `alt=""`. |
| 10 | Contraste corrigido | Feito | Caixa sobre foto mais opaca (≥ 7:1), borda dos campos e interruptor ≥ 3:1, paleta dos gráficos ≥ 3:1 sobre o fundo. |
| 11 | Navegação por teclado | Feito | Foco visível em tudo, Escape fecha menu e modal, Tab não escapa do modal e o foco volta ao botão de origem. |
| 12 | Sem avaliações falsas | Feito | Removido o texto "Google · 4,8" (não havia fonte). |
| 13 | Sem promessas falsas | Feito | Removido "sem fila de garçom". **Conferir:** "QR da mesa" na página inicial (o QR depende de o restaurante imprimir/colar os códigos). |
| 14 | Copyright das imagens | **Pendente (dono)** | Ver "Imagens" abaixo. O envio de fotos pelo gerente avisa para usar só fotos próprias ou licenciadas. |
| 15 | Dados da empresa | **Pendente (dono)** | Preencher `company` em `client/src/site.js` (razão social, CNPJ, e-mail). Campos vazios não aparecem, nada foi inventado. Conferir também telefone, endereço e horários, que parecem de exemplo. |
| 16 | Conformidade LGPD | Parcial | Política, bases legais, direitos do titular, retenção e segurança descritos. Falta: e-mail do canal do titular (item 15), nomear encarregado (DPO) se aplicável e definir prazos de retenção reais. |
| 17 | Riscos jurídicos | Ver abaixo | |

## Imagens (item 14)

Origem e licença **não são conhecidas**. Antes de publicar, confirme a fonte de cada uma em `client/public/images/`.

- Em uso: `prato-*.jpg`, `bebida-*.jpg`, `cafe-tables.png`, `latte-art.png`.
- **Sem uso no código** (parecem de modelo de cafeteria): `cafe-interior.png`, `cappuccino.png`, `croissant.png`, `hero-black.jpg`, `hero-flatlay.jpg`, `hero-pourover.jpg`, `hot-chocolate.png`, `logo.png`. Continuam acessíveis por URL; remova se não forem suas.

## Riscos jurídicos conhecidos (item 17)

1. Dados da empresa, e-mail do titular e regras de reembolso ainda são do dono (itens 4, 15, 16).
2. As rotas operacionais da API (`/api/estado`, `/api/pedidos`, `/api/conta`, `PATCH /api/produtos`) **não exigem login**. Elas não expõem dado pessoal (só mesa, itens e valores), mas qualquer um pode alterar pedidos. Recomendado proteger por perfil antes de operar de verdade.
3. Senha padrão de demonstração (`caseirao`): trocar antes de publicar. Ela só é exibida/preenchida em desenvolvimento.
4. Sessões ficam em memória (reiniciar a API exige novo login) e a API roda sem HTTPS por padrão: em produção, use HTTPS.
5. Vulnerabilidades de dependências npm reportadas por `npm audit` ainda não foram tratadas.
