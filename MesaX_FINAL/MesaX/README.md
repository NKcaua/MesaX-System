# MesaX System

Sistema de controle de restaurante (Restaurante Caseirão): cardápio, mesas, pedidos, cozinha, contas, pagamentos, login da equipe e relatórios do gerente.

- **Front-end (React + Vite):** pasta `Front-end/client` — feito pelo Cauã.
- **Back-end (Python + FastAPI):** pasta `Back-end/api` — usa as classes `Produto`, `Mesa`, `ItemPedido`, `Pedido`, `Conta` e `Pagamento`.
- **Banco de dados:** SQLite, arquivo `Back-end/data/caseirao.db`. É criado e populado sozinho se não existir (15 produtos, 8 mesas, 4 usuários).

## Como executar

### Opção 1 — GitHub Codespaces (sem instalar nada)
1. No repositório, clique em **Code → Codespaces → Create codespace on main**.
2. Espere a primeira montagem (instala Python e Node sozinho). O site abre na porta **43123**.
3. Se não abrir, vá na aba **Ports** e clique no globo da porta 43123.

### Opção 2 — No computador (precisa de Python 3.10+ e Node 20+)
```bash
pip install -r Back-end/requirements.txt
cd Front-end
npm install
npm run dev
```
Abra http://127.0.0.1:43123 (site). A API fica em http://127.0.0.1:43124.

## Usuários da equipe (senha de todos: `caseirao`)
`cozinha`, `garcom`, `caixa`, `gerente` — escolha a função na tela `/equipe`.
Pedido do cliente: `/mesa/3` (ou outra mesa de 1 a 8).

## Testes do back-end
```bash
pip install -r Back-end/requirements.txt httpx
python Back-end/testes/teste_api.py Back-end
```
O teste usa um banco temporário e não altera `caseirao.db`.

Veja `RELATORIO.md` para o que foi testado e o que ainda não foi validado.

---

# Texto original do README

# 🍽️ Sistema para Restaurante - Restaurante Caseirão

O Restaurante Caseirão é um espaço tradicional e de pequeno porte, focado em servir refeições rápidas e pratos executivos para o dia a dia. Para modernizar e facilitar a rotina desse ambiente, criamos este sistema que organiza todo o fluxo de atendimento. A proposta principal é dar autonomia ao cliente, que pode realizar seu próprio pedido através de um celular, tablet ou QR Code disponível na mesa, enviando as informações de forma direta e sem intermediários para a cozinha. Além disso, a plataforma ajuda os funcionários a gerenciar mesas, atualizar o cardápio e fechar contas com agilidade.

## 🚀 Funcionalidades Principais

* **Pedidos via QR Code:** O cliente tem acesso direto ao cardápio e realiza pedidos de forma independente.
* **Comunicação Integrada:** Os pedidos confirmados pelos clientes são enviados instantaneamente para uma tela na cozinha, evitando erros de anotação.
* **Acompanhamento de Status:** É possível monitorar cada etapa do pedido, desde "recebido", passando por "em preparo" e "pronto", até ser "entregue".
* **Controle de Mesas Inteligente:** O sistema gerencia o estado de cada mesa do salão, identificando facilmente se ela está livre, ocupada ou liberada.
* **Gestão de Disponibilidade:** Controle atualizado dos produtos para evitar que itens esgotados sejam solicitados.
* **Fechamento Automático e Pagamentos:** O sistema calcula sozinho o valor total consumido pela mesa e permite o registro de pagamentos via Dinheiro, Pix, Débito ou Crédito.
* **Perfis de Usuário Específicos:** Telas e acessos personalizados para Cliente, Garçom, Cozinha, Caixa e Gerente, garantindo que cada um tenha as ferramentas necessárias para seu trabalho.

## 🛠️ Tecnologias Utilizadas

* **Linguagem:** Python
* **Banco de Dados:** PostgreSQL
* **Front-End:** React
* **Back-End:** Node.js

## 👥 Equipe de Desenvolvimento

* Caua de Jesus Bolani
* Eduardo de Souza Tabareli
* Nicolas Emanuel Gonçalves Fermino
