import { Router } from "express";
import { requireAuth } from "../auth.js";
import { supabaseAdmin } from "../supabase.js";

export const favoritesRouter = Router();
favoritesRouter.use(requireAuth);

favoritesRouter.get("/", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("favorites")
    .select("product_id")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ productIds: data.map((r) => r.product_id) });
});

favoritesRouter.post("/", async (req, res) => {
  const { productId } = req.body ?? {};
  if (!productId) return res.status(400).json({ error: "productId is required." });

  await supabaseAdmin
    .from("favorites")
    .upsert({ user_id: req.user.id, product_id: productId }, { onConflict: "user_id,product_id" });
  res.status(201).json({ ok: true });
});

favoritesRouter.delete("/:productId", async (req, res) => {
  await supabaseAdmin
    .from("favorites")
    .delete()
    .eq("user_id", req.user.id)
    .eq("product_id", req.params.productId);
  res.status(204).end();
});
