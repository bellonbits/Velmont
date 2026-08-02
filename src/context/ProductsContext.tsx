import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api } from "../lib/api";
import type { Product } from "../data/types";

interface ProductsContextValue {
  products: Product[];
  loading: boolean;
  getProduct: (id: string) => Product | undefined;
  refresh: () => Promise<void>;
}

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await api.get<{ products: Product[] }>("/products");
    setProducts(res.products);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const getProduct = useCallback((id: string) => products.find((p) => p.id === id), [products]);

  return (
    <ProductsContext.Provider value={{ products, loading, getProduct, refresh }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts must be used within ProductsProvider");
  return ctx;
}
