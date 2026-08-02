import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { db } from "../db.js";
import { requireAdmin } from "../auth.js";
import { brands } from "../brands.js";
import { serializeProduct } from "./products.js";

export const adminRouter = Router();
adminRouter.use(requireAdmin);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const productImagesDir = path.join(__dirname, "..", "uploads", "products");
fs.mkdirSync(productImagesDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: productImagesDir,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
      cb(null, `product-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image uploads are allowed."));
    }
    cb(null, true);
  },
});

const CASE_COLORS = ["silver", "gold", "rosegold", "black"];
const STRAP_TYPES = ["metal", "leather", "silicone"];
const MOVEMENTS = ["Quartz", "Automatic"];
const CASE_SHAPES = ["Round", "Square"];
const GENDERS = ["Men", "Women", "Unisex"];

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function uniqueId(brandId, name) {
  const base = slugify(`${brandId}-${name}`) || `product-${Date.now()}`;
  let id = base;
  let n = 2;
  while (db.prepare("SELECT 1 FROM products WHERE id = ?").get(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  return id;
}

function validateFields(body, { partial } = { partial: false }) {
  const errors = [];
  const f = {};

  const need = (key, ok, message) => {
    if (body[key] === undefined) {
      if (!partial) errors.push(message);
      return;
    }
    if (!ok) errors.push(message);
  };

  if (body.brandId !== undefined) {
    if (!brands.some((b) => b.id === body.brandId)) errors.push("Unknown brand.");
    f.brandId = body.brandId;
  } else if (!partial) errors.push("Brand is required.");

  need("name", typeof body.name === "string" && body.name.trim().length > 0, "Name is required.");
  if (body.name !== undefined) f.name = String(body.name).trim();

  need("price", Number.isFinite(Number(body.price)) && Number(body.price) >= 0, "Valid price is required.");
  if (body.price !== undefined) f.price = Math.round(Number(body.price));

  need(
    "stockQuantity",
    Number.isFinite(Number(body.stockQuantity)) && Number(body.stockQuantity) >= 0,
    "Valid stock quantity is required.",
  );
  if (body.stockQuantity !== undefined) f.stockQuantity = Math.round(Number(body.stockQuantity));

  need("caseColor", CASE_COLORS.includes(body.caseColor), `Case color must be one of ${CASE_COLORS.join(", ")}.`);
  if (body.caseColor !== undefined) f.caseColor = body.caseColor;

  need("dialColor", typeof body.dialColor === "string" && /^#[0-9a-fA-F]{3,6}$/.test(body.dialColor), "Dial color must be a hex value.");
  if (body.dialColor !== undefined) f.dialColor = body.dialColor;

  need("strapType", STRAP_TYPES.includes(body.strapType), `Strap type must be one of ${STRAP_TYPES.join(", ")}.`);
  if (body.strapType !== undefined) f.strapType = body.strapType;

  need("strapColor", typeof body.strapColor === "string" && /^#[0-9a-fA-F]{3,6}$/.test(body.strapColor), "Strap color must be a hex value.");
  if (body.strapColor !== undefined) f.strapColor = body.strapColor;

  need("caseSizeMm", Number.isFinite(Number(body.caseSizeMm)) && Number(body.caseSizeMm) > 0, "Valid case size is required.");
  if (body.caseSizeMm !== undefined) f.caseSizeMm = Math.round(Number(body.caseSizeMm));

  need("movement", MOVEMENTS.includes(body.movement), `Movement must be one of ${MOVEMENTS.join(", ")}.`);
  if (body.movement !== undefined) f.movement = body.movement;

  need("caseShape", CASE_SHAPES.includes(body.caseShape), `Case shape must be one of ${CASE_SHAPES.join(", ")}.`);
  if (body.caseShape !== undefined) f.caseShape = body.caseShape;

  need("resistanceM", Number.isFinite(Number(body.resistanceM)) && Number(body.resistanceM) >= 0, "Valid resistance is required.");
  if (body.resistanceM !== undefined) f.resistanceM = Math.round(Number(body.resistanceM));

  need("gender", GENDERS.includes(body.gender), `Gender must be one of ${GENDERS.join(", ")}.`);
  if (body.gender !== undefined) f.gender = body.gender;

  need("warrantyYears", Number.isFinite(Number(body.warrantyYears)) && Number(body.warrantyYears) >= 0, "Valid warranty is required.");
  if (body.warrantyYears !== undefined) f.warrantyYears = Math.round(Number(body.warrantyYears));

  need("description", typeof body.description === "string" && body.description.trim().length > 0, "Description is required.");
  if (body.description !== undefined) f.description = String(body.description).trim();

  return { errors, fields: f };
}

adminRouter.post("/products", (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });

    const { errors, fields } = validateFields(req.body, { partial: false });
    if (errors.length > 0) return res.status(400).json({ error: errors[0], errors });

    const id = uniqueId(fields.brandId, fields.name);
    const image = req.file ? `/uploads/products/${req.file.filename}` : null;

    db.prepare(
      `INSERT INTO products (
        id, brand_id, name, price, rating, review_count, image, case_color, dial_color,
        strap_type, strap_color, case_size_mm, movement, case_shape, resistance_m,
        gender, warranty_years, description, stock_quantity
      ) VALUES (?, ?, ?, ?, 5.0, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      fields.brandId,
      fields.name,
      fields.price,
      image,
      fields.caseColor,
      fields.dialColor,
      fields.strapType,
      fields.strapColor,
      fields.caseSizeMm,
      fields.movement,
      fields.caseShape,
      fields.resistanceM,
      fields.gender,
      fields.warrantyYears,
      fields.description,
      fields.stockQuantity,
    );

    const row = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
    res.status(201).json({ product: serializeProduct(row) });
  });
});

adminRouter.put("/products/:id", (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });

    const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
    if (!existing) return res.status(404).json({ error: "Product not found." });

    const { errors, fields } = validateFields(req.body, { partial: true });
    if (errors.length > 0) return res.status(400).json({ error: errors[0], errors });

    let image = existing.image;
    if (req.file) {
      image = `/uploads/products/${req.file.filename}`;
      if (existing.image?.startsWith("/uploads/products/")) {
        fs.unlink(path.join(productImagesDir, path.basename(existing.image)), () => {});
      }
    }

    const merged = {
      brandId: fields.brandId ?? existing.brand_id,
      name: fields.name ?? existing.name,
      price: fields.price ?? existing.price,
      caseColor: fields.caseColor ?? existing.case_color,
      dialColor: fields.dialColor ?? existing.dial_color,
      strapType: fields.strapType ?? existing.strap_type,
      strapColor: fields.strapColor ?? existing.strap_color,
      caseSizeMm: fields.caseSizeMm ?? existing.case_size_mm,
      movement: fields.movement ?? existing.movement,
      caseShape: fields.caseShape ?? existing.case_shape,
      resistanceM: fields.resistanceM ?? existing.resistance_m,
      gender: fields.gender ?? existing.gender,
      warrantyYears: fields.warrantyYears ?? existing.warranty_years,
      description: fields.description ?? existing.description,
      stockQuantity: fields.stockQuantity ?? existing.stock_quantity,
    };

    db.prepare(
      `UPDATE products SET
        brand_id = ?, name = ?, price = ?, image = ?, case_color = ?, dial_color = ?,
        strap_type = ?, strap_color = ?, case_size_mm = ?, movement = ?, case_shape = ?,
        resistance_m = ?, gender = ?, warranty_years = ?, description = ?, stock_quantity = ?
      WHERE id = ?`,
    ).run(
      merged.brandId,
      merged.name,
      merged.price,
      image,
      merged.caseColor,
      merged.dialColor,
      merged.strapType,
      merged.strapColor,
      merged.caseSizeMm,
      merged.movement,
      merged.caseShape,
      merged.resistanceM,
      merged.gender,
      merged.warrantyYears,
      merged.description,
      merged.stockQuantity,
      req.params.id,
    );

    const row = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
    res.json({ product: serializeProduct(row) });
  });
});

adminRouter.delete("/products/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Product not found." });

  db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);

  if (existing.image?.startsWith("/uploads/products/")) {
    fs.unlink(path.join(productImagesDir, path.basename(existing.image)), () => {});
  }

  res.status(204).end();
});

adminRouter.get("/visitors", (req, res) => {
  const days = Math.min(Number(req.query.days) || 14, 90);

  const totals = db
    .prepare(
      `SELECT COUNT(*) as totalViews, COUNT(DISTINCT session_id) as uniqueVisitors
       FROM page_views`,
    )
    .get();

  const last24h = db
    .prepare(
      `SELECT COUNT(*) as views, COUNT(DISTINCT session_id) as visitors
       FROM page_views WHERE created_at >= datetime('now', '-1 day')`,
    )
    .get();

  const daily = db
    .prepare(
      `SELECT date(created_at) as day, COUNT(*) as views, COUNT(DISTINCT session_id) as visitors
       FROM page_views
       WHERE created_at >= datetime('now', ?)
       GROUP BY day
       ORDER BY day ASC`,
    )
    .all(`-${days} days`);

  const topPages = db
    .prepare(
      `SELECT path, COUNT(*) as views
       FROM page_views
       WHERE created_at >= datetime('now', ?)
       GROUP BY path
       ORDER BY views DESC
       LIMIT 10`,
    )
    .all(`-${days} days`);

  const recent = db
    .prepare(
      `SELECT page_views.path, page_views.created_at as createdAt, users.name as userName
       FROM page_views
       LEFT JOIN users ON users.id = page_views.user_id
       ORDER BY page_views.created_at DESC
       LIMIT 20`,
    )
    .all();

  res.json({
    totalViews: totals.totalViews,
    uniqueVisitors: totals.uniqueVisitors,
    last24h,
    daily,
    topPages,
    recent,
  });
});
