import { Router } from "express";
import { supabaseAdmin } from "../supabase.js";

export const productsRouter = Router();

export function serializeProduct(row) {
  return {
    id: row.id,
    brandId: row.brand_id,
    name: row.name,
    price: row.price,
    rating: row.rating,
    reviewCount: row.review_count,
    image: row.image,
    caseColor: row.case_color,
    dialColor: row.dial_color,
    strapType: row.strap_type,
    strapColor: row.strap_color,
    caseSizeMm: row.case_size_mm,
    movement: row.movement,
    caseShape: row.case_shape,
    resistanceM: row.resistance_m,
    gender: row.gender,
    warrantyYears: row.warranty_years,
    description: row.description,
    stockQuantity: row.stock_quantity,
  };
}

productsRouter.get("/", async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ products: data.map(serializeProduct) });
});

productsRouter.get("/:id", async (req, res) => {
  const { data } = await supabaseAdmin.from("products").select("*").eq("id", req.params.id).single();
  if (!data) return res.status(404).json({ error: "Product not found." });
  res.json({ product: serializeProduct(data) });
});
