import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

export async function createDb() {
  if (process.env.DATABASE_URL) {
    const pg = await import("pg");
    const pool = new pg.default.Pool({ connectionString: process.env.DATABASE_URL });
    return {
      kind: "postgres",
      query: (text, params) => pool.query(text, params),
    };
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const dir = path.join(ROOT, "data", "pglite");
  fs.mkdirSync(dir, { recursive: true });
  const sqlite = new PGlite(dir);
  return {
    kind: "pglite",
    query: async (text, params = []) => {
      const result = await sqlite.query(text, params);
      return {
        rows: result.rows ?? [],
        rowCount: result.affectedRows ?? result.rows?.length ?? 0,
      };
    },
  };
}

export async function migrate(db) {
  const schema = fs.readFileSync(path.join(ROOT, "db", "schema.sql"), "utf8");
  const statements = schema
    .split(";")
    .map((part) =>
      part
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim(),
    )
    .filter(Boolean);
  for (const sql of statements) {
    await db.query(sql);
  }

  const { rows } = await db.query("SELECT COUNT(*) AS n FROM produto");
  if (Number(rows[0].n) > 0) return;

  const hash = bcrypt.hashSync("caseirao", 8);
  const users = [
    ["Cozinha", "cozinha", "cozinha"],
    ["Garçom", "garcom", "garcom"],
    ["Caixa", "caixa", "caixa"],
    ["Gerente", "gerente", "gerente"],
  ];
  for (const [nome, login, tipo] of users) {
    await db.query(
      "INSERT INTO usuario (nome, login, senha_hash, tipo_usuario) VALUES ($1, $2, $3, $4)",
      [nome, login, hash, tipo],
    );
  }

  const products = [
    ["Bife acebolado", "Contrafilé grelhado com cebola, arroz, feijão, batata frita e salada.", 32.9, "executivo", "/images/prato-bife.jpg"],
    ["Filé de frango grelhado", "Peito grelhado, arroz, feijão, farofa e salada da casa.", 29.9, "executivo", "/images/prato-frango.jpg"],
    ["Parmegiana de carne", "Bife empanado, molho, queijo gratinado, arroz e fritas.", 36.9, "executivo", "/images/prato-parmegiana.jpg"],
    ["Estrogonofe de frango", "Estrogonofe cremoso, arroz e batata palha.", 31.9, "executivo", "/images/prato-strogonoff.jpg"],
    ["Peixe grelhado", "Filé do dia, arroz, feijão, legumes e salada.", 34.9, "executivo", "/images/prato-peixe.jpg"],
    ["Omelete da casa", "Ovos, queijo, tomate, arroz e salada. Opção mais leve.", 24.9, "executivo", "/images/prato-omelete.jpg"],
    ["Picadinho", "Carne em cubos, molho, arroz, feijão e farofa.", 30.9, "executivo", "/images/prato-bife.jpg"],
    ["Contrafilé", "Grelhado no ponto, arroz, feijão, vinagrete e fritas.", 38.9, "executivo", "/images/prato-bife.jpg"],
    ["Refrigerante lata", "Coca-Cola, Guaraná, Sprite ou Fanta. 350 ml.", 6, "bebida", "/images/bebida-refri.jpg"],
    ["Suco de laranja", "Natural, copo 400 ml.", 8, "bebida", "/images/bebida-suco.jpg"],
    ["Suco de maracujá", "Natural, copo 400 ml.", 8, "bebida", "/images/bebida-suco.jpg"],
    ["Água mineral", "Com ou sem gás. 500 ml.", 4, "bebida", "/images/bebida-refri.jpg"],
    ["Cerveja lata", "Pilsen gelada. 350 ml.", 9, "bebida", "/images/bebida-cerveja.jpg"],
    ["Café", "Cafezinho coado da casa.", 4.5, "bebida", "/images/latte-art.png"],
    ["Guaraná 600 ml", "Garrafa para a mesa.", 8, "bebida", "/images/bebida-refri.jpg"],
  ];
  for (const [nome, descricao, preco, categoria, imagem] of products) {
    await db.query(
      `INSERT INTO produto (nome, descricao, preco, disponibilidade, categoria, imagem)
       VALUES ($1, $2, $3, TRUE, $4, $5)`,
      [nome, descricao, preco, categoria, imagem],
    );
  }

  const tables = [
    [1, 2],
    [2, 2],
    [3, 4],
    [4, 4],
    [5, 4],
    [6, 2],
    [7, 4],
    [8, 6],
  ];
  for (const [numero, capacidade] of tables) {
    await db.query(
      "INSERT INTO mesa (numero, capacidade, situacao) VALUES ($1, $2, 'livre')",
      [numero, capacidade],
    );
  }
}

function mapProduct(row) {
  return {
    id: String(row.id),
    name: row.nome,
    description: row.descricao,
    price: Number(row.preco),
    available: row.disponibilidade,
    category: row.categoria,
    image: row.imagem,
  };
}

function mapTable(row) {
  return {
    id: String(row.id),
    number: row.numero,
    capacity: row.capacidade,
    status: row.situacao,
  };
}

function mapOrder(row, items) {
  return {
    id: String(row.id),
    tableId: String(row.mesa_id),
    tableNumber: row.numero,
    createdAt: row.data_hora,
    status: row.status,
    total: Number(row.valor_total),
    items: items.map((item) => ({
      id: String(item.id),
      productId: String(item.produto_id),
      name: item.nome,
      quantity: item.quantidade,
      unitPrice: Number(item.preco_unitario),
      subtotal: Number(item.subtotal),
    })),
  };
}

export async function snapshot(db) {
  const products = (await db.query("SELECT * FROM produto ORDER BY id")).rows.map(mapProduct);
  const tables = (await db.query("SELECT * FROM mesa ORDER BY numero")).rows.map(mapTable);
  const accounts = (
    await db.query(
      `SELECT c.*, m.numero AS numero
       FROM conta c JOIN mesa m ON m.id = c.mesa_id
       ORDER BY c.id`,
    )
  ).rows.map((row) => ({
    id: String(row.id),
    tableId: String(row.mesa_id),
    tableNumber: row.numero,
    status: row.status,
    openedAt: row.data_abertura,
    closedAt: row.data_fechamento,
    total: Number(row.valor_total),
    orderIds: [],
  }));
  const ordersRows = (
    await db.query(
      `SELECT p.*, m.numero
       FROM pedido p JOIN mesa m ON m.id = p.mesa_id
       ORDER BY p.id`,
    )
  ).rows;
  const itemRows = (
    await db.query(
      `SELECT i.*, pr.nome
       FROM item_pedido i JOIN produto pr ON pr.id = i.produto_id
       ORDER BY i.id`,
    )
  ).rows;
  const orders = ordersRows.map((row) =>
    mapOrder(
      row,
      itemRows.filter((item) => item.pedido_id === row.id),
    ),
  );
  for (const account of accounts) {
    account.orderIds = ordersRows
      .filter((row) => String(row.conta_id) === account.id)
      .map((row) => String(row.id));
  }
  const payments = (await db.query("SELECT * FROM pagamento ORDER BY id")).rows.map((row) => ({
    id: String(row.id),
    accountId: String(row.conta_id),
    amount: Number(row.valor),
    method: row.forma_pagamento,
    createdAt: row.data,
    status: row.status,
  }));
  return { products, tables, orders, accounts, payments };
}

export async function createOrder(db, tableNumber, items) {
  const mesa = (await db.query("SELECT * FROM mesa WHERE numero = $1", [tableNumber])).rows[0];
  if (!mesa) throw new Error("Mesa não encontrada");

  const waiting = (
    await db.query(
      "SELECT * FROM conta WHERE mesa_id = $1 AND status = 'aguardando_pagamento'",
      [mesa.id],
    )
  ).rows[0];
  if (waiting) throw new Error("A conta desta mesa já foi pedida. Aguarde o caixa.");
  if (!items?.length) throw new Error("Escolha pelo menos um item");

  let conta = (
    await db.query(
      "SELECT * FROM conta WHERE mesa_id = $1 AND status = 'aberta' ORDER BY id DESC LIMIT 1",
      [mesa.id],
    )
  ).rows[0];
  if (!conta) {
    conta = (
      await db.query(
        `INSERT INTO conta (mesa_id, status) VALUES ($1, 'aberta') RETURNING *`,
        [mesa.id],
      )
    ).rows[0];
  }

  await db.query("UPDATE mesa SET situacao = 'ocupada' WHERE id = $1", [mesa.id]);

  const built = [];
  let total = 0;
  for (const line of items) {
    const product = (await db.query("SELECT * FROM produto WHERE id = $1", [line.productId])).rows[0];
    if (!product) throw new Error("Produto não encontrado");
    if (!product.disponibilidade) throw new Error(`${product.nome} acabou. Escolha outro.`);
    const qty = Math.max(1, Math.floor(line.quantity));
    const subtotal = Number(product.preco) * qty;
    total += subtotal;
    built.push({ product, qty, subtotal, unit: Number(product.preco) });
  }

  const pedido = (
    await db.query(
      `INSERT INTO pedido (mesa_id, conta_id, status, valor_total)
       VALUES ($1, $2, 'recebido', $3) RETURNING *`,
      [mesa.id, conta.id, total],
    )
  ).rows[0];

  for (const line of built) {
    await db.query(
      `INSERT INTO item_pedido (pedido_id, produto_id, quantidade, preco_unitario, subtotal)
       VALUES ($1, $2, $3, $4, $5)`,
      [pedido.id, line.product.id, line.qty, line.unit, line.subtotal],
    );
  }

  const soma = (
    await db.query("SELECT COALESCE(SUM(valor_total),0) AS t FROM pedido WHERE conta_id = $1", [
      conta.id,
    ])
  ).rows[0].t;
  await db.query("UPDATE conta SET valor_total = $1 WHERE id = $2", [soma, conta.id]);

  const itemRows = (
    await db.query(
      `SELECT i.*, pr.nome FROM item_pedido i JOIN produto pr ON pr.id = i.produto_id WHERE i.pedido_id = $1`,
      [pedido.id],
    )
  ).rows;
  pedido.numero = mesa.numero;
  return mapOrder(pedido, itemRows);
}

export async function updateOrderStatus(db, id, status) {
  const row = (
    await db.query("UPDATE pedido SET status = $1 WHERE id = $2 RETURNING *", [status, id])
  ).rows[0];
  if (!row) throw new Error("Pedido não encontrado");
  const mesa = (await db.query("SELECT numero FROM mesa WHERE id = $1", [row.mesa_id])).rows[0];
  const items = (
    await db.query(
      `SELECT i.*, pr.nome FROM item_pedido i JOIN produto pr ON pr.id = i.produto_id WHERE i.pedido_id = $1`,
      [row.id],
    )
  ).rows;
  row.numero = mesa.numero;
  return mapOrder(row, items);
}

export async function requestBill(db, tableNumber) {
  const mesa = (await db.query("SELECT * FROM mesa WHERE numero = $1", [tableNumber])).rows[0];
  if (!mesa) throw new Error("Mesa não encontrada");
  const conta = (
    await db.query(
      "SELECT * FROM conta WHERE mesa_id = $1 AND status <> 'paga' ORDER BY id DESC LIMIT 1",
      [mesa.id],
    )
  ).rows[0];
  if (!conta) throw new Error("Essa mesa ainda não tem pedido.");
  const soma = (
    await db.query("SELECT COALESCE(SUM(valor_total),0) AS t FROM pedido WHERE conta_id = $1", [
      conta.id,
    ])
  ).rows[0].t;
  const updated = (
    await db.query(
      `UPDATE conta SET status = 'aguardando_pagamento', valor_total = $1 WHERE id = $2 RETURNING *`,
      [soma, conta.id],
    )
  ).rows[0];
  return {
    id: String(updated.id),
    tableId: String(updated.mesa_id),
    tableNumber: mesa.numero,
    status: updated.status,
    total: Number(updated.valor_total),
  };
}

export async function payAccount(db, tableNumber, method) {
  const mesa = (await db.query("SELECT * FROM mesa WHERE numero = $1", [tableNumber])).rows[0];
  if (!mesa) throw new Error("Mesa não encontrada");
  const conta = (
    await db.query(
      "SELECT * FROM conta WHERE mesa_id = $1 AND status <> 'paga' ORDER BY id DESC LIMIT 1",
      [mesa.id],
    )
  ).rows[0];
  if (!conta) throw new Error("Não há conta aberta nesta mesa.");
  const soma = (
    await db.query("SELECT COALESCE(SUM(valor_total),0) AS t FROM pedido WHERE conta_id = $1", [
      conta.id,
    ])
  ).rows[0].t;
  const payment = (
    await db.query(
      `INSERT INTO pagamento (conta_id, valor, forma_pagamento, status)
       VALUES ($1, $2, $3, 'confirmado') RETURNING *`,
      [conta.id, soma, method],
    )
  ).rows[0];
  await db.query(
    `UPDATE conta SET status = 'paga', valor_total = $1, data_fechamento = NOW() WHERE id = $2`,
    [soma, conta.id],
  );
  await db.query("UPDATE mesa SET situacao = 'livre' WHERE id = $1", [mesa.id]);
  return {
    account: {
      id: String(conta.id),
      tableNumber: mesa.numero,
      status: "paga",
      total: Number(soma),
    },
    payment: {
      id: String(payment.id),
      method: payment.forma_pagamento,
      amount: Number(payment.valor),
    },
  };
}

export async function toggleProduct(db, id, available) {
  const row = (
    await db.query(
      "UPDATE produto SET disponibilidade = $1 WHERE id = $2 RETURNING *",
      [available, id],
    )
  ).rows[0];
  if (!row) throw new Error("Produto não encontrado");
  return mapProduct(row);
}

export async function loginUser(db, login, password) {
  const row = (await db.query("SELECT * FROM usuario WHERE login = $1", [login])).rows[0];
  if (!row || !bcrypt.compareSync(password, row.senha_hash)) {
    throw new Error("Login ou senha inválidos");
  }
  return { login: row.login, name: row.nome, role: row.tipo_usuario };
}

export async function resetDemo(db) {
  await db.query("DELETE FROM pagamento");
  await db.query("DELETE FROM item_pedido");
  await db.query("DELETE FROM pedido");
  await db.query("DELETE FROM conta");
  await db.query("UPDATE mesa SET situacao = 'livre'");
  await db.query("UPDATE produto SET disponibilidade = TRUE");
  return snapshot(db);
}
