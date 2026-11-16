"""Teste da API usando um banco temporario (nao mexe no caseirao.db real)."""
import sys, tempfile, pathlib
BACK = sys.argv[1]
sys.path.insert(0, BACK)
from api import db as store
tmp = pathlib.Path(tempfile.mkdtemp())
store.DATA_DIR = tmp; store.UPLOADS = tmp / "uploads"; store.DB_PATH = tmp / "t.db"
from fastapi.testclient import TestClient
from api.app import app

ok = fail = 0
def check(nome, cond, extra=""):
    global ok, fail
    if cond: ok += 1; print("OK   ", nome)
    else: fail += 1; print("FALHA", nome, extra)

with TestClient(app, raise_server_exceptions=False) as c:
    r = c.get("/api/saude"); check("saude", r.status_code == 200 and r.json()["ok"])
    prods = c.get("/api/produtos").json(); check("15 produtos", len(prods) == 15, len(prods))
    est = c.get("/api/estado").json()
    check("estado: 8 mesas, chaves", len(est["tables"]) == 8 and set(est) == {"products","tables","orders","accounts","payments"})

    # login
    for u in ["cozinha","garcom","caixa","gerente"]:
        r = c.post("/api/auth", json={"login": u, "password": "caseirao"})
        check(f"login {u}", r.status_code == 200 and r.json()["role"] == u)
    r = c.post("/api/auth", json={"login": "gerente", "password": "errada"}); check("login senha errada=401", r.status_code == 401)
    r = c.post("/api/auth", json={}); check("login vazio=401", r.status_code == 401, r.status_code)
    tok = c.post("/api/auth", json={"login": "gerente", "password": "caseirao"}).json()["token"]
    H = {"Authorization": f"Bearer {tok}"}
    tokc = c.post("/api/auth", json={"login": "caixa", "password": "caseirao"}).json()["token"]
    HC = {"Authorization": f"Bearer {tokc}"}

    # pedido
    r = c.post("/api/pedidos", json={"tableNumber": 3, "items": [{"productId": "1", "quantity": 2}, {"productId": 9, "quantity": 1}]})
    check("criar pedido", r.status_code == 200 and r.json()["total"] == 71.8, r.text)
    pid = r.json()["id"]
    est = c.get("/api/estado").json()
    check("mesa 3 ocupada", [t for t in est["tables"] if t["number"] == 3][0]["status"] == "ocupada")
    r = c.post("/api/pedidos", json={"tableNumber": 3, "items": [{"productId": 2, "quantity": 1}]})
    check("2o pedido mesma conta", r.status_code == 200)
    est = c.get("/api/estado").json()
    check("1 conta aberta com 2 pedidos e total 101.7", len(est["accounts"]) == 1 and len(est["accounts"][0]["orderIds"]) == 2 and est["accounts"][0]["total"] == 101.7, est["accounts"])

    # erros pedido
    check("mesa inexistente=400", c.post("/api/pedidos", json={"tableNumber": 99, "items": [{"productId": 1, "quantity": 1}]}).status_code == 400)
    check("sem itens=400", c.post("/api/pedidos", json={"tableNumber": 4, "items": []}).status_code == 400)
    check("produto inexistente=400", c.post("/api/pedidos", json={"tableNumber": 4, "items": [{"productId": 999, "quantity": 1}]}).status_code == 400)
    check("qtd 100=400", c.post("/api/pedidos", json={"tableNumber": 4, "items": [{"productId": 1, "quantity": 100}]}).status_code == 400)
    check("qtd texto=400", c.post("/api/pedidos", json={"tableNumber": 4, "items": [{"productId": 1, "quantity": "abc"}]}).status_code == 400)
    check("body sem items=400", c.post("/api/pedidos", json={"tableNumber": 4}).status_code == 400)
    check("item nao-objeto", c.post("/api/pedidos", json={"tableNumber": "4", "items": ["x"]}).status_code == 400, "")
    check("mesa 4 continua livre apos erros", [t for t in c.get("/api/estado").json()["tables"] if t["number"] == 4][0]["status"] == "livre")

    # status cozinha
    for st in ["em_preparo", "pronto", "entregue"]:
        r = c.patch(f"/api/pedidos/{pid}", json={"status": st}); check(f"status {st}", r.status_code == 200 and r.json()["status"] == st, r.text)
    check("status invalido=400", c.patch(f"/api/pedidos/{pid}", json={"status": "xx"}).status_code == 400)
    check("pedido inexistente=400", c.patch("/api/pedidos/999", json={"status": "pronto"}).status_code == 400)

    # esgotar produto
    r = c.patch("/api/produtos", json={"id": "3", "available": False}); check("esgotar produto", r.status_code == 200 and r.json()["available"] is False, r.text)
    r = c.post("/api/pedidos", json={"tableNumber": 5, "items": [{"productId": 3, "quantity": 1}]}); check("pedir produto esgotado=400", r.status_code == 400)
    c.patch("/api/produtos", json={"id": "3", "available": True})

    # conta
    check("pedir conta mesa sem pedido=400", c.post("/api/conta", json={"tableNumber": 6, "action": "pedir"}).status_code == 400)
    r = c.post("/api/conta", json={"tableNumber": 3, "action": "pedir"}); check("pedir conta", r.status_code == 200 and r.json()["status"] == "aguardando_pagamento", r.text)
    r = c.post("/api/pedidos", json={"tableNumber": 3, "items": [{"productId": 1, "quantity": 1}]}); check("pedido apos pedir conta=400", r.status_code == 400)
    check("pagar forma invalida=400", c.post("/api/conta", json={"tableNumber": 3, "action": "pagar", "method": "cheque"}).status_code == 400)
    r = c.post("/api/conta", json={"tableNumber": 3, "action": "pagar", "method": "pix"}); check("pagar pix", r.status_code == 200 and r.json()["account"]["status"] == "paga" and r.json()["payment"]["amount"] == 101.7, r.text)
    est = c.get("/api/estado").json()
    check("mesa 3 liberada", [t for t in est["tables"] if t["number"] == 3][0]["status"] == "livre")
    check("pagamento registrado", len(est["payments"]) == 1 and est["payments"][0]["status"] == "confirmado")
    check("pagar de novo=400", c.post("/api/conta", json={"tableNumber": 3, "action": "pagar", "method": "pix"}).status_code == 400)
    # nova conta na mesma mesa
    r = c.post("/api/pedidos", json={"tableNumber": 3, "items": [{"productId": 1, "quantity": 1}]}); check("nova conta depois de paga", r.status_code == 200)
    check("2 contas agora", len(c.get("/api/estado").json()["accounts"]) == 2)
    # pagar direto sem pedir conta (caixa)
    r = c.post("/api/conta", json={"tableNumber": 3, "action": "pagar", "method": "dinheiro"}); check("pagar direto (conta aberta)", r.status_code == 200, r.text)

    # gerente
    check("relatorio sem token=401", c.get("/api/relatorios/vendas?de=2026-01-01&ate=2026-12-31").status_code == 401)
    check("relatorio caixa=403", c.get("/api/relatorios/vendas?de=2026-01-01&ate=2026-12-31", headers=HC).status_code == 403)
    r = c.get("/api/relatorios/vendas?de=2026-01-01&ate=2026-12-31", headers=H); check("relatorio vendas", r.status_code == 200 and r.json()["paidAccounts"] == 2, r.text[:200])
    r = c.get("/api/relatorios/historico?de=2026-01-01&ate=2026-12-31", headers=H); check("relatorio historico", r.status_code == 200 and r.json()["totalOrders"] == 3, r.text[:200])
    check("periodo invalido=400", c.get("/api/relatorios/vendas?de=x&ate=y", headers=H).status_code == 400)
    check("periodo invertido=400", c.get("/api/relatorios/vendas?de=2030-01-01&ate=2020-01-01", headers=H).status_code == 400)
    r = c.put("/api/produtos/1", json={"name": "Bife X", "description": "d", "price": 40}, headers=H); check("editar produto", r.status_code == 200 and r.json()["price"] == 40, r.text)
    check("editar preco 0=400", c.put("/api/produtos/1", json={"name": "A", "description": "d", "price": 0}, headers=H).status_code == 400)
    check("editar sem token=401", c.put("/api/produtos/1", json={"name": "A", "description": "d", "price": 5}).status_code == 401)
    png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    r = c.post("/api/produtos/1/imagem", json={"dataUrl": png}, headers=H); check("upload imagem", r.status_code == 200 and r.json()["image"].startswith("/uploads/"), r.text)
    check("imagem acessivel", c.get(r.json()["image"]).status_code == 200)
    check("imagem invalida=400", c.post("/api/produtos/1/imagem", json={"dataUrl": "lixo"}, headers=H).status_code == 400)
    check("zerar sem token=401", c.delete("/api/estado").status_code == 401)
    r = c.delete("/api/estado", headers=H); check("zerar demo", r.status_code == 200 and r.json()["orders"] == [] and all(t["status"] == "livre" for t in r.json()["tables"]))
    check("rota inexistente /api/xyz", c.get("/api/xyz").status_code == 404)

print(f"\n{ok} ok, {fail} falhas")


