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
} from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(__dirname, "../client/dist");
const hasSite = fs.existsSync(path.join(dist, "index.html"));
const PORT = Number(process.env.PORT || (hasSite ? 43123 : 43124));
const app = express();
app.use(cors());
app.use(express.json());

const db = await createDb();
await migrate(db);
console.log(`Banco: ${db.kind}`);

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

app.delete("/api/estado", async (_req, res) => {
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
    res.json(await loginUser(db, req.body.login, req.body.password));
  } catch (error) {
    res.status(401).json({ error: error.message });
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
