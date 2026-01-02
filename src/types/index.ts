export type Role = "admin" | "stockist" | "manager" | "unit_head" | "staff";

export type AuditLogAction =
  | "stock_added"
  | "stock_updated"
  | "product_created"
  | "product_updated"
  | "stock_request_approved"
  | "inventory_updated"
  | "inventory_transfer";

export interface Unit {
  id: number;
  name: string;
  type?: string;
  address?: string;
  users?: User[];
  pivot?: {
    user_id: number;
    unit_id: number;
  };
}

export interface Category {
  id: number;
  name: string;
  image?: string | null;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Brand {
  id: number;
  name: string;
  image?: string | null;
  image_path?: string | null;
  image_url?: string | null;
  category_id?: number | null;
  items_per_set?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateStaffPayload {
  name: string;
  email: string;
  password: string;
  role: Role;
  is_active: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  assigned_unit_id?: number | null;
  units?: Unit[];
  avatar_url?: string;
  pivot?: {
    unit_id: number;
    user_id: number;
  };
}

export interface Product {
  id: string | number;
  name: string;
  sku: string;
  barcode?: string;
  size?: string;
  brand?: string | Brand; // Can be string or nested Brand object from API
  brand_id?: number;
  category?: string | Category; // Can be string or nested Category object from API
  category_id?: number;
  price?: number; // selling_price - made optional since API might use selling_price
  selling_price?: number;
  cost_price?: number;
  stock_quantity?: number;
  unit_of_measurement?: string;
  image_url?: string;
  trackable?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export type PaymentMethod = "cash" | "pos" | "transfer" | "monnify";
export type PaymentStatus = "paid" | "completed" | "pending";

export interface VirtualAccountDetails {
  accountNumber: string;
  bankName: string;
  bankCode?: string;
  invoiceReference?: string;
  amount: number;
  expiresOn?: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: string | number;
  total_price: string | number;
  product?: Product;
  created_at?: string;
  updated_at?: string;
}

export interface Sale {
  id: string | number;
  unit_id: string | number;
  user_id?: string | number;
  invoice_number?: string;
  // Legacy fields for backward compatibility
  staff_id?: string | number;
  staff_name?: string;
  user?: User;
  unit?: Unit;
  total_amount: number | string;
  payment_method: PaymentMethod;
  payment_status?: PaymentStatus;
  status?: PaymentStatus; // Alias for payment_status
  transaction_reference?: string | null;
  payment_data?: {
    checkoutUrl?: string;
    [key: string]: any;
  };
  account_details?: VirtualAccountDetails;
  created_at: string;
  updated_at?: string;
  // Support both item formats
  items?: CartItem[];
  sale_items?: SaleItem[];
}

export type Transaction = Sale;

// Pagination types
export interface PaginationLink {
  url: string | null;
  label: string;
  page: number | null;
  active: boolean;
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  links: PaginationLink[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
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

export interface StockistStats {
  role: "stockist";
  total_central_stock: number;
  total_products_in_stock: number;
  low_stock_alerts: number;
  pending_requests: number;
}

export interface ManagerStats {
  role: "manager" | "unit_head";
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

export type DashboardStats =
  | AdminStats
  | StockistStats
  | ManagerStats
  | StaffStats;

// Central Stock types
export interface Stock {
  id: number;
  product_id: number;
  product?: Product;
  quantity: number;
  low_stock_threshold: number;
  batch_number?: string;
  created_at?: string;
  updated_at?: string;
}

export type StockRequestStatus = "pending" | "approved" | "rejected";

export interface StockRequest {
  id: number;
  unit_id: number;
  unit?: Unit;
  product_id: number;
  product?: Product;
  quantity: number;
  status: StockRequestStatus;
  notes?: string;
  requested_by?: User;
  approved_by?: User;
  created_at: string;
  updated_at?: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  user?: User;
  action: AuditLogAction;
  resource_type: "stock" | "product" | "stockRequest" | "inventory";
  resource_id: number;
  old_values?: any;
  new_values?: any;
  description?: string;
  info?: string; // Adding this since user is using it in UI
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface InventoryItem {
  id: number;
  unit_id: number;
  product_id: number;
  quantity: number;
  low_stock_threshold: number;
  product: Product;
  created_at: string;
  updated_at: string;
  brand?: Brand;
  category?: Category;
}

// Facility types
export type FacilityType = "pitch" | "event_hall" | "court" | "conference_room";
export type BookingStatus = "pending" | "confirmed" | "cancelled";

export interface Facility {
  id: number;
  name: string;
  type: FacilityType;
  description?: string;
  hourly_rate: number;
  capacity?: number;
  unit_id: number;
  unit?: Unit;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FacilityBooking {
  id: number;
  facility_id: number;
  facility?: Facility;
  booking_reference: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_amount: number | string;
  status: BookingStatus;
  payment_method: PaymentMethod;
  notes?: string;
  sale_id?: number;
  sale?: Sale;
  created_by?: User;
  created_at?: string;
  updated_at?: string;
}
