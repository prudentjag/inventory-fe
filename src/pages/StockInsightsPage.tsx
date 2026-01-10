import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Package,
  Warehouse,
  AlertTriangle,
  TrendingUp,
  Boxes,
} from "lucide-react";
import { Skeleton } from "../components/ui/Skeleton";
import { useStock } from "../data/stock";
import { useBrands } from "../data/brands";
import { useCategories } from "../data/categories";
import type { Stock, Product, Brand, Category } from "../types";

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

interface StockWithProduct extends Stock {
  product?: Product;
}

export function StockInsightsPage() {
  const { data: stock, isLoading: stockLoading } = useStock();
  const { data: brands } = useBrands();
  const { data: categories } = useCategories();
  const [viewMode, setViewMode] = useState<"sets" | "items">("sets");

  // Create lookup maps
  const brandMap = useMemo(() => {
    const map = new Map<number, Brand>();
    brands?.forEach((b) => map.set(b.id, b));
    return map;
  }, [brands]);

  const categoryMap = useMemo(() => {
    const map = new Map<number, Category>();
    categories?.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // Aggregate stats
  const stats = useMemo(() => {
    if (!stock) return null;

    const totalProducts = stock.length;
    const totalSets = stock.reduce((sum, item) => sum + item.quantity, 0);
    const totalItems = stock.reduce((sum, item) => {
      const itemsPerSet =
        Number((item as StockWithProduct).product?.items_per_set) || 1;
      return sum + item.quantity * itemsPerSet;
    }, 0);
    const lowStockAlerts = stock.filter(
      (item) => item.quantity <= item.low_stock_threshold
    ).length;

    return { totalProducts, totalSets, totalItems, lowStockAlerts };
  }, [stock]);

  // Aggregate by brand
  const stockByBrand = useMemo(() => {
    if (!stock) return [];

    const brandTotals = new Map<string, { sets: number; items: number }>();

    stock.forEach((item) => {
      const stockItem = item as StockWithProduct;
      const brandId = stockItem.product?.brand_id;
      const brand = brandId ? brandMap.get(brandId) : null;
      const brandName =
        brand?.name ||
        (typeof stockItem.product?.brand === "object"
          ? stockItem.product?.brand?.name
          : stockItem.product?.brand) ||
        "Unknown";
      const itemsPerSet = Number(stockItem.product?.items_per_set) || 1;

      const existing = brandTotals.get(brandName) || { sets: 0, items: 0 };
      brandTotals.set(brandName, {
        sets: existing.sets + item.quantity,
        items: existing.items + item.quantity * itemsPerSet,
      });
    });

    return Array.from(brandTotals.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.sets - a.sets);
  }, [stock, brandMap]);

  // Aggregate by category
  const stockByCategory = useMemo(() => {
    if (!stock) return [];

    const categoryTotals = new Map<string, { sets: number; items: number }>();

    stock.forEach((item) => {
      const stockItem = item as StockWithProduct;
      const categoryId = stockItem.product?.category_id;
      const category = categoryId ? categoryMap.get(categoryId) : null;
      const categoryName =
        category?.name ||
        (typeof stockItem.product?.category === "object"
          ? stockItem.product?.category?.name
          : stockItem.product?.category) ||
        "Unknown";
      const itemsPerSet = Number(stockItem.product?.items_per_set) || 1;

      const existing = categoryTotals.get(categoryName) || {
        sets: 0,
        items: 0,
      };
      categoryTotals.set(categoryName, {
        sets: existing.sets + item.quantity,
        items: existing.items + item.quantity * itemsPerSet,
      });
    });

    return Array.from(categoryTotals.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.sets - a.sets);
  }, [stock, categoryMap]);

  // Low stock products
  const lowStockProducts = useMemo(() => {
    if (!stock) return [];

    return stock
      .filter((item) => item.quantity <= item.low_stock_threshold)
      .map((item) => {
        const stockItem = item as StockWithProduct;
        return {
          id: item.id,
          name: stockItem.product?.name || "Unknown",
          quantity: item.quantity,
          threshold: item.low_stock_threshold,
          itemsPerSet: Number(stockItem.product?.items_per_set) || 1,
        };
      })
      .sort((a, b) => a.quantity - b.quantity);
  }, [stock]);

  // Top stocked products
  const topStockedProducts = useMemo(() => {
    if (!stock) return [];

    return stock
      .map((item) => {
        const stockItem = item as StockWithProduct;
        return {
          id: item.id,
          name: stockItem.product?.name || "Unknown",
          quantity: item.quantity,
          itemsPerSet: Number(stockItem.product?.items_per_set) || 1,
          totalItems:
            item.quantity * (Number(stockItem.product?.items_per_set) || 1),
        };
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }, [stock]);

  if (stockLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Stock Insights</h1>
          <p className="text-muted-foreground">
            Analytics and statistics for central stock
          </p>
        </div>
        <div className="flex gap-2 bg-secondary/50 p-1 rounded-lg">
          <button
            onClick={() => setViewMode("sets")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === "sets"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-secondary"
            }`}
          >
            View by Sets
          </button>
          <button
            onClick={() => setViewMode("items")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === "items"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-secondary"
            }`}
          >
            View by Items
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Products in Stock"
          value={stats?.totalProducts || 0}
          icon={<Package size={24} />}
          bgClass="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
        />
        <StatCard
          title="Total Sets (Crates)"
          value={stats?.totalSets || 0}
          icon={<Boxes size={24} />}
          bgClass="bg-cyan-100 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400"
        />
        <StatCard
          title="Total Individual Items"
          value={stats?.totalItems || 0}
          icon={<Warehouse size={24} />}
          bgClass="bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
        />
        <StatCard
          title="Low Stock Alerts"
          value={stats?.lowStockAlerts || 0}
          icon={<AlertTriangle size={24} />}
          bgClass="bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
          isWarning={(stats?.lowStockAlerts || 0) > 0}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock by Brand Chart */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h3 className="font-semibold text-lg mb-4">Stock by Brand</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockByBrand} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal opacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value) => [
                    Number(value).toLocaleString(),
                    viewMode === "sets" ? "Sets" : "Items",
                  ]}
                />
                <Bar dataKey={viewMode} fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock by Category Chart */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h3 className="font-semibold text-lg mb-4">Stock by Category</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stockByCategory}
                  dataKey={viewMode}
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) =>
                    `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                  }
                  labelLine={false}
                >
                  {stockByCategory.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [
                    Number(value).toLocaleString(),
                    viewMode === "sets" ? "Sets" : "Items",
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert Table */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-amber-500" size={20} />
            <h3 className="font-semibold text-lg">Low Stock Products</h3>
          </div>
          {lowStockProducts.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              No low stock alerts 🎉
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium">Product</th>
                    <th className="text-right py-2 font-medium">Stock</th>
                    <th className="text-right py-2 font-medium">Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.slice(0, 5).map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-border/50 hover:bg-secondary/30"
                    >
                      <td className="py-2">{product.name}</td>
                      <td className="py-2 text-right font-mono text-destructive">
                        {product.quantity} sets
                      </td>
                      <td className="py-2 text-right font-mono text-muted-foreground">
                        {product.threshold}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Stocked Products Table */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-green-500" size={20} />
            <h3 className="font-semibold text-lg">Top Stocked Products</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-medium">Product</th>
                  <th className="text-right py-2 font-medium">Sets</th>
                  <th className="text-right py-2 font-medium">Items</th>
                </tr>
              </thead>
              <tbody>
                {topStockedProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-border/50 hover:bg-secondary/30"
                  >
                    <td className="py-2">{product.name}</td>
                    <td className="py-2 text-right font-mono font-medium text-primary">
                      {product.quantity.toLocaleString()}
                    </td>
                    <td className="py-2 text-right font-mono text-muted-foreground">
                      {product.totalItems.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  bgClass: string;
  isWarning?: boolean;
}

function StatCard({ title, value, icon, bgClass, isWarning }: StatCardProps) {
  return (
    <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-4 shadow-sm">
      <div className={`p-3 rounded-lg ${bgClass}`}>{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <h3
          className={`text-2xl font-bold ${
            isWarning ? "text-amber-600 dark:text-amber-400" : ""
          }`}
        >
          {value.toLocaleString()}
        </h3>
      </div>
    </div>
  );
}

export default StockInsightsPage;
