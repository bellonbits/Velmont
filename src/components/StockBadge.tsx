import { getStockStatus } from "../lib/stock";

export function StockBadge({ quantity }: { quantity: number }) {
  const status = getStockStatus(quantity);

  if (status === "out-of-stock") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-600">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
        Out of stock
      </span>
    );
  }

  if (status === "low-stock") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
        Only {quantity} left in stock
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
      In stock
    </span>
  );
}
