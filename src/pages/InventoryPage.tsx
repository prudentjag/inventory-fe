import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Plus,
  Filter,
  Pencil,
  Trash,
  Package,
  AlertTriangle,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { MOCK_PRODUCTS } from "../services/mockData";
import type { Product } from "../types";
import { cn } from "../lib/utils";
import { CustomFormInput } from "../components/form/CustomFormInput";

import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

import { DataTable, type Column } from "../components/ui/DataTable";

export default function InventoryPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const canEdit = ["super_admin", "unit_manager"].includes(user?.role || "");

  // Form Logic
  const validationSchema = Yup.object({
    name: Yup.string().required("Required"),
    sku: Yup.string().required("Required"),
    brand: Yup.string().required("Required"),
    category: Yup.string().required("Required"),
    price: Yup.number().positive("Must be positive").required("Required"),
    cost_price: Yup.number().positive("Must be positive").required("Required"),
    stock_quantity: Yup.number()
      .min(0, "Cannot be negative")
      .required("Required"),
    unit_of_measurement: Yup.string().required("Required"),
  });

  const formik = useFormik({
    initialValues: editingProduct || {
      id: "",
      name: "",
      sku: "",
      brand: "",
      category: "",
      price: 0,
      cost_price: 0,
      stock_quantity: 0,
      unit_of_measurement: "bottle",
      image_url: "",
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: (values) => {
      if (editingProduct) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === editingProduct.id ? { ...values, id: p.id } : p
          )
        );
        toast.success("Product updated");
      } else {
        const newProduct = { ...values, id: `p${Date.now()}` };
        setProducts((prev) => [...prev, newProduct]);
        toast.success("Product created");
      }
      handleCloseDialog();
    },
  });

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    formik.resetForm();
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

      {/* Add/Edit Modal */}
      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
            <div className="flex flex-col space-y-1.5 text-center sm:text-left">
              <Dialog.Title className="text-lg font-semibold leading-none tracking-tight">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                {editingProduct
                  ? "Update product details below."
                  : "Add a new item to your global inventory."}
              </Dialog.Description>
            </div>

            <form onSubmit={formik.handleSubmit} className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <CustomFormInput
                  name="name"
                  label="Product Name"
                  formik={formik}
                  placeholder="e.g. Star Radler"
                />
                <CustomFormInput
                  name="sku"
                  label="SKU / Barcode"
                  formik={formik}
                  placeholder="e.g. STR-001"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <CustomFormInput
                  name="brand"
                  label="Brand"
                  formik={formik}
                  placeholder="e.g. Star"
                />
                <CustomFormInput
                  name="category"
                  label="Category"
                  formik={formik}
                  placeholder="e.g. Beer"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <CustomFormInput
                  name="cost_price"
                  label="Cost Price"
                  type="number"
                  formik={formik}
                />
                <CustomFormInput
                  name="price"
                  label="Selling Price"
                  type="number"
                  formik={formik}
                />
                <CustomFormInput
                  name="stock_quantity"
                  label="Initial Stock"
                  type="number"
                  formik={formik}
                />
              </div>

              <CustomFormInput
                name="unit_of_measurement"
                label="Unit (e.g. Bottle, Pack)"
                formik={formik}
              />

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={handleCloseDialog}
                  className="px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                >
                  {editingProduct ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
