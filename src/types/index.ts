export type Role = "super_admin" | "unit_manager" | "staff" | "auditor";

export interface Unit {
  id: string;
  name: string;
  type: "bar" | "supermarket" | "club" | "kitchen" | "football_pitch" | "other";
  address?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  assigned_unit_id?: string; // If null, maybe super admin or unassigned
  avatar_url?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  brand: string;
  category: string;
  price: number;
  cost_price: number;
  stock_quantity: number; // In real app, this might be fetched via a separate relation per unit
  unit_of_measurement: string;
  image_url?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Transaction {
  id: string;
  unit_id: string;
  staff_id: string;
  staff_name: string;
  total_amount: number;
  payment_method: "cash" | "transfer";
  status: "completed" | "pending";
  created_at: string;
  items: CartItem[];
}
