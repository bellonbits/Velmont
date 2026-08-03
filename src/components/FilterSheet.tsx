import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Brand } from "../data/types";

export interface FilterState {
  brandIds: string[];
  genders: string[];
  movements: string[];
  maxPrice: number | null;
}

export const EMPTY_FILTERS: FilterState = {
  brandIds: [],
  genders: [],
  movements: [],
  maxPrice: null,
};

const GENDERS = ["Men", "Women", "Unisex"] as const;
const MOVEMENTS = ["Quartz", "Automatic"] as const;
const PRICE_OPTIONS = [
  { label: "Any price", value: null },
  { label: "Under KSh 5,000", value: 5000 },
  { label: "Under KSh 15,000", value: 15000 },
  { label: "Under KSh 30,000", value: 30000 },
];

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function FilterSheet({
  open,
  onClose,
  brands,
  filters,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  brands: Brand[];
  filters: FilterState;
  onApply: (filters: FilterState) => void;
}) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-30 bg-black/40"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-40 mx-auto max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white px-5 pb-8 pt-4 dark:bg-neutral-900"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-neutral-200 dark:bg-neutral-700" />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Filters</h2>
              <button
                onClick={() => setDraft(EMPTY_FILTERS)}
                className="text-xs font-semibold text-amber-700 dark:text-amber-500"
              >
                Reset
              </button>
            </div>

            <FilterGroup title="Brand">
              <div className="flex flex-wrap gap-2">
                {brands.map((b) => (
                  <Chip
                    key={b.id}
                    active={draft.brandIds.includes(b.id)}
                    onClick={() => setDraft((d) => ({ ...d, brandIds: toggle(d.brandIds, b.id) }))}
                  >
                    {b.name}
                  </Chip>
                ))}
              </div>
            </FilterGroup>

            <FilterGroup title="Gender">
              <div className="flex flex-wrap gap-2">
                {GENDERS.map((g) => (
                  <Chip
                    key={g}
                    active={draft.genders.includes(g)}
                    onClick={() => setDraft((d) => ({ ...d, genders: toggle(d.genders, g) }))}
                  >
                    {g}
                  </Chip>
                ))}
              </div>
            </FilterGroup>

            <FilterGroup title="Movement">
              <div className="flex flex-wrap gap-2">
                {MOVEMENTS.map((m) => (
                  <Chip
                    key={m}
                    active={draft.movements.includes(m)}
                    onClick={() => setDraft((d) => ({ ...d, movements: toggle(d.movements, m) }))}
                  >
                    {m}
                  </Chip>
                ))}
              </div>
            </FilterGroup>

            <FilterGroup title="Price">
              <div className="flex flex-col gap-2">
                {PRICE_OPTIONS.map((opt) => (
                  <label key={opt.label} className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                    <input
                      type="radio"
                      name="maxPrice"
                      checked={draft.maxPrice === opt.value}
                      onChange={() => setDraft((d) => ({ ...d, maxPrice: opt.value }))}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </FilterGroup>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onApply(draft);
                onClose();
              }}
              className="mt-6 w-full rounded-full bg-neutral-900 py-4 text-sm font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900"
            >
              Show results
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
        {title}
      </p>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-xs font-semibold ${
        active
          ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
          : "border-neutral-200 text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"
      }`}
    >
      {children}
    </button>
  );
}
