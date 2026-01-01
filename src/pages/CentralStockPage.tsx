import { useState } from "react";
import {
  Plus,
  Warehouse,
  AlertTriangle,
  Pencil,
  Trash2,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { useStock, useDeleteStock } from "../data/stock";
import { useProducts } from "../data/products";
import { AddCentralStockModal } from "../components/modals/AddCentralStockModal";
import { EditCentralStockModal } from "../components/modals/EditCentralStockModal";
import { AuditLogModal } from "../components/modals/AuditLogModal";
import { DataTable, type Column } from "../components/ui/DataTable";
import type { Stock, Product } from "../types";

export function CentralStockPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<
    (Stock & { product?: Product }) | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: stock, isLoading } = useStock();
  const { data: products } = useProducts();
  const deleteStockMutation = useDeleteStock();

  // Create a product lookup map
  const productMap = new Map<number, Product>();
  products?.forEach((p) => {
    productMap.set(Number(p.id), p);
  });

  // Extend stock with product data for display
  const stockWithProducts =
    stock?.map((item) => ({
      ...item,
      product: item.product || productMap.get(item.product_id),
    })) || [];

  const filteredStock = stockWithProducts.filter((item) => {
    const product = item.product;
    const productName = product?.name?.toLowerCase() || "";
    const sku = product?.sku?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    return productName.includes(query) || sku.includes(query);
  });

  const handleEdit = (item: Stock & { product?: Product }) => {
    setSelectedStock(item);
    setIsEditModalOpen(true);
  };

  const handleDelete = (item: Stock) => {
    if (confirm("Are you sure you want to delete this stock entry?")) {
      deleteStockMutation.mutate(item.id, {
        onSuccess: () => toast.success("Stock entry deleted"),
        onError: () => toast.error("Failed to delete stock entry"),
      });
    }
  };

  const columns: Column<Stock & { product?: Product }>[] = [
    {
      header: "Product",
      cell: (item) => (
        <div className="font-medium">{item.product?.name || "Unknown"}</div>
      ),
    },
    {
      header: "In Stock",
      cell: (item) => (
        <span className="font-mono text-lg font-bold text-primary">
          {item.quantity.toLocaleString()}
        </span>
      ),
      className: "text-right",
      headerClassName: "text-right",
    },
    {
      header: "Low Stock Alert",
      cell: (item) => (
        <span className="font-mono text-muted-foreground">
          {item.low_stock_threshold}
        </span>
      ),
      className: "text-right",
      headerClassName: "text-right",
    },
    {
      header: "Batch #",
      cell: (item) => (
        <span className="text-muted-foreground">
          {item.batch_number || "-"}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (item) => {
        const isLowStock = item.quantity <= item.low_stock_threshold;
        return isLowStock ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            <AlertTriangle className="h-3 w-3" />
            Low Stock
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            In Stock
          </span>
        );
      },
    },
    {
      header: "Actions",
      headerClassName: "text-right",
      cell: (item) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedStock(item);
              setIsAuditModalOpen(true);
            }}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-blue-600"
            title="Track Trail"
          >
            <History className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(item);
            }}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(item);
            }}
            className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  // Stats
  const totalItems = stock?.length || 0;
  const totalQuantity =
    stock?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const lowStockCount =
    stock?.filter((item) => item.quantity <= item.low_stock_threshold).length ||
    0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Central Stock</h1>
        <p className="text-muted-foreground">
          Manage central warehouse inventory
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-cyan-100 text-cyan-600 rounded-lg dark:bg-cyan-900/20 dark:text-cyan-400">
            <Warehouse size={24} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">
              Total Products
            </p>
            <h3 className="text-2xl font-bold">{totalItems}</h3>
          </div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg dark:bg-blue-900/20 dark:text-blue-400">
            <Warehouse size={24} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">
              Total Quantity
            </p>
            <h3 className="text-2xl font-bold">
              {totalQuantity.toLocaleString()}
            </h3>
          </div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-lg dark:bg-amber-900/20 dark:text-amber-400">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">
              Low Stock Alerts
            </p>
            <h3 className="text-2xl font-bold">{lowStockCount}</h3>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredStock}
        columns={columns}
        searchPlaceholder="Search by product name or SKU..."
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        isLoading={isLoading}
        actionButton={
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Stock
          </button>
        }
      />

      <AddCentralStockModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <EditCentralStockModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedStock(null);
        }}
        stock={selectedStock}
      />

      <AuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => {
          setIsAuditModalOpen(false);
          setSelectedStock(null);
        }}
        resourceType="stock"
        resourceId={selectedStock?.id || null}
        resourceName={selectedStock?.product?.name}
      />
    </div>
  );
}
