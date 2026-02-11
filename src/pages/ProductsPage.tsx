import { useState } from "react";
import { Plus, Filter, Pencil, Package, Trash2 } from "lucide-react";
import { Skeleton } from "../components/ui/Skeleton";
import { useProducts, useDeleteProduct } from "../data/products";
import { ProductModal } from "../components/modals/ProductModal";
import type { Product } from "../types";
import { useAuth } from "../context/AuthContext";
import { DataTable, type Column } from "../components/ui/DataTable";
import { cn } from "../lib/utils";

export default function ProductsPage() {
  const { user } = useAuth();
  const { data: products = [], isLoading } = useProducts();
  const deleteProductMutation = useDeleteProduct();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<
    "all" | "central_stock" | "unit_produced" | "unit_processed"
  >("all");

  const canEdit = user?.role === "admin" || user?.role === "stockist"; // Only admin should edit global catalog

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleDelete = (product: Product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      deleteProductMutation.mutate(product.id);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
  };

  const filteredProducts = products.filter((p) => {
    const query = searchQuery.toLowerCase();
    const nameMatch = p.name?.toLowerCase().includes(query) ?? false;
    const skuMatch = p.sku?.toLowerCase().includes(query) ?? false;
    // Handle brand as either string or object
    const brandName = typeof p.brand === "object" ? p.brand?.name : p.brand;
    const brandMatch = brandName?.toLowerCase().includes(query) ?? false;
    const searchMatch = nameMatch || skuMatch || brandMatch;

    // Source type filter
    const sourceType = p.source_type || "central_stock";
    const sourceMatch = sourceFilter === "all" || sourceType === sourceFilter;

    return searchMatch && sourceMatch;
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
        <span className="text-muted-foreground">{product.sku ?? "-"}</span>
      ),
    },
    {
      header: "Category",
      accessorKey: "category",
      cell: (product) => {
        // Handle category as either string or object
        const categoryName =
          typeof product.category === "object"
            ? product.category?.name
            : product.category;
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
            {categoryName ?? "-"}
          </span>
        );
      },
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
    {
      header: "Type",
      accessorKey: "product_type",
      cell: (product) => (
        <span
          className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
            product.product_type === "individual"
              ? "bg-purple-100 text-purple-800 border-purple-200"
              : "bg-blue-100 text-blue-800 border-blue-200",
          )}
        >
          {product.product_type === "individual" ? "Individual" : "Set"}
        </span>
      ),
    },
    {
      header: "Item per Set (crate)",
      accessorKey: "items_per_set",
      className: "font-mono",
      cell: (product) => <span>{product.items_per_set ?? "-"}</span>,
    },
    {
      header: "Source",
      accessorKey: "source_type",
      cell: (product) => {
        const sourceType = product.source_type || "central_stock";
        return sourceType === "central_stock" ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400">
            📦 Central Stock
          </span>
        ) : sourceType === "unit_produced" ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-400">
            🏭 Unit Produced
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400">
            ⚙️ Unit Processed
          </span>
        );
      },
    },
    {
      header: "Actions",
      className: "text-right",
      headerClassName: "text-right",
      cell: (product) => (
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {canEdit && (
            <>
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
                  handleDelete(product);
                }}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                title="Delete"
                disabled={deleteProductMutation.isPending}
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Global Product Catalog
          </h1>
          <p className="text-muted-foreground">
            Define the items available for sale across all units.
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setIsDialogOpen(true)}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg dark:bg-blue-900/20 dark:text-blue-400">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">
              Total Definitions
            </p>
            <h3 className="text-2xl font-bold">{products.length}</h3>
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
              {new Set(products.map((p) => p.category).filter(Boolean)).size}
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
        <>
          {/* Source Type Filter */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1" />
            <div className="w-48">
              <select
                value={sourceFilter}
                onChange={(e) =>
                  setSourceFilter(
                    e.target.value as "all" | "central_stock" | "unit_produced",
                  )
                }
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="all">All Sources</option>
                <option value="central_stock">📦 Central Stock</option>
                <option value="unit_produced">🏭 Unit Produced</option>
                <option value="unit_processed">⚙️ Unit Processed</option>
              </select>
            </div>
          </div>
          <DataTable
            data={filteredProducts}
            columns={columns}
            searchPlaceholder="Search global catalog..."
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
          />
        </>
      )}
      <ProductModal
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        product={editingProduct}
      />
    </div>
  );
}
