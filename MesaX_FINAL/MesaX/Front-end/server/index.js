import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import {
  createDb,
  migrate,
  snapshot,
  createOrder,
  updateOrderStatus,
  requestBill,
  payAccount,
  toggleProduct,
  loginUser,
  resetDemo,
  salesReport,
  updateProduct,
  setProductImage,
  ordersHistory,
} from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(__dirname, "../client/dist");
const uploads = path.join(__dirname, "../data/uploads");
fs.mkdirSync(uploads, { recursive: true });
const hasSite = fs.existsSync(path.join(dist, "index.html"));
const PORT = Number(process.env.PORT || (hasSite ? 43123 : 43124));
const app = express();
app.use(cors());
app.use(express.json({ limit: "6mb" }));

const db = await createDb();
await migrate(db);
console.log(`Banco: ${db.kind}`);

// Sessões em memória: o token devolvido no login é exigido nas rotas gerenciais.
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const sessions = new Map();

function requireRole(...roles) {
  return (req, res, next) => {
    const token = (req.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const session = sessions.get(token);
    if (!session || session.expires < Date.now()) {
      sessions.delete(token);
      return res.status(401).json({ error: "Sessão expirada. Entre novamente." });
    }
    if (!roles.includes(session.role)) {
      return res.status(403).json({ error: "Acesso restrito ao gerente." });
    }
    req.user = session;
    next();
  };
}

app.use("/uploads", express.static(uploads, { maxAge: "7d" }));

app.get("/api/saude", (_req, res) => {
  res.json({ ok: true, db: db.kind });
});

app.get("/api/produtos", async (_req, res) => {
  const data = await snapshot(db);
  res.json(data.products);
});

app.get("/api/estado", async (_req, res) => {
  res.json(await snapshot(db));
});

app.delete("/api/estado", requireRole("gerente"), async (_req, res) => {
  res.json(await resetDemo(db));
});

app.post("/api/pedidos", async (req, res) => {
  try {
    const order = await createOrder(db, req.body.tableNumber, req.body.items);
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.patch("/api/pedidos/:id", async (req, res) => {
  try {
    const order = await updateOrderStatus(db, req.params.id, req.body.status);
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/conta", async (req, res) => {
  try {
    if (req.body.action === "pagar") {
      res.json(await payAccount(db, req.body.tableNumber, req.body.method));
      return;
    }
    res.json(await requestBill(db, req.body.tableNumber));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.patch("/api/produtos", async (req, res) => {
  try {
    res.json(await toggleProduct(db, req.body.id, req.body.available));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/auth", async (req, res) => {
  try {
    const user = await loginUser(db, req.body.login, req.body.password);
    const token = crypto.randomBytes(24).toString("hex");
    sessions.set(token, { ...user, expires: Date.now() + SESSION_TTL_MS });
    res.json({ ...user, token });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// RF09 — relatório de vendas (somente gerente). ?de=AAAA-MM-DD&ate=AAAA-MM-DD
app.get("/api/relatorios/vendas", requireRole("gerente"), async (req, res) => {
  try {
    res.json(await salesReport(db, req.query.de, req.query.ate));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Edição de produto (somente gerente): nome, descrição e preço.
// Pedidos já feitos mantêm o preço gravado em item_pedido.preco_unitario.
app.put("/api/produtos/:id", requireRole("gerente"), async (req, res) => {
  try {
    res.json(await updateProduct(db, req.params.id, req.body));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Foto do produto (somente gerente): { dataUrl: "data:image/jpeg;base64,..." }
const IMAGE_EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
app.post("/api/produtos/:id/imagem", requireRole("gerente"), async (req, res) => {
  try {
    const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(
      String(req.body.dataUrl ?? ""),
    );
    if (!match) throw new Error("Envie uma imagem JPG, PNG ou WebP.");
    const buffer = Buffer.from(match[2], "base64");
    if (buffer.length > 4 * 1024 * 1024) throw new Error("Imagem maior que 4 MB.");
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new Error("Produto não encontrado");
    const name = `produto-${id}-${Date.now()}.${IMAGE_EXT[match[1]]}`;
    fs.writeFileSync(path.join(uploads, name), buffer);
    res.json(await setProductImage(db, id, `/uploads/${name}`));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Histórico de pedidos (somente gerente). ?de=AAAA-MM-DD&ate=AAAA-MM-DD
app.get("/api/relatorios/historico", requireRole("gerente"), async (req, res) => {
  try {
    res.json(await ordersHistory(db, req.query.de, req.query.ate));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

if (hasSite) {
  app.use(express.static(dist));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) return next();
    res.sendFile(path.join(dist, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API Caseirão em http://127.0.0.1:${PORT}`);
  if (hasSite) console.log(`Site em http://127.0.0.1:${PORT}`);
});
