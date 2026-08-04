import { useRef, useState } from "react";
import { AdminNav } from "../../components/AdminNav";
import { ProductImage } from "../../components/ProductImage";
import { StockBadge } from "../../components/StockBadge";
import { useProducts } from "../../context/ProductsContext";
import { api, ApiError } from "../../lib/api";
import { formatPrice } from "../../lib/format";
import { brands } from "../../data/brands";
import { useSEO } from "../../lib/seo";
import type { Product } from "../../data/types";

const CASE_COLORS = ["silver", "gold", "rosegold", "black"] as const;
const STRAP_TYPES = ["metal", "leather", "silicone"] as const;
const MOVEMENTS = ["Quartz", "Automatic"] as const;
const CASE_SHAPES = ["Round", "Square"] as const;
const GENDERS = ["Men", "Women", "Unisex"] as const;

type FormFields = {
  brandId: string;
  name: string;
  price: string;
  stockQuantity: string;
  caseColor: string;
  dialColor: string;
  strapType: string;
  strapColor: string;
  caseSizeMm: string;
  movement: string;
  caseShape: string;
  resistanceM: string;
  gender: string;
  warrantyYears: string;
  description: string;
};

const emptyForm: FormFields = {
  brandId: brands[0].id,
  name: "",
  price: "",
  stockQuantity: "",
  caseColor: "silver",
  dialColor: "#1a1a1a",
  strapType: "metal",
  strapColor: "#c7ccd1",
  caseSizeMm: "40",
  movement: "Quartz",
  caseShape: "Round",
  resistanceM: "30",
  gender: "Men",
  warrantyYears: "1",
  description: "",
};

function productToForm(p: Product): FormFields {
  return {
    brandId: p.brandId,
    name: p.name,
    price: String(p.price),
    stockQuantity: String(p.stockQuantity),
    caseColor: p.caseColor,
    dialColor: p.dialColor,
    strapType: p.strapType,
    strapColor: p.strapColor,
    caseSizeMm: String(p.caseSizeMm),
    movement: p.movement,
    caseShape: p.caseShape,
    resistanceM: String(p.resistanceM),
    gender: p.gender,
    warrantyYears: String(p.warrantyYears),
    description: p.description,
  };
}

export function AdminInventory() {
  const { products, refresh } = useProducts();
  const [editing, setEditing] = useState<Product | "new" | null>(null);

  useSEO({ title: "Inventory | Velmont Admin", description: "Velmont admin inventory management.", noindex: true });

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this watch? This can't be undone.")) return;
    await api.del(`/admin/products/${id}`);
    await refresh();
  };

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-neutral-950">
      <AdminNav />
      <div className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16 pt-8 md:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 md:text-3xl">Inventory</h1>
          <button
            onClick={() => setEditing("new")}
            className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900"
          >
            + Add Watch
          </button>
        </div>

        {editing && (
          <ProductForm
            key={editing === "new" ? "new" : editing.id}
            product={editing === "new" ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={async () => {
              await refresh();
              setEditing(null);
            }}
          />
        )}

        <div className="mt-6 flex flex-col gap-2">
          {products.map((p) => {
            const brand = brands.find((b) => b.id === p.brandId);
            return (
              <div
                key={p.id}
                className="flex items-center gap-4 rounded-2xl border border-neutral-200 p-3 dark:border-neutral-800"
              >
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-neutral-50 dark:bg-neutral-900">
                  <ProductImage product={p} className="h-full w-full p-1" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                    {brand?.name}
                  </p>
                  <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">{p.name}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{formatPrice(p.price)}</p>
                </div>
                <div className="hidden sm:block">
                  <StockBadge quantity={p.stockQuantity} />
                </div>
                <div className="flex flex-shrink-0 items-center gap-3">
                  <button
                    onClick={() => setEditing(p)}
                    className="text-xs font-semibold text-amber-700 dark:text-amber-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-xs font-semibold text-neutral-400 hover:text-rose-600 dark:text-neutral-500 dark:hover:text-rose-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
          {products.length === 0 && (
            <p className="py-10 text-center text-sm text-neutral-400 dark:text-neutral-500">No watches yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 outline-none dark:border-neutral-700 dark:text-neutral-100";

function ProductForm({
  product,
  onClose,
  onSaved,
}: {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [fields, setFields] = useState<FormFields>(product ? productToForm(product) : emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product?.image ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof FormFields>(key: K, value: FormFields[K]) =>
    setFields((f) => ({ ...f, [key]: value }));

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      formData.append(key, value);
    }
    if (imageFile) formData.append("image", imageFile);

    try {
      if (product) {
        await api.upload(`/admin/products/${product.id}`, formData);
      } else {
        await api.upload("/admin/products", formData);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save watch.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 flex flex-col gap-4 rounded-2xl border border-neutral-200 p-5 dark:border-neutral-800"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {product ? `Edit ${product.name}` : "Add a new watch"}
        </h2>
        <button type="button" onClick={onClose} className="text-xs text-neutral-400 dark:text-neutral-500">
          Cancel
        </button>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900"
        >
          {imagePreview ? (
            <img src={imagePreview} alt="" className="h-full w-full object-contain p-1" />
          ) : (
            <span className="text-xs text-neutral-400 dark:text-neutral-500">No photo</span>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImagePick}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-xs font-semibold text-amber-700 dark:text-amber-500"
        >
          {imagePreview ? "Change photo" : "Upload photo"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Brand">
          <select value={fields.brandId} onChange={(e) => set("brandId", e.target.value)} className={inputClass}>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Name">
          <input required value={fields.name} onChange={(e) => set("name", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Price (KSh)">
          <input
            required
            type="number"
            min={0}
            value={fields.price}
            onChange={(e) => set("price", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Stock quantity">
          <input
            required
            type="number"
            min={0}
            value={fields.stockQuantity}
            onChange={(e) => set("stockQuantity", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Case color">
          <select value={fields.caseColor} onChange={(e) => set("caseColor", e.target.value)} className={inputClass}>
            {CASE_COLORS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Dial color">
          <input
            type="color"
            value={fields.dialColor}
            onChange={(e) => set("dialColor", e.target.value)}
            className="h-9 w-full rounded-lg border border-neutral-200 dark:border-neutral-700"
          />
        </Field>
        <Field label="Strap type">
          <select value={fields.strapType} onChange={(e) => set("strapType", e.target.value)} className={inputClass}>
            {STRAP_TYPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Strap color">
          <input
            type="color"
            value={fields.strapColor}
            onChange={(e) => set("strapColor", e.target.value)}
            className="h-9 w-full rounded-lg border border-neutral-200 dark:border-neutral-700"
          />
        </Field>
        <Field label="Case size (mm)">
          <input
            required
            type="number"
            min={1}
            value={fields.caseSizeMm}
            onChange={(e) => set("caseSizeMm", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Movement">
          <select value={fields.movement} onChange={(e) => set("movement", e.target.value)} className={inputClass}>
            {MOVEMENTS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Case shape">
          <select value={fields.caseShape} onChange={(e) => set("caseShape", e.target.value)} className={inputClass}>
            {CASE_SHAPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Water resistance (m)">
          <input
            required
            type="number"
            min={0}
            value={fields.resistanceM}
            onChange={(e) => set("resistanceM", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Gender">
          <select value={fields.gender} onChange={(e) => set("gender", e.target.value)} className={inputClass}>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Warranty (years)">
          <input
            required
            type="number"
            min={0}
            value={fields.warrantyYears}
            onChange={(e) => set("warrantyYears", e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          required
          rows={3}
          value={fields.description}
          onChange={(e) => set("description", e.target.value)}
          className={inputClass}
        />
      </Field>

      {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-neutral-900 py-3 text-sm font-semibold text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
      >
        {submitting ? "Saving…" : product ? "Save changes" : "Add watch"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {label}
      </span>
      {children}
    </label>
  );
}
