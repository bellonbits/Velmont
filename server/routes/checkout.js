import { Router } from "express";
import { requireAuth } from "../auth.js";
import { supabaseAdmin } from "../supabase.js";
import { getBrandName } from "../brands.js";

export const checkoutRouter = Router();
checkoutRouter.use(requireAuth);

function serializeOrder(order, items) {
  return {
    id: order.id,
    status: order.status,
    subtotal: order.subtotal,
    createdAt: order.created_at,
    locationId: order.location_id,
    items: items.map((i) => ({
      productId: i.product_id,
      name: i.product_name,
      brand: i.brand_name,
      unitPrice: i.unit_price,
      quantity: i.quantity,
    })),
  };
}

checkoutRouter.post("/", async (req, res) => {
  const { items, locationId } = req.body ?? {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Cart is empty." });
  }
  for (const entry of items) {
    const quantity = Number(entry?.quantity);
    if (!entry?.productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      return res.status(400).json({ error: "Invalid cart item." });
    }
  }

  if (locationId) {
    const { data: location } = await supabaseAdmin
      .from("locations")
      .select("id")
      .eq("id", locationId)
      .eq("user_id", req.user.id)
      .single();
    if (!location) {
      return res.status(400).json({ error: "Delivery location not found." });
    }
  }

  const { data: products } = await supabaseAdmin
    .from("products")
    .select("id, brand_id")
    .in(
      "id",
      items.map((i) => i.productId),
    );
  const brandById = new Map((products ?? []).map((p) => [p.id, getBrandName(p.brand_id)]));

  const payload = items.map((i) => ({
    productId: i.productId,
    quantity: Number(i.quantity),
    brandName: brandById.get(i.productId) ?? "",
  }));

  const { data: orderId, error } = await supabaseAdmin.rpc("create_order", {
    p_user_id: req.user.id,
    p_location_id: locationId ?? null,
    p_items: payload,
  });

  if (error) {
    const status = /is out of stock|left of/.test(error.message) ? 409 : 400;
    return res.status(status).json({ error: error.message });
  }

  const { data: order } = await supabaseAdmin.from("orders").select("*").eq("id", orderId).single();
  const { data: orderItems } = await supabaseAdmin
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);

  res.status(201).json({ order: serializeOrder(order, orderItems) });
});

checkoutRouter.get("/orders", async (req, res) => {
  const { data: orders, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });

  const withItems = await Promise.all(
    orders.map(async (order) => {
      const { data: items } = await supabaseAdmin
        .from("order_items")
        .select("*")
        .eq("order_id", order.id);
      return serializeOrder(order, items ?? []);
    }),
  );

  res.json({ orders: withItems });
});

checkoutRouter.get("/orders/:id", async (req, res) => {
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .single();
  if (!order) return res.status(404).json({ error: "Order not found." });

  const { data: items } = await supabaseAdmin
    .from("order_items")
    .select("*")
    .eq("order_id", order.id);
  res.json({ order: serializeOrder(order, items ?? []) });
});
