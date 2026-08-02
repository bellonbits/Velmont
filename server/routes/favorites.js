import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../auth.js";

export const favoritesRouter = Router();
favoritesRouter.use(requireAuth);

favoritesRouter.get("/", (req, res) => {
  const rows = db
    .prepare("SELECT product_id FROM favorites WHERE user_id = ? ORDER BY created_at DESC")
    .all(req.user.id);
  res.json({ productIds: rows.map((r) => r.product_id) });
});

favoritesRouter.post("/", (req, res) => {
  const { productId } = req.body ?? {};
  if (!productId) return res.status(400).json({ error: "productId is required." });

  db.prepare(
    "INSERT OR IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)",
  ).run(req.user.id, productId);
  res.status(201).json({ ok: true });
});

favoritesRouter.delete("/:productId", (req, res) => {
  db.prepare("DELETE FROM favorites WHERE user_id = ? AND product_id = ?").run(
    req.user.id,
    req.params.productId,
  );
  res.status(204).end();
});
