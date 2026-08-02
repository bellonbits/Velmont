// Mirrors src/data/brands.ts ids/names. Brands aren't admin-editable yet —
// this is just the fixed list products.brand_id is validated against.
export const brands = [
  { id: "casio", name: "Casio" },
  { id: "gshock", name: "G-Shock" },
  { id: "seiko", name: "Seiko" },
  { id: "citizen", name: "Citizen" },
  { id: "benyar", name: "Benyar" },
  { id: "naviforce", name: "Naviforce" },
  { id: "curren", name: "Curren" },
  { id: "lige", name: "LIGE" },
  { id: "skmei", name: "SKMEI" },
  { id: "olevs", name: "OLEVS" },
];

export function getBrandName(id) {
  return brands.find((b) => b.id === id)?.name ?? id;
}
