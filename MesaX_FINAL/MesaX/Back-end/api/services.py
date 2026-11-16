"""Casos de uso do restaurante. As regras ficam nas classes do domínio
(Produto, Mesa, ItemPedido, Pedido, Conta, Pagamento); aqui elas são
carregadas do banco, executadas e gravadas de volta.
"""

import base64
import re
import secrets
import time

from Conta.conta import Conta
from ItemPedido.item_pedido import ItemPedido
from Mesa.mesa import Mesa
from Pagamento.pagamento import Pagamento
from Pedido.pedido import Pedido
from Produto.produto import Produto

from . import db as store
from .db import now_iso, tx


class ApiError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.message = message
        self.status = status


def money(value):
    return round(float(value) + 0.0, 2)


# ---------- carregamento: linha do banco -> objeto de domínio ----------

def produto_de(row):
    return Produto(
        row["id"], row["nome"], row["descricao"], row["preco"],
        bool(row["disponibilidade"]), row["categoria"], row["imagem"],
    )


def mesa_de(row):
    mesa = Mesa(row["id"], row["numero"], row["capacidade"])
    mesa.situacao = row["situacao"]
    return mesa


def conta_de(db, row):
    """Reconstrói a Conta com seus pedidos (valorTotal vem dos pedidos)."""
    conta = Conta(row["id"])
    conta.status = row["status"]
    for p in db.execute("SELECT * FROM pedido WHERE conta_id = ? ORDER BY id", (row["id"],)):
        pedido = Pedido(p["id"])
        pedido.status = p["status"]
        pedido.valorTotal = p["valor_total"]
        conta.pedidos.append(pedido)
    conta.calcularTotal()
    return conta


# ---------- saídas (mesmo formato JSON que o front já consome) ----------

def out_produto(p):
    return {
        "id": str(p.idProduto),
        "name": p.nome,
        "description": p.descricao,
        "price": money(p.preco),
        "available": bool(p.disponibilidade),
        "category": p.categoria,
        "image": p.imagem,
    }


def out_pedido(db, row):
    mesa = db.execute("SELECT numero FROM mesa WHERE id = ?", (row["mesa_id"],)).fetchone()
    itens = db.execute(
        "SELECT i.*, pr.nome FROM item_pedido i JOIN produto pr ON pr.id = i.produto_id"
        " WHERE i.pedido_id = ? ORDER BY i.id",
        (row["id"],),
    ).fetchall()
    return {
        "id": str(row["id"]),
        "tableId": str(row["mesa_id"]),
        "tableNumber": mesa["numero"],
        "createdAt": row["data_hora"],
        "status": row["status"],
        "total": money(row["valor_total"]),
        "items": [
            {
                "id": str(i["id"]),
                "productId": str(i["produto_id"]),
                "name": i["nome"],
                "quantity": i["quantidade"],
                "unitPrice": money(i["preco_unitario"]),
                "subtotal": money(i["subtotal"]),
            }
            for i in itens
        ],
    }


def listar_produtos(db):
    return [out_produto(produto_de(r)) for r in db.execute("SELECT * FROM produto ORDER BY id")]


def snapshot(db):
    tables = [
        {"id": str(r["id"]), "number": r["numero"], "capacity": r["capacidade"], "status": r["situacao"]}
        for r in db.execute("SELECT * FROM mesa ORDER BY numero")
    ]
    pedidos = db.execute("SELECT * FROM pedido ORDER BY id").fetchall()
    accounts = []
    for r in db.execute(
        "SELECT c.*, m.numero FROM conta c JOIN mesa m ON m.id = c.mesa_id ORDER BY c.id"
    ):
        accounts.append({
            "id": str(r["id"]),
            "tableId": str(r["mesa_id"]),
            "tableNumber": r["numero"],
            "status": r["status"],
            "openedAt": r["data_abertura"],
            "closedAt": r["data_fechamento"],
            "total": money(r["valor_total"]),
            "orderIds": [str(p["id"]) for p in pedidos if p["conta_id"] == r["id"]],
        })
    payments = [
        {
            "id": str(r["id"]),
            "accountId": str(r["conta_id"]),
            "amount": money(r["valor"]),
            "method": r["forma_pagamento"],
            "createdAt": r["data"],
            "status": r["status"],
        }
        for r in db.execute("SELECT * FROM pagamento ORDER BY id")
    ]
    return {
        "products": listar_produtos(db),
        "tables": tables,
        "orders": [out_pedido(db, p) for p in pedidos],
        "accounts": accounts,
        "payments": payments,
    }


# ---------- casos de uso ----------

def _mesa(db, numero):
    row = db.execute("SELECT * FROM mesa WHERE numero = ?", (numero,)).fetchone()
    if not row:
        raise ApiError("Mesa não encontrada")
    return row


def criar_pedido(table_number, items):
    with tx() as db:
        mesa_row = _mesa(db, table_number)
        mesa = mesa_de(mesa_row)

        if db.execute(
            "SELECT 1 FROM conta WHERE mesa_id = ? AND status = 'aguardando_pagamento'",
            (mesa.idMesa,),
        ).fetchone():
            raise ApiError("A conta desta mesa já foi pedida. Aguarde o caixa.")
        if not items or not isinstance(items, list):
            raise ApiError("Escolha pelo menos um item")

        pedido = Pedido(None)
        for linha in items:
            if not isinstance(linha, dict):
                raise ApiError("Item inválido")
            row = db.execute("SELECT * FROM produto WHERE id = ?", (linha.get("productId"),)).fetchone()
            if not row:
                raise ApiError("Produto não encontrado")
            produto = produto_de(row)
            if not produto.disponibilidade:
                raise ApiError(f"{produto.nome} acabou. Escolha outro.")
            try:
                quantidade = max(1, int(float(linha.get("quantity", 1))))
            except (TypeError, ValueError):
                raise ApiError("Quantidade inválida")
            if quantidade > 99:
                raise ApiError("Quantidade máxima por item: 99")
            pedido.adicionarItem(ItemPedido(None, produto, quantidade))
        pedido.calcularTotal()

        conta_row = db.execute(
            "SELECT * FROM conta WHERE mesa_id = ? AND status = 'aberta' ORDER BY id DESC LIMIT 1",
            (mesa.idMesa,),
        ).fetchone()
        if conta_row:
            conta_id = conta_row["id"]
        else:
            conta_id = db.execute(
                "INSERT INTO conta (mesa_id, status, valor_total, data_abertura) VALUES (?, 'aberta', 0, ?)",
                (mesa.idMesa, now_iso()),
            ).lastrowid

        mesa.ocupar()
        db.execute("UPDATE mesa SET situacao = ? WHERE id = ?", (mesa.situacao, mesa.idMesa))

        pedido_id = db.execute(
            "INSERT INTO pedido (mesa_id, conta_id, data_hora, status, valor_total) VALUES (?, ?, ?, ?, ?)",
            (mesa.idMesa, conta_id, now_iso(), pedido.status, money(pedido.valorTotal)),
        ).lastrowid
        for item in pedido.itens:
            db.execute(
                "INSERT INTO item_pedido (pedido_id, produto_id, quantidade, preco_unitario, subtotal)"
                " VALUES (?, ?, ?, ?, ?)",
                (pedido_id, item.produto.idProduto, item.quantidade,
                 money(item.precoUnitario), money(item.subtotal)),
            )

        conta = conta_de(db, db.execute("SELECT * FROM conta WHERE id = ?", (conta_id,)).fetchone())
        db.execute("UPDATE conta SET valor_total = ? WHERE id = ?", (money(conta.valorTotal), conta_id))
        return out_pedido(db, db.execute("SELECT * FROM pedido WHERE id = ?", (pedido_id,)).fetchone())


def atualizar_pedido(pedido_id, status):
    with tx() as db:
        row = db.execute("SELECT * FROM pedido WHERE id = ?", (pedido_id,)).fetchone()
        if not row:
            raise ApiError("Pedido não encontrado")
        pedido = Pedido(row["id"])
        try:
            pedido.atualizarStatus(status)
        except ValueError as e:
            raise ApiError(str(e))
        db.execute("UPDATE pedido SET status = ? WHERE id = ?", (pedido.status, row["id"]))
        return out_pedido(db, db.execute("SELECT * FROM pedido WHERE id = ?", (row["id"],)).fetchone())


def _conta_da_mesa(db, mesa_row, mensagem):
    row = db.execute(
        "SELECT * FROM conta WHERE mesa_id = ? AND status <> 'paga' ORDER BY id DESC LIMIT 1",
        (mesa_row["id"],),
    ).fetchone()
    if not row:
        raise ApiError(mensagem)
    return row


def pedir_conta(table_number):
    with tx() as db:
        mesa_row = _mesa(db, table_number)
        row = _conta_da_mesa(db, mesa_row, "Essa mesa ainda não tem pedido.")
        conta = conta_de(db, row)
        conta.solicitarFechamento()
        db.execute(
            "UPDATE conta SET status = ?, valor_total = ? WHERE id = ?",
            (conta.status, money(conta.valorTotal), row["id"]),
        )
        return {
            "id": str(row["id"]),
            "tableId": str(row["mesa_id"]),
            "tableNumber": mesa_row["numero"],
            "status": conta.status,
            "total": money(conta.valorTotal),
        }


def pagar_conta(table_number, metodo):
    with tx() as db:
        mesa_row = _mesa(db, table_number)
        mesa = mesa_de(mesa_row)
        row = _conta_da_mesa(db, mesa_row, "Não há conta aberta nesta mesa.")
        conta = conta_de(db, row)

        pagamento = Pagamento(None, money(conta.calcularTotal()), str(metodo or "").lower())
        if not pagamento.registrarPagamento():
            raise ApiError("Forma de pagamento inválida.")
        pagamento.confirmarPagamento()

        conta.pagar()
        mesa.liberar()

        agora = now_iso()
        pagamento_id = db.execute(
            "INSERT INTO pagamento (conta_id, valor, data, forma_pagamento, status) VALUES (?, ?, ?, ?, ?)",
            (row["id"], money(pagamento.valor), agora, pagamento.formaPagamento, pagamento.status),
        ).lastrowid
        db.execute(
            "UPDATE conta SET status = ?, valor_total = ?, data_fechamento = ? WHERE id = ?",
            (conta.status, money(conta.valorTotal), agora, row["id"]),
        )
        db.execute("UPDATE mesa SET situacao = ? WHERE id = ?", (mesa.situacao, mesa.idMesa))
        return {
            "account": {
                "id": str(row["id"]),
                "tableNumber": mesa_row["numero"],
                "status": conta.status,
                "total": money(conta.valorTotal),
            },
            "payment": {
                "id": str(pagamento_id),
                "method": pagamento.formaPagamento,
                "amount": money(pagamento.valor),
            },
        }


def _produto(db, produto_id):
    try:
        row = db.execute("SELECT * FROM produto WHERE id = ?", (int(produto_id),)).fetchone()
    except (TypeError, ValueError):
        row = None
    if not row:
        raise ApiError("Produto não encontrado")
    return produto_de(row)


def definir_disponibilidade(produto_id, disponivel):
    with tx() as db:
        produto = _produto(db, produto_id)
        produto.alterarDisponibilidade(disponivel)
        db.execute(
            "UPDATE produto SET disponibilidade = ? WHERE id = ?",
            (1 if produto.disponibilidade else 0, produto.idProduto),
        )
        return out_produto(produto)


def editar_produto(produto_id, dados):
    with tx() as db:
        produto = _produto(db, produto_id)
        try:
            produto.atualizar(dados.get("name"), dados.get("description"), dados.get("price"))
        except ValueError as e:
            raise ApiError(str(e))
        db.execute(
            "UPDATE produto SET nome = ?, descricao = ?, preco = ? WHERE id = ?",
            (produto.nome, produto.descricao, produto.preco, produto.idProduto),
        )
        return out_produto(produto)


_IMAGEM = re.compile(r"^data:(image/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$")
_EXT = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}


def salvar_imagem(produto_id, data_url):
    m = _IMAGEM.match(str(data_url or ""))
    if not m:
        raise ApiError("Envie uma imagem JPG, PNG ou WebP.")
    try:
        conteudo = base64.b64decode(m.group(2), validate=True)
    except ValueError:
        raise ApiError("Imagem inválida.")
    if len(conteudo) > 4 * 1024 * 1024:
        raise ApiError("Imagem maior que 4 MB.")
    with tx() as db:
        produto = _produto(db, produto_id)
        nome = f"produto-{produto.idProduto}-{int(time.time() * 1000)}.{_EXT[m.group(1)]}"
        (store.UPLOADS / nome).write_bytes(conteudo)
        produto.imagem = f"/uploads/{nome}"
        db.execute("UPDATE produto SET imagem = ? WHERE id = ?", (produto.imagem, produto.idProduto))
        return out_produto(produto)


def zerar_demonstracao():
    with tx() as db:
        for tabela in ("pagamento", "item_pedido", "pedido", "conta"):
            db.execute(f"DELETE FROM {tabela}")
        db.execute("UPDATE mesa SET situacao = 'livre'")
        db.execute("UPDATE produto SET disponibilidade = 1")
        return snapshot(db)


# ---------- autenticação ----------

SESSION_TTL = 8 * 60 * 60
_sessoes = {}


def login(login_, senha):
    with tx() as db:
        row = db.execute("SELECT * FROM usuario WHERE login = ?", (login_,)).fetchone()
    if not row or not store.check_password(str(senha or ""), row["senha_hash"]):
        raise ApiError("Login ou senha inválidos", 401)
    token = secrets.token_hex(24)
    usuario = {"login": row["login"], "name": row["nome"], "role": row["tipo_usuario"]}
    _sessoes[token] = {**usuario, "expires": time.time() + SESSION_TTL}
    return {**usuario, "token": token}


def exigir_perfil(authorization, *perfis):
    token = re.sub(r"^Bearer\s+", "", authorization or "", flags=re.I)
    sessao = _sessoes.get(token)
    if not sessao or sessao["expires"] < time.time():
        _sessoes.pop(token, None)
        raise ApiError("Sessão expirada. Entre novamente.", 401)
    if sessao["role"] not in perfis:
        raise ApiError("Acesso restrito ao gerente.", 403)
    return sessao
