import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ProductImage } from "../components/ProductImage";
import { StarRating } from "../components/StarRating";
import { StockBadge } from "../components/StockBadge";
import { brands } from "../data/brands";
import { formatPrice } from "../lib/format";
import { getStockStatus } from "../lib/stock";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useProducts } from "../context/ProductsContext";
import { api } from "../lib/api";

export function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { getProduct, loading } = useProducts();
  const product = id ? getProduct(id) : undefined;
  const [favourited, setFavourited] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!user || !product) {
      setFavourited(false);
      return;
    }
    api
      .get<{ productIds: string[] }>("/favorites")
      .then((res) => setFavourited(res.productIds.includes(product.id)))
      .catch(() => setFavourited(false));
  }, [user, product]);

  const toggleFavourite = async () => {
    if (!product) return;
    if (!user) {
      navigate(`/signin?next=/product/${product.id}`);
      return;
    }
    const next = !favourited;
    setFavourited(next);
    if (next) {
      await api.post("/favorites", { productId: product.id });
    } else {
      await api.del(`/favorites/${product.id}`);
    }
  };

  const handleAddToCart = () => {
    if (!product || product.stockQuantity === 0) return;
    addItem(product.id);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  if (!product) {
    if (loading) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-white">
          <p className="text-sm text-neutral-400">Loading…</p>
        </div>
      );
    }
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-neutral-500">We couldn't find that watch.</p>
        <Link to="/home" className="text-sm font-semibold underline">
          Back to collection
        </Link>
      </div>
    );
  }

  const brand = brands.find((b) => b.id === product.brandId);
  const stockStatus = getStockStatus(product.stockQuantity);
  const outOfStock = stockStatus === "out-of-stock";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex min-h-screen flex-col bg-white"
    >
      <div className="mx-auto w-full max-w-md flex-1 md:max-w-5xl md:px-8 md:pb-16 md:pt-28">
        <div className="flex items-center px-5 pt-6 md:px-0 md:pt-0">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100"
          >
            <BackIcon />
          </motion.button>
        </div>

        <div className="md:mt-6 md:grid md:grid-cols-2 md:gap-12 md:items-start">
          <div className="relative mt-2 px-10 md:sticky md:top-28 md:mt-0 md:px-0">
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <ProductImage product={product} className="mx-auto h-80 w-auto md:h-[26rem]" />
            </motion.div>
            <motion.button
              whileTap={{ scale: 0.85 }}
              animate={favourited ? { scale: [1, 1.25, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
              onClick={toggleFavourite}
              aria-label="Add to favourites"
              className={`absolute right-6 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full shadow-md ${
                favourited ? "bg-rose-500 text-white" : "bg-white text-neutral-400"
              }`}
            >
              <HeartIcon filled={favourited} />
            </motion.button>
            <div className="mt-4 flex justify-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-neutral-900" : "bg-neutral-200"}`}
                />
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
            className="mt-4 rounded-t-3xl bg-white px-5 pb-32 pt-5 md:mt-0 md:rounded-none md:px-0 md:pb-0"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              {brand?.name}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-neutral-900 md:text-3xl">{product.name}</h1>
            <div className="mt-2">
              <StarRating rating={product.rating} count={product.reviewCount} />
            </div>
            <div className="mt-2">
              <StockBadge quantity={product.stockQuantity} />
            </div>

            <div className="mt-6 grid grid-cols-3 gap-y-5">
              <Spec label="Movement" value={product.movement} />
              <Spec label="Case Shape" value={product.caseShape} />
              <Spec label="Case Size" value={`${product.caseSizeMm} mm`} />
              <Spec label="Resistance" value={`${product.resistanceM} m`} />
              <Spec label="Gender" value={product.gender} />
              <Spec
                label="Warranty"
                value={`${product.warrantyYears} year${product.warrantyYears === 1 ? "" : "s"}`}
              />
            </div>

            <p className="mt-6 text-sm leading-relaxed text-neutral-500">
              {product.description}
            </p>

            <div className="mt-8 hidden items-center gap-4 md:flex">
              <div>
                <p className="text-xs text-neutral-400">Price for 1</p>
                <p className="text-2xl font-semibold text-neutral-900">
                  {formatPrice(product.price)}
                </p>
              </div>
              <motion.button
                whileTap={{ scale: outOfStock ? 1 : 0.97 }}
                onClick={handleAddToCart}
                disabled={outOfStock}
                className="flex-1 rounded-full bg-amber-700 py-4 text-sm font-semibold text-white transition hover:bg-amber-800 disabled:bg-neutral-200 disabled:text-neutral-400"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={outOfStock ? "oos" : added ? "added" : "add"}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="inline-block"
                  >
                    {outOfStock ? "Out of stock" : added ? "Added ✓" : "Add to cart"}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-md border-t border-neutral-100 bg-white px-5 py-4 md:hidden">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs text-neutral-400">Price for 1</p>
            <p className="text-lg font-semibold text-neutral-900">
              {formatPrice(product.price)}
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleAddToCart}
            className="flex-1 rounded-full bg-amber-700 py-4 text-sm font-semibold text-white transition hover:bg-amber-800"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={added ? "added" : "add"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="inline-block"
              >
                {added ? "Added ✓" : "Add to cart"}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-neutral-900">{value}</p>
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="m14 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8}>
      <path d="M12 20s-7-4.35-9.5-8.6C.9 8.1 2.2 4.5 5.7 4A4.9 4.9 0 0 1 12 7a4.9 4.9 0 0 1 6.3-3c3.5.5 4.8 4.1 3.2 7.4C19 15.65 12 20 12 20Z" strokeLinejoin="round" />
    </svg>
  );
}
