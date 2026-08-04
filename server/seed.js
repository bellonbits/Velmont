import { supabaseAdmin } from "./supabase.js";
import { seedProducts } from "./seedData.js";

export async function seedProductsIfEmpty() {
  const { count } = await supabaseAdmin.from("products").select("*", { count: "exact", head: true });
  if (count > 0) return;

  const rows = seedProducts.map((p) => ({
    id: p.id,
    brand_id: p.brandId,
    name: p.name,
    price: p.price,
    rating: p.rating,
    review_count: p.reviewCount,
    image: p.image,
    case_color: p.caseColor,
    dial_color: p.dialColor,
    strap_type: p.strapType,
    strap_color: p.strapColor,
    case_size_mm: p.caseSizeMm,
    movement: p.movement,
    case_shape: p.caseShape,
    resistance_m: p.resistanceM,
    gender: p.gender,
    warranty_years: p.warrantyYears,
    description: p.description,
    stock_quantity: p.stock,
  }));

  const { error } = await supabaseAdmin.from("products").insert(rows);
  if (error) {
    console.error("Failed to seed products:", error.message);
    return;
  }

  console.log(`Seeded ${seedProducts.length} products.`);
}
