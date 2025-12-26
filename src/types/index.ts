export type Role = "admin" | "manager" | "unit_head" | "staff";

export interface Unit {
  id: string;
  name: string;
  type: "bar" | "supermarket" | "club" | "kitchen" | "football_pitch" | "other";
  address?: string;
}

export interface CreateStaffPayload {
  name: string;
  email: string;
  password: string;
  role: Role;
  is_active: boolean;
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

export interface LoginData {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

export interface AdminStats {
  role: "admin";
  total_users: number;
  total_products: number;
  total_sales_count: number;
  total_revenue: number;
  low_stock_alerts: number;
}

export interface ManagerStats {
  role: "manager" | "unit_head"; // Assuming unit_head shares structure or is mapped to manager
  unit_sales_count: number;
  unit_revenue: number;
  low_stock_alerts: number;
  total_products_in_units: number;
}

export interface StaffStats {
  role: "staff";
  my_sales_count: number;
  my_revenue: number;
  items_sold: number;
}

export type DashboardStats = AdminStats | ManagerStats | StaffStats;
