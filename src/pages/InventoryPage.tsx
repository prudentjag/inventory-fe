import { useState } from "react";
import { Plus, Filter, Package, AlertTriangle, Send } from "lucide-react";
import { Skeleton } from "../components/ui/Skeleton";
import { useInventory } from "../data/inventory";
import { useUnits } from "../data/units";
import { AddStockModal } from "../components/modals/AddStockModal";
import { RequestStockModal } from "../components/modals/RequestStockModal";
import type { Product, Unit } from "../types";
import { cn } from "../lib/utils";

import { useAuth } from "../context/AuthContext";

import { DataTable, type Column } from "../components/ui/DataTable";

export default function InventoryPage() {
  const { user } = useAuth();
  const [selectedUnitId, setSelectedUnitId] = useState<
    number | string | undefined
  >(user?.assigned_unit_id || undefined);

  // Fetch all units for filtering (if admin/stockist)
  const { data: units } = useUnits();

  // Fetch unit inventory
  const { data: inventoryData, isLoading } = useInventory(selectedUnitId);
  const products = inventoryData?.data || [];

  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleCloseRestock = () => {
    setIsRestockModalOpen(false);
  };

  // derived state
  const filteredProducts = products.filter((p) => {
    const query = searchQuery.toLowerCase();
    const nameMatch = p.name?.toLowerCase().includes(query) ?? false;
    const skuMatch = p.sku?.toLowerCase().includes(query) ?? false;
    const brandName = typeof p.brand === "object" ? p.brand?.name : p.brand;
    const brandMatch = brandName?.toLowerCase().includes(query) ?? false;
    return nameMatch || skuMatch || brandMatch;
  });

  const columns: Column<Product>[] = [
    {
      header: "Product Name",
      accessorKey: "name",
      cell: (product) => (
        <div className="flex items-center gap-3 font-medium text-foreground">
          <div className="w-8 h-8 rounded bg-secondary/80 flex items-center justify-center overflow-hidden border border-border">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <Package size={14} className="text-muted-foreground" />
            )}
          </div>
          {product.name}
        </div>
      ),
    },
    {
      header: "SKU",
      accessorKey: "sku",
      cell: (product) => (
        <span className="text-muted-foreground">{product.sku}</span>
      ),
    },
    {
      header: "Category",
      accessorKey: "category",
      cell: (product) => {
        const categoryName =
          typeof product.category === "object"
            ? product.category?.name
            : product.category;
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            {categoryName ?? "-"}
          </span>
        );
      },
    },
    {
      header: "Stock",
      accessorKey: "stock_quantity",
      cell: (product) => (
        <div
          className={cn(
            "font-medium",
            (product.stock_quantity ?? 0) < 10
              ? "text-red-500"
              : "text-foreground"
          )}
        >
          {product.stock_quantity ?? 0} {product.unit_of_measurement ?? "unit"}s
        </div>
      ),
    },
    {
      header: "Price",
      accessorKey: "price",
      className: "font-mono",
      cell: (product) => (
        <span>
          ₦{(product.price ?? product.selling_price ?? 0).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Unit Filter - Only for Admins and Stockists */}
      {["admin", "stockist"].includes(user?.role || "") && (
        <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-muted-foreground whitespace-nowrap">
            <Filter size={18} />
            <span className="text-sm font-medium">Filter by Unit:</span>
          </div>
          <div className="w-full max-w-sm">
            <select
              value={selectedUnitId || ""}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer hover:border-primary/50"
            >
              <option value="">Choose a unit...</option>
              {units?.map((unit: Unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name} ({unit.type})
                </option>
              ))}
            </select>
          </div>
          {!selectedUnitId && (
            <p className="text-xs text-amber-600 font-medium">
              Please select a unit to view its current inventory status.
            </p>
          )}
        </div>
      )}

      {/* Header Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ... existing info cards ... */}
        <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg dark:bg-blue-900/20 dark:text-blue-400">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">
              Items in Stock
            </p>
            <h3 className="text-2xl font-bold">{products.length}</h3>
          </div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg dark:bg-red-900/20 dark:text-red-400">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">
              Low Stock Items
            </p>
            <h3 className="text-2xl font-bold">
              {products.filter((p) => (p.stock_quantity ?? 0) < 10).length}
            </h3>
          </div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg dark:bg-green-900/20 dark:text-green-400">
            <Filter size={24} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">
              Categories
            </p>
            <h3 className="text-2xl font-bold">
              {new Set(products.map((p) => p.category)).size}
            </h3>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <DataTable
          data={filteredProducts}
          columns={columns}
          searchPlaceholder="Search unit inventory..."
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          actionButton={
            <div className="flex gap-2 w-full sm:w-auto">
              {["manager", "unit_head"].includes(user?.role || "") && (
                <button
                  onClick={() => setIsRequestModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium shadow-sm flex-1 sm:flex-initial justify-center"
                >
                  <Send size={18} />
                  Request Stock
                </button>
              )}
              <button
                onClick={() => setIsRestockModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm flex-1 sm:flex-initial justify-center"
              >
                <Plus size={18} />
                Restock Item
              </button>
            </div>
          }
        />
      )}
      <AddStockModal isOpen={isRestockModalOpen} onClose={handleCloseRestock} />
      <RequestStockModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />
    </div>
  );
}
