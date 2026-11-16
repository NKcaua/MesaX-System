"""Relatórios do gerente (RF09) e histórico de pedidos.

Os dias são civis no fuso de São Paulo, com início e fim inclusivos.
Vendas: só contas 'paga' com pagamento confirmado; período pela data do
pagamento. Histórico: período pela data/hora do pedido.
"""

import re
from datetime import date, datetime, timedelta, timezone

from .db import tx
from .services import ApiError, money

try:
    from zoneinfo import ZoneInfo

    TZ = ZoneInfo("America/Sao_Paulo")
except Exception:  # sem tzdata: o Brasil não tem horário de verão desde 2019
    TZ = timezone(timedelta(hours=-3))

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
MAX_DAYS = 366


def _periodo(de, ate):
    if not DATE_RE.match(de or "") or not DATE_RE.match(ate or ""):
        raise ApiError("Informe o período no formato AAAA-MM-DD.")
    try:
        inicio, fim = date.fromisoformat(de), date.fromisoformat(ate)
    except ValueError:
        raise ApiError("Informe o período no formato AAAA-MM-DD.")
    if inicio > fim:
        raise ApiError("A data inicial não pode ser maior que a final.")
    if (fim - inicio).days + 1 > MAX_DAYS:
        raise ApiError("Escolha um período de no máximo 1 ano.")
    return inicio, fim


def _local(iso):
    return datetime.fromisoformat(iso.replace("Z", "+00:00")).astimezone(TZ)


def _dias(inicio, fim):
    d = inicio
    while d <= fim:
        yield d.isoformat()
        d += timedelta(days=1)


def relatorio_vendas(de, ate):
    inicio, fim = _periodo(de, ate)
    with tx() as db:
        pagamentos = db.execute(
            "SELECT p.* FROM pagamento p JOIN conta c ON c.id = p.conta_id"
            " WHERE c.status = 'paga' AND p.status = 'confirmado'"
        ).fetchall()
        noperiodo = [p for p in pagamentos if inicio <= _local(p["data"]).date() <= fim]

        contas = {}
        por_forma = {}
        for p in noperiodo:
            c = contas.setdefault(p["conta_id"], {"valor": 0.0, "data": p["data"]})
            c["valor"] += p["valor"]
            c["data"] = max(c["data"], p["data"])
            f = por_forma.setdefault(p["forma_pagamento"], {"contas": set(), "total": 0.0})
            f["contas"].add(p["conta_id"])
            f["total"] += p["valor"]

        total = sum(c["valor"] for c in contas.values())
        diario = {}
        for c in contas.values():
            dia = _local(c["data"]).date().isoformat()
            d = diario.setdefault(dia, {"total": 0.0, "contas": 0})
            d["total"] += c["valor"]
            d["contas"] += 1

        produtos = {}
        if contas:
            marcas = ",".join("?" * len(contas))
            for r in db.execute(
                "SELECT pr.id, pr.nome, pr.categoria, i.quantidade, i.subtotal"
                " FROM item_pedido i JOIN pedido pe ON pe.id = i.pedido_id"
                " JOIN produto pr ON pr.id = i.produto_id"
                f" WHERE pe.conta_id IN ({marcas})",
                list(contas),
            ):
                p = produtos.setdefault(
                    r["id"],
                    {"id": str(r["id"]), "name": r["nome"], "category": r["categoria"], "quantity": 0, "revenue": 0.0},
                )
                p["quantity"] += r["quantidade"]
                p["revenue"] += r["subtotal"]
        top = sorted(produtos.values(), key=lambda p: (-p["quantity"], -p["revenue"], p["name"]))[:10]

    n = len(contas)
    return {
        "from": de,
        "to": ate,
        "daily": [
            {
                "day": dia,
                "total": money(diario.get(dia, {}).get("total", 0)),
                "accounts": diario.get(dia, {}).get("contas", 0),
            }
            for dia in _dias(inicio, fim)
        ],
        "totalReceived": money(total),
        "paidAccounts": n,
        "averageTicket": money(total / n) if n else 0,
        "byMethod": [
            {"method": m, "accounts": len(v["contas"]), "total": money(v["total"])}
            for m, v in sorted(por_forma.items(), key=lambda kv: -kv[1]["total"])
        ],
        "topProducts": [{**p, "revenue": money(p["revenue"])} for p in top],
    }


def historico_pedidos(de, ate):
    inicio, fim = _periodo(de, ate)
    with tx() as db:
        pedidos = [
            p for p in db.execute(
                "SELECT pe.*, m.numero FROM pedido pe JOIN mesa m ON m.id = pe.mesa_id ORDER BY pe.id"
            )
            if inicio <= _local(p["data_hora"]).date() <= fim
        ]
        itens = {}
        for r in db.execute(
            "SELECT i.pedido_id, i.quantidade, pr.nome FROM item_pedido i"
            " JOIN produto pr ON pr.id = i.produto_id ORDER BY i.id"
        ):
            itens.setdefault(r["pedido_id"], []).append(f"{r['quantidade']}× {r['nome']}")

    por_dia, por_status, por_hora = {}, {}, [0] * 24
    for p in pedidos:
        local = _local(p["data_hora"])
        d = por_dia.setdefault(local.date().isoformat(), {"orders": 0, "total": 0.0})
        d["orders"] += 1
        d["total"] += p["valor_total"]
        por_status[p["status"]] = por_status.get(p["status"], 0) + 1
        por_hora[local.hour] += 1

    total_pedidos = len(pedidos)
    valor = sum(p["valor_total"] for p in pedidos)
    return {
        "from": de,
        "to": ate,
        "totalOrders": total_pedidos,
        "totalValue": money(valor),
        "averageOrder": money(valor / total_pedidos) if total_pedidos else 0,
        "byDay": [
            {
                "day": dia,
                "orders": por_dia.get(dia, {}).get("orders", 0),
                "total": money(por_dia.get(dia, {}).get("total", 0)),
            }
            for dia in _dias(inicio, fim)
        ],
        "byStatus": [{"status": s, "orders": n} for s, n in por_status.items()],
        "byHour": [{"hour": h, "orders": n} for h, n in enumerate(por_hora)],
        "recent": [
            {
                "id": str(p["id"]),
                "tableNumber": p["numero"],
                "createdAt": p["data_hora"],
                "status": p["status"],
                "total": money(p["valor_total"]),
                "items": ", ".join(itens.get(p["id"], [])),
            }
            for p in sorted(pedidos, key=lambda p: -p["id"])[:30]
        ],
    }
