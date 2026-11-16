"""Teste com servidor uvicorn REAL, via HTTP, com as mesmas chamadas do front (api.js)."""
import json, sys, urllib.request, urllib.error
BASE = "http://127.0.0.1:43124"
ok = fail = 0

def req(metodo, caminho, corpo=None, token=None, origem=None):
    h = {"Content-Type": "application/json"}
    if token: h["Authorization"] = f"Bearer {token}"
    if origem: h["Origin"] = origem
    r = urllib.request.Request(BASE + caminho, method=metodo, headers=h,
                               data=json.dumps(corpo).encode() if corpo is not None else None)
    try:
        with urllib.request.urlopen(r) as resp:
            return resp.status, json.loads(resp.read() or b"{}"), resp.headers
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"{}"), e.headers

def check(nome, cond, extra=""):
    global ok, fail
    if cond: ok += 1; print("OK   ", nome)
    else: fail += 1; print("FALHA", nome, extra)

fase = sys.argv[1]
if fase == "1":
    s, d, h = req("GET", "/api/saude"); check("saude", s == 200)
    s, d, h = req("GET", "/api/estado", origem="http://127.0.0.1:43123")
    check("CORS origem do front liberada", h.get("access-control-allow-origin") == "http://127.0.0.1:43123", dict(h))
    s, d, h = req("GET", "/api/estado", origem="http://site-estranho.com")
    check("CORS origem estranha NAO liberada", h.get("access-control-allow-origin") is None)
    s, tok, _ = req("POST", "/api/auth", {"login": "cozinha", "password": "caseirao"}); check("login cozinha", s == 200 and "token" in tok)
    s, d, _ = req("POST", "/api/pedidos", {"tableNumber": 7, "items": [{"productId": "5", "quantity": 1}, {"productId": "13", "quantity": 2}]})
    check("pedido mesa 7", s == 200 and d["total"] == 52.9, d)
    s, d2, _ = req("PATCH", f"/api/pedidos/{d['id']}", {"status": "em_preparo"}); check("cozinha em_preparo", s == 200)
    s, e, _ = req("GET", "/api/estado")
    check("estado reflete pedido/mesa/conta", len(e["orders"]) == 1 and [t for t in e["tables"] if t["number"] == 7][0]["status"] == "ocupada" and e["accounts"][0]["tableId"] == [t for t in e["tables"] if t["number"] == 7][0]["id"])
    s, d3, _ = req("POST", "/api/conta", {"tableNumber": 7, "action": "pedir"}); check("pedir conta", s == 200)
    # deixa conta aguardando pagamento para a fase 2 (persistencia)
if fase == "2":
    s, e, _ = req("GET", "/api/estado")
    check("apos reiniciar: pedido persistiu", len(e["orders"]) == 1 and e["orders"][0]["status"] == "em_preparo")
    check("apos reiniciar: conta aguardando_pagamento", e["accounts"][0]["status"] == "aguardando_pagamento")
    s, d, _ = req("POST", "/api/conta", {"tableNumber": 7, "action": "pagar", "method": "credito"}); check("pagar credito", s == 200 and d["payment"]["amount"] == 52.9, d)
    s, g, _ = req("POST", "/api/auth", {"login": "gerente", "password": "caseirao"})
    s, rel, _ = req("GET", "/api/relatorios/vendas?de=2026-01-01&ate=2026-12-31", token=g["token"])
    check("relatorio vendas com a venda", s == 200 and rel["paidAccounts"] == 1 and rel["totalReceived"] == 52.9, rel)
    s, rel, _ = req("GET", "/api/relatorios/historico?de=2026-01-01&ate=2026-12-31", token=g["token"])
    check("relatorio historico", s == 200 and rel["totalOrders"] == 1)
print(f"{ok} ok, {fail} falhas")
