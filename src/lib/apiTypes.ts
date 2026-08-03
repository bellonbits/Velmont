export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  isAdmin: boolean;
  securityQuestion: string | null;
}

export interface Location {
  id: number;
  label: string;
  addressLine: string;
  city: string;
  country: string;
  isDefault: boolean;
  lat: number | null;
  lng: number | null;
}

export interface OrderItem {
  productId: string;
  name: string;
  brand: string;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: number;
  status: string;
  subtotal: number;
  createdAt: string;
  locationId: number | null;
  items: OrderItem[];
}
