import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BottomNav } from "../components/BottomNav";
import { ThemeToggle } from "../components/ThemeToggle";
import { ProductImage } from "../components/ProductImage";
import { api } from "../lib/api";
import { formatPrice } from "../lib/format";
import { brands } from "../data/brands";
import { useProducts } from "../context/ProductsContext";

export function Favourites() {
  const { products } = useProducts();
  const [productIds, setProductIds] = useState<string[] | null>(null);

  useEffect(() => {
    api.get<{ productIds: string[] }>("/favorites").then((res) => setProductIds(res.productIds));
  }, []);

  const handleRemove = async (productId: string) => {
    setProductIds((prev) => prev?.filter((id) => id !== productId) ?? prev);
    await api.del(`/favorites/${productId}`);
  };

  const favouriteProducts = (productIds ?? [])
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-md flex-1 px-5 pb-6 pt-8 md:max-w-5xl md:px-8 md:pt-28">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 md:text-3xl">My Favourites</h1>
          <ThemeToggle className="md:hidden" />
        </div>

        {productIds === null && (
          <p className="mt-10 text-center text-sm text-neutral-400 dark:text-neutral-500">Loading…</p>
        )}

        {productIds !== null && favouriteProducts.length === 0 && (
          <div className="mt-10 flex flex-col items-center gap-2 text-center">
            <p className="text-sm text-neutral-400 dark:text-neutral-500">You haven't favourited any watches yet.</p>
            <Link to="/home" className="text-sm font-semibold text-amber-700 underline dark:text-amber-500">
              Browse the collection
            </Link>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {favouriteProducts.map((p) => {
            const brand = brands.find((b) => b.id === p.brandId);
            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative rounded-2xl bg-neutral-50 p-3 dark:bg-neutral-900"
              >
                <button
                  onClick={() => handleRemove(p.id)}
                  aria-label="Remove from favourites"
                  className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-rose-500 shadow dark:bg-neutral-800 dark:text-rose-400"
                >
                  <HeartIcon />
                </button>
                <Link to={`/product/${p.id}`} className="block">
                  <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-white dark:bg-neutral-800">
                    <ProductImage product={p} className="h-full w-full p-2" />
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
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

function HeartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={1.8}>
      <path d="M12 20s-7-4.35-9.5-8.6C.9 8.1 2.2 4.5 5.7 4A4.9 4.9 0 0 1 12 7a4.9 4.9 0 0 1 6.3-3c3.5.5 4.8 4.1 3.2 7.4C19 15.65 12 20 12 20Z" strokeLinejoin="round" />
    </svg>
  );
}
