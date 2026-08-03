import { getStockStatus } from "../lib/stock";

export function StockBadge({ quantity }: { quantity: number }) {
  const status = getStockStatus(quantity);

  if (status === "out-of-stock") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-600 dark:text-rose-400">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-600 dark:bg-rose-400" />
        Out of stock
      </span>
    );
  }

  if (status === "low-stock") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
        Only {quantity} left in stock
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
      In stock
    </span>
  );
}
