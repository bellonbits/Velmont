import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BottomNav } from "../components/BottomNav";
import { ProductImage } from "../components/ProductImage";
import { useCart } from "../context/CartContext";
import type { CartLine } from "../context/CartContext";
import { formatPrice } from "../lib/format";
import { brands } from "../data/brands";
import { useProducts } from "../context/ProductsContext";
import type { Product } from "../data/types";

export function Cart() {
  const { products } = useProducts();
  const { lines, setQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  const cartLines = lines
    .map((line) => {
      const product = products.find((p) => p.id === line.productId);
      return product ? { line, product } : null;
    })
    .filter((entry): entry is { line: CartLine; product: Product } => entry !== null);

  const subtotal = cartLines.reduce((sum, l) => sum + l.product.price * l.line.quantity, 0);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="mx-auto w-full max-w-md flex-1 px-5 pb-32 pt-8 md:max-w-3xl md:px-8 md:pb-40 md:pt-28">
        <h1 className="text-2xl font-semibold text-neutral-900 md:text-3xl">My Cart</h1>

        {cartLines.length === 0 && (
          <div className="mt-10 flex flex-col items-center gap-2 text-center">
            <p className="text-sm text-neutral-400">Your cart is empty.</p>
            <Link to="/home" className="text-sm font-semibold text-amber-700 underline">
              Browse the collection
            </Link>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {cartLines.map(({ line, product }) => {
              const brand = brands.find((b) => b.id === product.brandId);
              return (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex gap-3 overflow-hidden rounded-2xl bg-neutral-50 p-3"
                >
                  <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                    <ProductImage product={product} className="h-full w-full p-1.5" />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                        {brand?.name}
                      </p>
                      <p className="text-sm font-medium text-neutral-900">{product.name}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setQuantity(product.id, line.quantity - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 text-sm"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-4 text-center text-sm font-medium">{line.quantity}</span>
                        <button
                          onClick={() => setQuantity(product.id, line.quantity + 1)}
                          disabled={line.quantity >= product.stockQuantity}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 text-sm disabled:opacity-30"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-sm font-semibold text-neutral-900">
                        {formatPrice(product.price * line.quantity)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(product.id)}
                    aria-label="Remove item"
                    className="self-start text-xs text-neutral-400 hover:text-rose-600"
                  >
                    ✕
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {cartLines.length > 0 && (
        <div className="fixed inset-x-0 bottom-16 mx-auto w-full max-w-md border-t border-neutral-100 bg-white px-5 py-4 md:bottom-0 md:max-w-3xl md:px-8 md:py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-400">Subtotal</p>
              <p className="text-lg font-semibold text-neutral-900">{formatPrice(subtotal)}</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/checkout")}
              className="rounded-full bg-amber-700 px-8 py-3.5 text-sm font-semibold text-white"
            >
              Checkout
            </motion.button>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}
