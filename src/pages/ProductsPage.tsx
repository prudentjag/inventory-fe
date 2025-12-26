import { useState } from "react";
import { Plus, Filter, Pencil, Trash, Package } from "lucide-react";
import { Skeleton } from "../components/ui/Skeleton";
import { useProducts } from "../data/products";
import { ProductModal } from "../components/modals/ProductModal";
import type { Product } from "../types";
import { useAuth } from "../context/AuthContext";
import { DataTable, type Column } from "../components/ui/DataTable";

export default function ProductsPage() {
  const { user } = useAuth();
  const { data: apiProductsData, isLoading } = useProducts();
  const products = apiProductsData?.data || [];

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const canEdit = user?.role === "admin"; // Only admin should edit global catalog

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchQuery.toLowerCase())
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
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
          {product.category}
        </span>
      ),
    },
    {
      header: "Price",
      accessorKey: "price",
      className: "font-mono",
      cell: (product) => <span>₦{product.price.toLocaleString()}</span>,
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
          searchPlaceholder="Search global catalog..."
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
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
