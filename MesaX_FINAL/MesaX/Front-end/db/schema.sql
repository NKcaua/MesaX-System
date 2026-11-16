-- Restaurante Caseirão — PostgreSQL
-- UML: Produto, Mesa, Cliente, Pedido, ItemPedido, Conta, Pagamento, Usuario

CREATE TABLE IF NOT EXISTS usuario (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  login TEXT UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  tipo_usuario TEXT NOT NULL
    CHECK (tipo_usuario IN ('cozinha', 'garcom', 'caixa', 'gerente'))
);

CREATE TABLE IF NOT EXISTS produto (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT NOT NULL,
  preco NUMERIC(10, 2) NOT NULL,
  disponibilidade BOOLEAN NOT NULL DEFAULT TRUE,
  categoria TEXT NOT NULL CHECK (categoria IN ('executivo', 'bebida')),
  imagem TEXT
);

CREATE TABLE IF NOT EXISTS mesa (
  id SERIAL PRIMARY KEY,
  numero INTEGER UNIQUE NOT NULL,
  capacidade INTEGER NOT NULL,
  situacao TEXT NOT NULL DEFAULT 'livre'
    CHECK (situacao IN ('livre', 'ocupada'))
);

CREATE TABLE IF NOT EXISTS cliente (
  id SERIAL PRIMARY KEY,
  nome TEXT,
  mesa_id INTEGER REFERENCES mesa (id)
);

CREATE TABLE IF NOT EXISTS conta (
  id SERIAL PRIMARY KEY,
  mesa_id INTEGER NOT NULL REFERENCES mesa (id),
  valor_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'aberta'
    CHECK (status IN ('aberta', 'aguardando_pagamento', 'paga')),
  data_abertura TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_fechamento TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS pedido (
  id SERIAL PRIMARY KEY,
  mesa_id INTEGER NOT NULL REFERENCES mesa (id),
  conta_id INTEGER NOT NULL REFERENCES conta (id),
  data_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'recebido'
    CHECK (status IN ('recebido', 'em_preparo', 'pronto', 'entregue')),
  valor_total NUMERIC(10, 2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS item_pedido (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES pedido (id) ON DELETE CASCADE,
  produto_id INTEGER NOT NULL REFERENCES produto (id),
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  preco_unitario NUMERIC(10, 2) NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS pagamento (
  id SERIAL PRIMARY KEY,
  conta_id INTEGER NOT NULL REFERENCES conta (id),
  valor NUMERIC(10, 2) NOT NULL,
  data TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  forma_pagamento TEXT NOT NULL
    CHECK (forma_pagamento IN ('dinheiro', 'pix', 'debito', 'credito')),
  status TEXT NOT NULL DEFAULT 'confirmado'
);

CREATE INDEX IF NOT EXISTS idx_usuario_login ON usuario (login);
CREATE INDEX IF NOT EXISTS idx_produto_categoria ON produto (categoria);
CREATE INDEX IF NOT EXISTS idx_produto_disponivel ON produto (disponibilidade);
CREATE INDEX IF NOT EXISTS idx_mesa_numero ON mesa (numero);
CREATE INDEX IF NOT EXISTS idx_mesa_situacao ON mesa (situacao);
CREATE INDEX IF NOT EXISTS idx_conta_mesa ON conta (mesa_id);
CREATE INDEX IF NOT EXISTS idx_conta_status ON conta (status);
CREATE INDEX IF NOT EXISTS idx_pedido_mesa ON pedido (mesa_id);
CREATE INDEX IF NOT EXISTS idx_pedido_conta ON pedido (conta_id);
CREATE INDEX IF NOT EXISTS idx_pedido_status ON pedido (status);
CREATE INDEX IF NOT EXISTS idx_item_pedido ON item_pedido (pedido_id);
CREATE INDEX IF NOT EXISTS idx_pagamento_conta ON pagamento (conta_id);
