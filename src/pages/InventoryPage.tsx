import { useState } from "react";
import {
  Plus,
  Filter,
  Pencil,
  Trash,
  Package,
  AlertTriangle,
} from "lucide-react";
import { Skeleton } from "../components/ui/Skeleton";
import { useProducts } from "../data/products"; // Import hooks
import { ProductModal } from "../components/modals/ProductModal";
import type { Product } from "../types";
import { cn } from "../lib/utils";

import { useAuth } from "../context/AuthContext";

import { DataTable, type Column } from "../components/ui/DataTable";

export default function InventoryPage() {
  const { user } = useAuth();

  // API Hooks
  const { data: apiProductsData, isLoading } = useProducts();

  // Use API data or empty array
  const products = apiProductsData?.data || [];

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const canEdit = ["admin", "manager"].includes(user?.role || "");

  // Form Logic - Migrated to ProductModal

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
  };

  // derived state
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      cell: (product) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          {product.category}
        </span>
      ),
    },
    {
      header: "Stock",
      accessorKey: "stock_quantity",
      cell: (product) => (
        <div
          className={cn(
            "font-medium",
            product.stock_quantity < 10 ? "text-red-500" : "text-foreground"
          )}
        >
          {product.stock_quantity} {product.unit_of_measurement}s
        </div>
      ),
    },
    {
      header: "Price",
      accessorKey: "price",
      className: "font-mono",
      cell: (product) => <span>₦{product.price.toLocaleString()}</span>,
    },
  ];

  if (canEdit) {
    columns.push({
      header: "Actions",
      className: "text-right",
      headerClassName: "text-right",
      cell: (product) => (
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(product);
            }}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
            title="Edit"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // In real app, add delete handler
            }}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
            title="Delete"
          >
            <Trash size={16} />
          </button>
        </div>
      ),
    });
  }

  return (
    <div className="space-y-6">
      {/* Header Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ... existing info cards ... */}
        <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg dark:bg-blue-900/20 dark:text-blue-400">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">
              Total Products
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
              {products.filter((p) => p.stock_quantity < 10).length}
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
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <DataTable
          data={filteredProducts}
          columns={columns}
          searchPlaceholder="Search by name, SKU, or brand..."
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          actionButton={
            canEdit && (
              <button
                onClick={() => setIsDialogOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm w-full sm:w-auto justify-center"
              >
                <Plus size={18} />
                Add Product
              </button>
            )
          }
        />
      )}
      <ProductModal
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        product={editingProduct}
      />
    </div>
  );
}
