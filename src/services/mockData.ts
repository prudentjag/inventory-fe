import type { Product, Unit, User, Transaction } from "../types";

// Mock Data
export const MOCK_UNITS: Unit[] = [
  { id: "u1", name: "Main Bar", type: "bar", address: "Ground Floor" },
  { id: "u2", name: "VIP Lounge", type: "club", address: "Rooftop" },
  { id: "u3", name: "Mini Mart", type: "supermarket", address: "Entrance" },
];

export const MOCK_USERS: User[] = [
  {
    id: "usr1",
    name: "Admin User",
    email: "admin@system.com",
    role: "super_admin",
  },
  {
    id: "usr2",
    name: "John Barman",
    email: "john@bar.com",
    role: "staff",
    assigned_unit_id: "u1",
  },
  {
    id: "usr3",
    name: "Sarah Manager",
    email: "sarah@vip.com",
    role: "unit_manager",
    assigned_unit_id: "u2",
  },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Heineken 33cl",
    sku: "HEIN-33",
    brand: "Heineken",
    category: "Beer",
    price: 1500,
    cost_price: 1200,
    stock_quantity: 150,
    unit_of_measurement: "bottle",
  },
  {
    id: "p2",
    name: "Coke 50cl",
    sku: "COKE-50",
    brand: "Coca Cola",
    category: "Soft Drink",
    price: 500,
    cost_price: 350,
    stock_quantity: 300,
    unit_of_measurement: "bottle",
  },
  {
    id: "p3",
    name: "Hennessy VSOP",
    sku: "HEN-VSOP",
    brand: "Hennessy",
    category: "Cognac",
    price: 85000,
    cost_price: 70000,
    stock_quantity: 12,
    unit_of_measurement: "bottle",
  },
];
// Mock Transactions
export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "txn1",
    unit_id: "u1",
    staff_id: "usr2",
    staff_name: "John Barman",
    total_amount: 3000,
    payment_method: "cash",
    status: "completed",
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    items: [{ ...MOCK_PRODUCTS[0], quantity: 2 }],
  },
  {
    id: "txn2",
    unit_id: "u1",
    staff_id: "usr2",
    staff_name: "John Barman",
    total_amount: 7500,
    payment_method: "transfer",
    status: "completed",
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    items: [{ ...MOCK_PRODUCTS[0], quantity: 5 }],
  },
  {
    id: "txn3",
    unit_id: "u2",
    staff_id: "usr3",
    staff_name: "Sarah Manager",
    total_amount: 85000,
    payment_method: "transfer",
    status: "completed",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    items: [{ ...MOCK_PRODUCTS[2], quantity: 1 }],
  },
];

// Service Fns (Simulating Async API calls)
export const mockApiService = {
  getUnits: async (): Promise<Unit[]> => {
    return new Promise((resolve) => setTimeout(() => resolve(MOCK_UNITS), 600));
  },

  getProducts: async (unitId: string): Promise<Product[]> => {
    // In real app, filter by unitId
    console.log(`Fetching products for unit: ${unitId}`);
    return new Promise((resolve) =>
      setTimeout(() => resolve(MOCK_PRODUCTS), 800)
    );
  },

  login: async (email: string): Promise<User> => {
    const user = MOCK_USERS.find((u) => u.email === email);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (user) resolve(user);
        else reject(new Error("Invalid credentials"));
      }, 1000);
    });
  },
};
