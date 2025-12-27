import { useState } from "react";
import { Plus, Pencil, Trash, Tag, Layers } from "lucide-react";
import { Skeleton } from "../components/ui/Skeleton";
import { DataTable, type Column } from "../components/ui/DataTable";
import { useBrands, useDeleteBrand } from "../data/brands";
import { useCategories, useDeleteCategory } from "../data/categories";
import { BrandModal } from "../components/modals/BrandModal";
import { CategoryModal } from "../components/modals/CategoryModal";
import type { Brand, Category } from "../types";
import { toast } from "sonner";
import { cn } from "../lib/utils";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"brands" | "categories">("brands");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage global definitions and system configurations.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-border">
        <TabButton
          active={activeTab === "brands"}
          onClick={() => setActiveTab("brands")}
          icon={<Tag size={16} />}
          label="Brands"
        />
        <TabButton
          active={activeTab === "categories"}
          onClick={() => setActiveTab("categories")}
          icon={<Layers size={16} />}
          label="Categories"
        />
      </div>

      {activeTab === "brands" ? <BrandsManager /> : <CategoriesManager />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function BrandsManager() {
  const { data: brands = [], isLoading } = useBrands();
  const deleteBrandMutation = useDeleteBrand();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this brand?")) {
      deleteBrandMutation.mutate(id, {
        onSuccess: () => toast.success("Brand deleted successfully"),
        onError: () => toast.error("Failed to delete brand"),
      });
    }
  };

  const handleCloseDocs = () => {
    setIsModalOpen(false);
    setEditingBrand(null);
  };

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: Column<Brand>[] = [
    {
      header: "ID",
      accessorKey: "id",
      className: "w-[80px]",
      cell: (brand) => <span className="font-mono text-xs">#{brand.id}</span>,
    },
    {
      header: "Brand logo",
      accessorKey: "image",
      cell: (brand) => (
        <img
          src={brand.image_url ?? undefined}
          alt={brand.name}
          className="w-16 h-16 object-cover rounded-full"
        />
      ),
    },
    {
      header: "Brand Name",
      accessorKey: "name",
      cell: (brand) => <span className="font-medium">{brand.name}</span>,
    },
    {
      header: "Item per set",
      accessorKey: "items_per_set",
      cell: (brand) => <span className="font-medium">{brand.items_per_set}</span>,
    },
    {
      header: "Actions",
      className: "text-left",
      cell: (brand) => (
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => handleEdit(brand)}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => handleDelete(brand.id)}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
          >
            <Trash size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Brand
        </button>
      </div>

      {isLoading ? (
        <Skeleton className="h-[400px] w-full" />
      ) : (
        <DataTable
          data={filteredBrands}
          columns={columns}
          searchPlaceholder="Search brands..."
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
        />
      )}

      <BrandModal
        isOpen={isModalOpen}
        onClose={handleCloseDocs}
        brand={editingBrand}
      />
    </div>
  );
}

function CategoriesManager() {
  const { data: categories = [], isLoading } = useCategories();
  const deleteCategoryMutation = useDeleteCategory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this category?")) {
      deleteCategoryMutation.mutate(id, {
        onSuccess: () => toast.success("Category deleted successfully"),
        onError: () => toast.error("Failed to delete category"),
      });
    }
  };

  const handleCloseDocs = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: Column<Category>[] = [
    {
      header: "ID",
      accessorKey: "id",
      className: "w-[80px]",
      cell: (cat) => <span className="font-mono text-xs">#{cat.id}</span>,
    },
    {
      header: "Category Name",
      accessorKey: "name",
      cell: (cat) => <span className="font-medium">{cat.name}</span>,
    },
    {
      header: "Description",
      accessorKey: "description",
      cell: (cat) => (
        <span className="text-muted-foreground text-sm truncate max-w-[300px] block">
          {cat.description || "-"}
        </span>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (cat) => (
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => handleEdit(cat)}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => handleDelete(cat.id)}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
          >
            <Trash size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </button>
      </div>

      {isLoading ? (
        <Skeleton className="h-[400px] w-full" />
      ) : (
        <DataTable
          data={filteredCategories}
          columns={columns}
          searchPlaceholder="Search categories..."
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
        />
      )}

      <CategoryModal
        isOpen={isModalOpen}
        onClose={handleCloseDocs}
        category={editingCategory}
      />
    </div>
  );
}
