import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { ArrowRight, ShoppingCart, Package, Send } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "../components/ui/Skeleton";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDashboardStats } from "../data/dashboard";
import {
  formatStatLabel,
  formatStatValue,
  getStatIcon,
  getStatBgClass,
} from "../lib/dashboardUtils";
import { RequestStockModal } from "../components/modals/RequestStockModal";

// Mock Chart Data
const SALES_DATA = [
  { day: "Mon", sales: 45000 },
  { day: "Tue", sales: 52000 },
  { day: "Wed", sales: 38000 },
  { day: "Thu", sales: 65000 },
  { day: "Fri", sales: 89000 },
  { day: "Sat", sales: 120000 },
  { day: "Sun", sales: 95000 },
];

export default function DashboardOverview() {
  const { user } = useAuth();

  const { data: statsData, isLoading } = useDashboardStats();
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const stats = statsData;

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-36" />
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-32" />
                </div>
                <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Skeleton */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-8 w-32" />
            </div>
            <Skeleton className="h-[300px] w-full" />
          </div>

          {/* Recent Activity Skeleton */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6 flex flex-col h-full">
            <Skeleton className="h-6 w-40 mb-6" />
            <div className="space-y-4 flex-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex gap-3 items-center">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back,{" "}
              <span className="font-semibold text-foreground">
                {user?.name}
              </span>
              . Here's what's happening today.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/dashboard/pos"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm"
            >
              <ShoppingCart size={18} />
              New Sale
            </Link>
            <Link
              to="/dashboard/inventory"
              className="inline-flex items-center gap-2 bg-white border border-input text-foreground px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm dark:bg-card dark:hover:bg-accent"
            >
              <Package size={18} />
              Add Product
            </Link>
            {["staff", "manager", "unit_head"].includes(user?.role || "") && (
              <button
                onClick={() => setIsRequestModalOpen(true)}
                className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-700 transition-colors shadow-sm"
              >
                <Send size={18} />
                Request Stock
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats &&
            Object.entries(stats).map(([key, value]) => {
              if (key === "role") return null;

              return (
                <StatCard
                  key={key}
                  title={formatStatLabel(key)}
                  value={formatStatValue(key, value as number)}
                  trend="Auto Updated"
                  trendUp={true}
                  icon={getStatIcon(key)}
                  bgClass={getStatBgClass(key)}
                />
              );
            })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">
                Weekly Sales Performance
              </h3>
              <select className="bg-secondary/50 border-none rounded-md text-sm px-2 py-1 outline-none">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SALES_DATA}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    tickFormatter={(value) => `₦${value / 1000}k`}
                  />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(value: any) => [
                      `₦${Number(value).toLocaleString()}`,
                      "Sales",
                    ]}
                  />
                  <Bar
                    dataKey="sales"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions / Recent Activity */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6 flex flex-col">
            <h3 className="font-semibold text-lg mb-4">Recent Transactions</h3>
            <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px] pr-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      JD
                    </div>
                    <div>
                      <p className="text-sm font-medium">Order #102{i}</p>
                      <p className="text-xs text-muted-foreground">Just now</p>
                    </div>
                  </div>
                  <span className="font-semibold text-sm">
                    ₦{(i * 1500 + 5000).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <Link
                to="/dashboard/pos"
                className="flex items-center justify-center gap-2 text-primary hover:text-primary/80 font-medium text-sm transition-colors group"
              >
                View All Transactions
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <RequestStockModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />
    </>
  );
}

function StatCard({ title, value, trend, trendUp, icon, bgClass }: any) {
  return (
    <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${bgClass}`}>{icon}</div>
      </div>
      <div>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            trendUp
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
          }`}
        >
          {trend}
        </span>
      </div>
    </div>
  );
}
