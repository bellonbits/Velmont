import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../auth.js";

export const locationsRouter = Router();
locationsRouter.use(requireAuth);

function serialize(row) {
  return {
    id: row.id,
    label: row.label,
    addressLine: row.address_line,
    city: row.city,
    country: row.country,
    isDefault: Boolean(row.is_default),
    lat: row.lat ?? null,
    lng: row.lng ?? null,
  };
}

locationsRouter.get("/", (req, res) => {
  const rows = db
    .prepare("SELECT * FROM locations WHERE user_id = ? ORDER BY is_default DESC, created_at DESC")
    .all(req.user.id);
  res.json({ locations: rows.map(serialize) });
});

locationsRouter.post("/", (req, res) => {
  const { label, addressLine, city, country, isDefault, lat, lng } = req.body ?? {};
  if (!label || !addressLine || !city) {
    return res.status(400).json({ error: "Label, address, and city are required." });
  }

  if (isDefault) {
    db.prepare("UPDATE locations SET is_default = 0 WHERE user_id = ?").run(req.user.id);
  }

  const info = db
    .prepare(
      `INSERT INTO locations (user_id, label, address_line, city, country, is_default, lat, lng)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      req.user.id,
      label,
      addressLine,
      city,
      country || "Kenya",
      isDefault ? 1 : 0,
      typeof lat === "number" ? lat : null,
      typeof lng === "number" ? lng : null,
    );

  const row = db.prepare("SELECT * FROM locations WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json({ location: serialize(row) });
});

locationsRouter.put("/:id", (req, res) => {
  const existing = db
    .prepare("SELECT * FROM locations WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: "Location not found." });

  const { label, addressLine, city, country, isDefault, lat, lng } = req.body ?? {};

  if (isDefault) {
    db.prepare("UPDATE locations SET is_default = 0 WHERE user_id = ?").run(req.user.id);
  }

  db.prepare(
    `UPDATE locations SET label = ?, address_line = ?, city = ?, country = ?, is_default = ?, lat = ?, lng = ?
     WHERE id = ? AND user_id = ?`,
  ).run(
    label ?? existing.label,
    addressLine ?? existing.address_line,
    city ?? existing.city,
    country ?? existing.country,
    isDefault ? 1 : existing.is_default,
    typeof lat === "number" ? lat : existing.lat,
    typeof lng === "number" ? lng : existing.lng,
    req.params.id,
    req.user.id,
  );

  const row = db.prepare("SELECT * FROM locations WHERE id = ?").get(req.params.id);
  res.json({ location: serialize(row) });
});

locationsRouter.delete("/:id", (req, res) => {
  const info = db
    .prepare("DELETE FROM locations WHERE id = ? AND user_id = ?")
    .run(req.params.id, req.user.id);
  if (info.changes === 0) return res.status(404).json({ error: "Location not found." });
  res.status(204).end();
});
