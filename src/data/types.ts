export type CaseColor = "silver" | "gold" | "rosegold" | "black";
export type StrapType = "metal" | "leather" | "silicone";

export interface Brand {
  id: string;
  name: string;
  tier: "popular" | "standard";
}

export interface Product {
  id: string;
  brandId: string;
  name: string;
  price: number;
  rating: number;
  reviewCount: number;
  /** Real product photo path. Falls back to the illustrated WatchGraphic when absent. */
  image?: string | null;
  caseColor: CaseColor;
  dialColor: string;
  strapType: StrapType;
  strapColor: string;
  caseSizeMm: number;
  movement: "Quartz" | "Automatic";
  caseShape: "Round" | "Square";
  resistanceM: number;
  gender: "Men" | "Women" | "Unisex";
  warrantyYears: number;
  description: string;
  stockQuantity: number;
}
