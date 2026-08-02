import { Router } from "express";
import { db } from "../db.js";

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

productsRouter.get("/", (_req, res) => {
  const rows = db.prepare("SELECT * FROM products ORDER BY created_at DESC").all();
  res.json({ products: rows.map(serializeProduct) });
});

productsRouter.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Product not found." });
  res.json({ product: serializeProduct(row) });
});
