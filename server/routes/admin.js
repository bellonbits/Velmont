import { Router } from "express";
import multer from "multer";
import { requireAdmin } from "../auth.js";
import { supabaseAdmin, PRODUCTS_BUCKET } from "../supabase.js";
import { brands } from "../brands.js";
import { serializeProduct } from "./products.js";

export const adminRouter = Router();
adminRouter.use(requireAdmin);

const upload = multer({
  storage: multer.memoryStorage(),
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

async function uniqueId(brandId, name) {
  const base = slugify(`${brandId}-${name}`) || `product-${Date.now()}`;
  let id = base;
  let n = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data } = await supabaseAdmin.from("products").select("id").eq("id", id).single();
    if (!data) return id;
    id = `${base}-${n}`;
    n += 1;
  }
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

function fieldsToRow(fields) {
  const row = {};
  if (fields.brandId !== undefined) row.brand_id = fields.brandId;
  if (fields.name !== undefined) row.name = fields.name;
  if (fields.price !== undefined) row.price = fields.price;
  if (fields.stockQuantity !== undefined) row.stock_quantity = fields.stockQuantity;
  if (fields.caseColor !== undefined) row.case_color = fields.caseColor;
  if (fields.dialColor !== undefined) row.dial_color = fields.dialColor;
  if (fields.strapType !== undefined) row.strap_type = fields.strapType;
  if (fields.strapColor !== undefined) row.strap_color = fields.strapColor;
  if (fields.caseSizeMm !== undefined) row.case_size_mm = fields.caseSizeMm;
  if (fields.movement !== undefined) row.movement = fields.movement;
  if (fields.caseShape !== undefined) row.case_shape = fields.caseShape;
  if (fields.resistanceM !== undefined) row.resistance_m = fields.resistanceM;
  if (fields.gender !== undefined) row.gender = fields.gender;
  if (fields.warrantyYears !== undefined) row.warranty_years = fields.warrantyYears;
  if (fields.description !== undefined) row.description = fields.description;
  return row;
}

async function uploadProductImage(file) {
  const ext = (file.originalname.match(/\.[a-zA-Z0-9]+$/)?.[0] ?? ".jpg").toLowerCase();
  const path = `product-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
  const { error } = await supabaseAdmin.storage
    .from(PRODUCTS_BUCKET)
    .upload(path, file.buffer, { contentType: file.mimetype });
  if (error) throw error;
  const { data } = supabaseAdmin.storage.from(PRODUCTS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function removeProductImage(imageUrl) {
  if (!imageUrl?.includes(`${PRODUCTS_BUCKET}/`)) return;
  const path = imageUrl.split(`${PRODUCTS_BUCKET}/`).pop();
  if (path) supabaseAdmin.storage.from(PRODUCTS_BUCKET).remove([path]).catch(() => {});
}

adminRouter.post("/products", (req, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    const { errors, fields } = validateFields(req.body, { partial: false });
    if (errors.length > 0) return res.status(400).json({ error: errors[0], errors });

    const id = await uniqueId(fields.brandId, fields.name);
    const image = req.file ? await uploadProductImage(req.file) : null;

    const { data: row, error } = await supabaseAdmin
      .from("products")
      .insert({ id, image, rating: 5.0, review_count: 0, ...fieldsToRow(fields) })
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json({ product: serializeProduct(row) });
  });
});

adminRouter.put("/products/:id", (req, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    const { data: existing } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", req.params.id)
      .single();
    if (!existing) return res.status(404).json({ error: "Product not found." });

    const { errors, fields } = validateFields(req.body, { partial: true });
    if (errors.length > 0) return res.status(400).json({ error: errors[0], errors });

    const update = fieldsToRow(fields);
    if (req.file) {
      update.image = await uploadProductImage(req.file);
      removeProductImage(existing.image);
    }

    const { data: row, error } = await supabaseAdmin
      .from("products")
      .update(update)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });

    res.json({ product: serializeProduct(row) });
  });
});

adminRouter.delete("/products/:id", async (req, res) => {
  const { data: existing } = await supabaseAdmin
    .from("products")
    .select("image")
    .eq("id", req.params.id)
    .single();
  if (!existing) return res.status(404).json({ error: "Product not found." });

  await supabaseAdmin.from("products").delete().eq("id", req.params.id);
  removeProductImage(existing.image);

  res.status(204).end();
});

adminRouter.get("/visitors", async (req, res) => {
  const days = Math.min(Number(req.query.days) || 14, 90);

  const { data, error } = await supabaseAdmin.rpc("get_visitor_stats", { p_days: days });
  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});
