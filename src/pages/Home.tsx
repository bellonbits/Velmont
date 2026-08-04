import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ProductImage } from "../components/ProductImage";
import { BottomNav } from "../components/BottomNav";
import { ThemeToggle } from "../components/ThemeToggle";
import { FilterSheet, EMPTY_FILTERS } from "../components/FilterSheet";
import type { FilterState } from "../components/FilterSheet";
import { brands } from "../data/brands";
import { formatPrice } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductsContext";
import { api } from "../lib/api";
import { useSEO, SITE_URL } from "../lib/seo";
import type { Location } from "../lib/apiTypes";

const grid = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const cell = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
} as const;

export function Home() {
  const { user } = useAuth();
  const { products } = useProducts();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [defaultLocation, setDefaultLocation] = useState<Location | null>(null);

  useEffect(() => {
    if (!user) {
      setDefaultLocation(null);
      return;
    }
    api
      .get<{ locations: Location[] }>("/locations")
      .then((res) => setDefaultLocation(res.locations.find((l) => l.isDefault) ?? res.locations[0] ?? null))
      .catch(() => setDefaultLocation(null));
  }, [user]);

  const popularBrands = brands.filter((b) => b.tier === "popular");
  const activeFilterCount =
    filters.brandIds.length +
    filters.genders.length +
    filters.movements.length +
    (filters.maxPrice ? 1 : 0);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const brand = brands.find((b) => b.id === p.brandId);
      const matchesBrand = filters.brandIds.length === 0 || filters.brandIds.includes(p.brandId);
      const matchesGender = filters.genders.length === 0 || filters.genders.includes(p.gender);
      const matchesMovement =
        filters.movements.length === 0 || filters.movements.includes(p.movement);
      const matchesPrice = filters.maxPrice === null || p.price <= filters.maxPrice;
      const matchesQuery =
        !query.trim() ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        brand?.name.toLowerCase().includes(query.toLowerCase());
      return matchesBrand && matchesGender && matchesMovement && matchesPrice && matchesQuery;
    });
  }, [query, filters, products]);

  useSEO({
    title: "Shop All Watches — Men's, Women's & Unisex, from KSh 2,400 | Velmont Kenya",
    description:
      "Browse genuine watches from Casio, G-Shock, Seiko, Citizen and more. Affordable prices, real stock, and delivery across Kenya.",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: filtered.slice(0, 24).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/product/${p.id}`,
        name: p.name,
      })),
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-md flex-1 px-5 pb-6 pt-8 md:max-w-5xl md:px-8 md:pt-28">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {user ? `Welcome back, ${user.name.split(" ")[0]}!` : "Welcome to Velmont!"}
            </p>
            {user ? (
              defaultLocation ? (
                <p className="mt-1 flex items-center gap-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  <PinIcon />
                  {defaultLocation.addressLine}, {defaultLocation.city}
                </p>
              ) : (
                <Link
                  to="/account"
                  className="mt-1 flex items-center gap-1 text-sm font-medium text-amber-700 dark:text-amber-500"
                >
                  <PinIcon />
                  Add a delivery location
                </Link>
              )
            ) : (
              <Link
                to="/signin"
                className="mt-1 flex items-center gap-1 text-sm font-medium text-amber-700 dark:text-amber-500"
              >
                <PinIcon />
                Sign in for faster checkout
              </Link>
            )}
          </div>
          <div className="flex flex-shrink-0 items-center gap-2 md:hidden">
            <ThemeToggle />
            <Link
              to={user ? "/account" : "/signin"}
              className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700"
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-neutral-500 dark:text-neutral-300">
                  {user ? user.name[0]?.toUpperCase() : <PersonIcon />}
                </div>
              )}
            </Link>
          </div>
        </div>

        <h1 className="mt-6 text-2xl font-semibold leading-snug text-neutral-900 dark:text-neutral-100 md:text-3xl">
          Choose from {brands.length} trusted watch brands
        </h1>

        <div className="mt-5 flex items-center gap-2 md:max-w-xl">
          <div className="flex flex-1 items-center gap-2 rounded-full border border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <SearchIcon />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Try "Meridian"'
              className="w-full bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-neutral-100 dark:placeholder:text-neutral-500"
            />
          </div>
          <button
            aria-label="Filters"
            onClick={() => setFilterOpen(true)}
            className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-800"
          >
            <FilterIcon />
            {activeFilterCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-700 px-1 text-[9px] font-semibold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <FilterSheet
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          brands={brands}
          filters={filters}
          onApply={setFilters}
        />

        <p className="mt-6 text-xs font-semibold tracking-wide text-neutral-400 dark:text-neutral-500">
          POPULAR BRANDS
        </p>
        <motion.div
          variants={grid}
          initial="hidden"
          animate="show"
          className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {popularBrands.map((b) => {
            const active = filters.brandIds.includes(b.id);
            return (
              <motion.button
                key={b.id}
                variants={cell}
                whileTap={{ scale: 0.96 }}
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    brandIds: active
                      ? f.brandIds.filter((id) => id !== b.id)
                      : [...f.brandIds, b.id],
                  }))
                }
                className={`rounded-xl border px-4 py-4 text-center text-sm font-bold tracking-wide transition ${
                  active
                    ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                    : "border-neutral-200 text-neutral-800 hover:border-neutral-400 dark:border-neutral-800 dark:text-neutral-200 dark:hover:border-neutral-600"
                }`}
              >
                {b.name.toUpperCase()}
              </motion.button>
            );
          })}
        </motion.div>

        <motion.div
          key={JSON.stringify(filters) + query}
          variants={grid}
          initial="hidden"
          animate="show"
          className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
        >
          {filtered.map((p) => {
            const brand = brands.find((b) => b.id === p.brandId);
            return (
              <motion.div key={p.id} variants={cell} whileTap={{ scale: 0.97 }}>
                <Link
                  to={`/product/${p.id}`}
                  className="group block rounded-2xl bg-neutral-50 p-3 transition hover:bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                >
                  <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-white dark:bg-neutral-800">
                    <ProductImage
                      product={p}
                      className={`h-full w-full p-2 ${p.stockQuantity === 0 ? "opacity-40" : ""}`}
                    />
                    {p.stockQuantity === 0 && (
                      <span className="absolute left-2 top-2 rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900">
                        Out of stock
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                    {brand?.name}
                  </p>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{p.name}</p>
                  <p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {formatPrice(p.price)}
                  </p>
                </Link>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-2 py-10 text-center text-sm text-neutral-400 dark:text-neutral-500">
              No watches match your search.
            </p>
          )}
        </motion.div>
      </div>
      <BottomNav />
    </div>
  );
}

function PersonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" strokeLinejoin="round" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
    </svg>
  );
}
