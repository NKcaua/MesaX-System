"""API HTTP (FastAPI) do MesaX / Restaurante Caseirão.

Mesmas rotas e formato JSON que o front React já consome em /api.
Rodar (a partir de Back-end/):  python -m uvicorn api.app:app --port 43124
"""

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Body, FastAPI, Header, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from . import db as store
from . import relatorios, services
from .services import ApiError

DIST = store.ROOT.parent / "Front-end" / "client" / "dist"


@asynccontextmanager
async def lifespan(_app):
    store.init_db()
    print(f"Banco: sqlite ({store.DB_PATH})")
    yield


app = FastAPI(title="MesaX - Restaurante Caseirão", lifespan=lifespan)
# O site e a API ficam na mesma origem (proxy do Vite / servidor único), então
# o CORS só libera origens locais de desenvolvimento. Para outro domínio, defina
# CORS_ORIGINS="https://meu-site.com,https://outro.com".
ORIGENS = [
    o.strip()
    for o in os.environ.get(
        "CORS_ORIGINS", "http://localhost:43123,http://127.0.0.1:43123"
    ).split(",")
    if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGENS,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.exception_handler(ApiError)
async def api_error(_req, exc):
    return JSONResponse({"error": exc.message}, status_code=exc.status)


@app.exception_handler(RequestValidationError)
async def validation_error(_req, _exc):
    return JSONResponse({"error": "Dados inválidos."}, status_code=400)


def gerente(authorization):
    services.exigir_perfil(authorization, "gerente")


# ---------- público ----------

@app.get("/api/saude")
def saude():
    return {"ok": True, "db": "sqlite"}


@app.get("/api/produtos")
def produtos():
    with store.tx() as db:
        return services.listar_produtos(db)


@app.get("/api/estado")
def estado():
    with store.tx() as db:
        return services.snapshot(db)


@app.post("/api/pedidos")
def criar_pedido(body: dict = Body(...)):
    return services.criar_pedido(body.get("tableNumber"), body.get("items"))


@app.patch("/api/pedidos/{pedido_id}")
def atualizar_pedido(pedido_id: int, body: dict = Body(...)):
    return services.atualizar_pedido(pedido_id, body.get("status"))


@app.post("/api/conta")
def conta(body: dict = Body(...)):
    if body.get("action") == "pagar":
        return services.pagar_conta(body.get("tableNumber"), body.get("method"))
    return services.pedir_conta(body.get("tableNumber"))


@app.patch("/api/produtos")
def disponibilidade(body: dict = Body(...)):
    return services.definir_disponibilidade(body.get("id"), body.get("available"))


@app.post("/api/auth")
def auth(body: dict = Body(...)):
    return services.login(body.get("login"), body.get("password"))


# ---------- somente gerente ----------

@app.delete("/api/estado")
def zerar(authorization: str = Header(default="")):
    gerente(authorization)
    return services.zerar_demonstracao()


@app.put("/api/produtos/{produto_id}")
def editar_produto(produto_id: int, body: dict = Body(...), authorization: str = Header(default="")):
    gerente(authorization)
    return services.editar_produto(produto_id, body)


@app.post("/api/produtos/{produto_id}/imagem")
def imagem_produto(produto_id: int, body: dict = Body(...), authorization: str = Header(default="")):
    gerente(authorization)
    return services.salvar_imagem(produto_id, body.get("dataUrl"))


@app.get("/api/relatorios/vendas")
def relatorio_vendas(de: str = "", ate: str = "", authorization: str = Header(default="")):
    gerente(authorization)
    return relatorios.relatorio_vendas(de, ate)


@app.get("/api/relatorios/historico")
def relatorio_historico(de: str = "", ate: str = "", authorization: str = Header(default="")):
    gerente(authorization)
    return relatorios.historico_pedidos(de, ate)


# ---------- arquivos: fotos enviadas e (se existir) o site compilado ----------

store.UPLOADS.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=store.UPLOADS), name="uploads")

if (DIST / "index.html").exists():

    @app.get("/{caminho:path}")
    def site(caminho: str, request: Request):
        if caminho.startswith("api/"):
            return JSONResponse({"error": "Rota não encontrada"}, status_code=404)
        alvo = (DIST / caminho).resolve()
        if caminho and DIST.resolve() in alvo.parents and alvo.is_file():
            return FileResponse(alvo)
        return FileResponse(DIST / "index.html")
