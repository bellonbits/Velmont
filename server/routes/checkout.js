import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../auth.js";
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

checkoutRouter.post("/", (req, res) => {
  const { items, locationId } = req.body ?? {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Cart is empty." });
  }

  const resolved = [];
  for (const entry of items) {
    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(entry?.productId);
    const quantity = Number(entry?.quantity);
    if (!product) {
      return res.status(400).json({ error: `Unknown product: ${entry?.productId}` });
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      return res.status(400).json({ error: "Invalid quantity." });
    }
    if (product.stock_quantity < quantity) {
      return res.status(409).json({
        error:
          product.stock_quantity === 0
            ? `${product.name} is out of stock.`
            : `Only ${product.stock_quantity} left of ${product.name}.`,
      });
    }
    resolved.push({ productId: entry.productId, product, quantity });
  }

  if (locationId) {
    const location = db
      .prepare("SELECT id FROM locations WHERE id = ? AND user_id = ?")
      .get(locationId, req.user.id);
    if (!location) {
      return res.status(400).json({ error: "Delivery location not found." });
    }
  }

  const subtotal = resolved.reduce((sum, r) => sum + r.product.price * r.quantity, 0);

  db.exec("BEGIN");
  try {
    const orderInfo = db
      .prepare(
        "INSERT INTO orders (user_id, location_id, subtotal) VALUES (?, ?, ?)",
      )
      .run(req.user.id, locationId ?? null, subtotal);

    const insertItem = db.prepare(
      `INSERT INTO order_items (order_id, product_id, product_name, brand_name, unit_price, quantity)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    const decrementStock = db.prepare(
      "UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?",
    );
    for (const r of resolved) {
      insertItem.run(
        orderInfo.lastInsertRowid,
        r.productId,
        r.product.name,
        getBrandName(r.product.brand_id),
        r.product.price,
        r.quantity,
      );
      decrementStock.run(r.quantity, r.productId);
    }

    db.exec("COMMIT");

    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderInfo.lastInsertRowid);
    const orderItems = db
      .prepare("SELECT * FROM order_items WHERE order_id = ?")
      .all(orderInfo.lastInsertRowid);

    res.status(201).json({ order: serializeOrder(order, orderItems) });
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
});

checkoutRouter.get("/orders", (req, res) => {
  const orders = db
    .prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC")
    .all(req.user.id);

  const withItems = orders.map((order) => {
    const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(order.id);
    return serializeOrder(order, items);
  });

  res.json({ orders: withItems });
});

checkoutRouter.get("/orders/:id", (req, res) => {
  const order = db
    .prepare("SELECT * FROM orders WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user.id);
  if (!order) return res.status(404).json({ error: "Order not found." });

  const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(order.id);
  res.json({ order: serializeOrder(order, items) });
});
