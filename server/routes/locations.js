import { Router } from "express";
import { requireAuth } from "../auth.js";
import { supabaseAdmin } from "../supabase.js";

export const locationsRouter = Router();
locationsRouter.use(requireAuth);

function serialize(row) {
  return {
    id: row.id,
    label: row.label,
    addressLine: row.address_line,
    city: row.city,
    country: row.country,
    isDefault: row.is_default,
    lat: row.lat ?? null,
    lng: row.lng ?? null,
  };
}

locationsRouter.get("/", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("locations")
    .select("*")
    .eq("user_id", req.user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ locations: data.map(serialize) });
});

locationsRouter.post("/", async (req, res) => {
  const { label, addressLine, city, country, isDefault, lat, lng } = req.body ?? {};
  if (!label || !addressLine || !city) {
    return res.status(400).json({ error: "Label, address, and city are required." });
  }

  if (isDefault) {
    await supabaseAdmin.from("locations").update({ is_default: false }).eq("user_id", req.user.id);
  }

  const { data, error } = await supabaseAdmin
    .from("locations")
    .insert({
      user_id: req.user.id,
      label,
      address_line: addressLine,
      city,
      country: country || "Kenya",
      is_default: Boolean(isDefault),
      lat: typeof lat === "number" ? lat : null,
      lng: typeof lng === "number" ? lng : null,
    })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });

  res.status(201).json({ location: serialize(data) });
});

locationsRouter.put("/:id", async (req, res) => {
  const { data: existing } = await supabaseAdmin
    .from("locations")
    .select("*")
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .single();
  if (!existing) return res.status(404).json({ error: "Location not found." });

  const { label, addressLine, city, country, isDefault, lat, lng } = req.body ?? {};

  if (isDefault) {
    await supabaseAdmin.from("locations").update({ is_default: false }).eq("user_id", req.user.id);
  }

  const { data, error } = await supabaseAdmin
    .from("locations")
    .update({
      label: label ?? existing.label,
      address_line: addressLine ?? existing.address_line,
      city: city ?? existing.city,
      country: country ?? existing.country,
      is_default: isDefault ? true : existing.is_default,
      lat: typeof lat === "number" ? lat : existing.lat,
      lng: typeof lng === "number" ? lng : existing.lng,
    })
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });

  res.json({ location: serialize(data) });
});

locationsRouter.delete("/:id", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("locations")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .select();
  if (error) return res.status(400).json({ error: error.message });
  if (data.length === 0) return res.status(404).json({ error: "Location not found." });
  res.status(204).end();
});
