import React from "react";
import {
  TrendingUp,
  Package,
  Users,
  AlertTriangle,
  ShoppingCart,
  Activity,
  ClipboardList,
  Warehouse,
} from "lucide-react";

export const formatStatLabel = (key: string): string => {
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const formatStatValue = (key: string, value: number): string => {
  if (
    key.includes("revenue") ||
    key.includes("price") ||
    key.includes("cost")
  ) {
    return `₦${value.toLocaleString()}`;
  }
  return value.toLocaleString();
};

export const getStatIcon = (key: string) => {
  const lowerKey = key.toLowerCase();

  if (lowerKey.includes("revenue") || lowerKey.includes("money")) {
    return <TrendingUp className="text-green-600" size={24} />;
  }
  if (lowerKey.includes("user") || lowerKey.includes("staff")) {
    return <Users className="text-purple-600" size={24} />;
  }
  if (lowerKey.includes("pending") || lowerKey.includes("request")) {
    return <ClipboardList className="text-amber-600" size={24} />;
  }
  if (lowerKey.includes("central_stock") || lowerKey.includes("warehouse")) {
    return <Warehouse className="text-cyan-600" size={24} />;
  }
  if (
    lowerKey.includes("product") ||
    lowerKey.includes("item") ||
    lowerKey.includes("sku")
  ) {
    return <Package className="text-blue-600" size={24} />;
  }
  if (lowerKey.includes("alert") || lowerKey.includes("low")) {
    return <AlertTriangle className="text-orange-600" size={24} />;
  }
  if (lowerKey.includes("sale") || lowerKey.includes("order")) {
    return <ShoppingCart className="text-indigo-600" size={24} />;
  }

  return <Activity className="text-gray-600" size={24} />;
};

export const getStatBgClass = (key: string) => {
  const lowerKey = key.toLowerCase();

  if (lowerKey.includes("revenue") || lowerKey.includes("money")) {
    return "bg-green-100 dark:bg-green-900/20";
  }
  if (lowerKey.includes("user") || lowerKey.includes("staff")) {
    return "bg-purple-100 dark:bg-purple-900/20";
  }
  if (lowerKey.includes("pending") || lowerKey.includes("request")) {
    return "bg-amber-100 dark:bg-amber-900/20";
  }
  if (lowerKey.includes("central_stock") || lowerKey.includes("warehouse")) {
    return "bg-cyan-100 dark:bg-cyan-900/20";
  }
  if (
    lowerKey.includes("product") ||
    lowerKey.includes("item") ||
    lowerKey.includes("sku")
  ) {
    return "bg-blue-100 dark:bg-blue-900/20";
  }
  if (lowerKey.includes("alert") || lowerKey.includes("low")) {
    return "bg-orange-100 dark:bg-orange-900/20";
  }
  if (lowerKey.includes("sale") || lowerKey.includes("order")) {
    return "bg-indigo-100 dark:bg-indigo-900/20";
  }

  return "bg-gray-100 dark:bg-gray-900/20";
};
