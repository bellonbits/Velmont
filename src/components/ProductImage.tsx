import { WatchGraphic } from "./WatchGraphic";
import type { Product } from "../data/types";

export function ProductImage({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  if (product.image) {
    return (
      <img
        src={product.image}
        alt={product.name}
        className={`object-contain ${className ?? ""}`}
      />
    );
  }

  return (
    <WatchGraphic
      caseColor={product.caseColor}
      dialColor={product.dialColor}
      strapType={product.strapType}
      strapColor={product.strapColor}
      className={className}
    />
  );
}
