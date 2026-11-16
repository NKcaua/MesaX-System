"""Persistência em SQLite (biblioteca padrão) com as mesmas tabelas do UML.

O esquema espelha Front-end/db/schema.sql (PostgreSQL). Datas são gravadas
em UTC (ISO 8601 com 'Z'); as regras de negócio ficam nas classes do domínio.
"""

import hashlib
import hmac
import secrets
import sqlite3
import threading
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
UPLOADS = DATA_DIR / "uploads"
DB_PATH = DATA_DIR / "caseirao.db"

LOCK = threading.RLock()
_conn = None

SCHEMA = """
CREATE TABLE IF NOT EXISTS usuario (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  login TEXT UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  tipo_usuario TEXT NOT NULL
    CHECK (tipo_usuario IN ('cozinha', 'garcom', 'caixa', 'gerente'))
);
CREATE TABLE IF NOT EXISTS produto (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  descricao TEXT NOT NULL,
  preco REAL NOT NULL,
  disponibilidade INTEGER NOT NULL DEFAULT 1,
  categoria TEXT NOT NULL CHECK (categoria IN ('executivo', 'bebida')),
  imagem TEXT
);
CREATE TABLE IF NOT EXISTS mesa (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero INTEGER UNIQUE NOT NULL,
  capacidade INTEGER NOT NULL,
  situacao TEXT NOT NULL DEFAULT 'livre' CHECK (situacao IN ('livre', 'ocupada'))
);
CREATE TABLE IF NOT EXISTS cliente (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT,
  mesa_id INTEGER REFERENCES mesa (id)
);
CREATE TABLE IF NOT EXISTS conta (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mesa_id INTEGER NOT NULL REFERENCES mesa (id),
  valor_total REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'aberta'
    CHECK (status IN ('aberta', 'aguardando_pagamento', 'paga')),
  data_abertura TEXT NOT NULL,
  data_fechamento TEXT
);
CREATE TABLE IF NOT EXISTS pedido (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mesa_id INTEGER NOT NULL REFERENCES mesa (id),
  conta_id INTEGER NOT NULL REFERENCES conta (id),
  data_hora TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'recebido'
    CHECK (status IN ('recebido', 'em_preparo', 'pronto', 'entregue')),
  valor_total REAL NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS item_pedido (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id INTEGER NOT NULL REFERENCES pedido (id) ON DELETE CASCADE,
  produto_id INTEGER NOT NULL REFERENCES produto (id),
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  preco_unitario REAL NOT NULL,
  subtotal REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS pagamento (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conta_id INTEGER NOT NULL REFERENCES conta (id),
  valor REAL NOT NULL,
  data TEXT NOT NULL,
  forma_pagamento TEXT NOT NULL
    CHECK (forma_pagamento IN ('dinheiro', 'pix', 'debito', 'credito')),
  status TEXT NOT NULL DEFAULT 'confirmado'
);
CREATE INDEX IF NOT EXISTS idx_conta_mesa ON conta (mesa_id);
CREATE INDEX IF NOT EXISTS idx_conta_status ON conta (status);
CREATE INDEX IF NOT EXISTS idx_pedido_conta ON pedido (conta_id);
CREATE INDEX IF NOT EXISTS idx_item_pedido ON item_pedido (pedido_id);
CREATE INDEX IF NOT EXISTS idx_pagamento_conta ON pagamento (conta_id);
"""

USERS = [
    ("Cozinha", "cozinha", "cozinha"),
    ("Garçom", "garcom", "garcom"),
    ("Caixa", "caixa", "caixa"),
    ("Gerente", "gerente", "gerente"),
]

PRODUCTS = [
    ("Bife acebolado", "Contrafilé grelhado com cebola, arroz, feijão, batata frita e salada.", 32.9, "executivo", "/images/prato-bife.jpg"),
    ("Filé de frango grelhado", "Peito grelhado, arroz, feijão, farofa e salada da casa.", 29.9, "executivo", "/images/prato-frango.jpg"),
    ("Parmegiana de carne", "Bife empanado, molho, queijo gratinado, arroz e fritas.", 36.9, "executivo", "/images/prato-parmegiana.jpg"),
    ("Estrogonofe de frango", "Estrogonofe cremoso, arroz e batata palha.", 31.9, "executivo", "/images/prato-strogonoff.jpg"),
    ("Peixe grelhado", "Filé do dia, arroz, feijão, legumes e salada.", 34.9, "executivo", "/images/prato-peixe.jpg"),
    ("Omelete da casa", "Ovos, queijo, tomate, arroz e salada. Opção mais leve.", 24.9, "executivo", "/images/prato-omelete.jpg"),
    ("Picadinho", "Carne em cubos, molho, arroz, feijão e farofa.", 30.9, "executivo", "/images/prato-bife.jpg"),
    ("Contrafilé", "Grelhado no ponto, arroz, feijão, vinagrete e fritas.", 38.9, "executivo", "/images/prato-bife.jpg"),
    ("Refrigerante lata", "Coca-Cola, Guaraná, Sprite ou Fanta. 350 ml.", 6, "bebida", "/images/bebida-refri.jpg"),
    ("Suco de laranja", "Natural, copo 400 ml.", 8, "bebida", "/images/bebida-suco.jpg"),
    ("Suco de maracujá", "Natural, copo 400 ml.", 8, "bebida", "/images/bebida-suco.jpg"),
    ("Água mineral", "Com ou sem gás. 500 ml.", 4, "bebida", "/images/bebida-refri.jpg"),
    ("Cerveja lata", "Pilsen gelada. 350 ml.", 9, "bebida", "/images/bebida-cerveja.jpg"),
    ("Café", "Cafezinho coado da casa.", 4.5, "bebida", "/images/latte-art.png"),
    ("Guaraná 600 ml", "Garrafa para a mesa.", 8, "bebida", "/images/bebida-refri.jpg"),
]

TABLES = [(1, 2), (2, 2), (3, 4), (4, 4), (5, 4), (6, 2), (7, 4), (8, 6)]


def now_iso():
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def hash_password(password):
    salt = secrets.token_hex(8)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000).hex()
    return f"{salt}${digest}"


def check_password(password, stored):
    try:
        salt, digest = stored.split("$")
    except ValueError:
        return False
    test = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000).hex()
    return hmac.compare_digest(test, digest)


def init_db():
    """Abre o banco, cria as tabelas e popula o cardápio/mesas/usuários."""
    global _conn
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    UPLOADS.mkdir(parents=True, exist_ok=True)
    _conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    _conn.row_factory = sqlite3.Row
    _conn.execute("PRAGMA foreign_keys = ON")
    _conn.executescript(SCHEMA)

    with tx() as db:
        if db.execute("SELECT COUNT(*) FROM produto").fetchone()[0] == 0:
            senha = hash_password("caseirao")
            db.executemany(
                "INSERT INTO usuario (nome, login, senha_hash, tipo_usuario) VALUES (?, ?, ?, ?)",
                [(nome, login, senha, tipo) for nome, login, tipo in USERS],
            )
            db.executemany(
                "INSERT INTO produto (nome, descricao, preco, disponibilidade, categoria, imagem)"
                " VALUES (?, ?, ?, 1, ?, ?)",
                PRODUCTS,
            )
            db.executemany(
                "INSERT INTO mesa (numero, capacidade, situacao) VALUES (?, ?, 'livre')",
                TABLES,
            )


@contextmanager
def tx():
    """Transação com trava (a conexão é compartilhada entre as threads)."""
    with LOCK:
        try:
            yield _conn
            _conn.commit()
        except BaseException:
            _conn.rollback()
            raise
