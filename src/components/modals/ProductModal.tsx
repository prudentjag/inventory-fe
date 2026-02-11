import * as Dialog from "@radix-ui/react-dialog";
import { useFormik } from "formik";
import { useState } from "react";
import * as Yup from "yup";
import { Loader2, Camera } from "lucide-react";
import { toast } from "sonner";
import { CustomFormInput } from "../form/CustomFormInput";
import { BarcodeScanner } from "../form/BarcodeScanner";
import { useCreateProduct, useUpdateProduct } from "../../data/products";
import { useBrands } from "../../data/brands";
import type { Product, SourceType } from "../../types";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
}

export function ProductModal({ isOpen, onClose, product }: ProductModalProps) {
  const [showScanner, setShowScanner] = useState(false);
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const { data: brands = [] } = useBrands();

  const validationSchema = Yup.object({
    name: Yup.string().required("Required"),
    sku: Yup.string().required("Required"),
    brand_id: Yup.number().required("Required"),
    size: Yup.string()
      .oneOf(["small", "medium", "big"], "Must be small, medium, or big")
      .nullable(),
    items_per_set: Yup.number().when("product_type", {
      is: "set",
      then: (schema) =>
        schema.min(1, "Must be at least 1").required("Required"),
      otherwise: (schema) => schema.nullable(),
    }),
    price: Yup.number().positive("Must be positive").required("Required"),
    cost_price: Yup.number().positive("Must be positive").required("Required"),
    unit_of_measurement: Yup.string().required("Required"),
    quantity: Yup.number().min(1, "Must be at least 1").nullable(),
    product_type: Yup.string()
      .oneOf(["set", "individual"])
      .required("Required"),
  });

  const formik = useFormik({
    initialValues: product
      ? {
          ...product,
          brand_id:
            product.brand_id ||
            (typeof product.brand === "object" ? product.brand?.id : ""),
          price: product.price ?? product.selling_price ?? 0,
          items_per_set: product.items_per_set ?? 12,
          product_type: product.product_type || "set",
          source_type: product.source_type || "central_stock",
        }
      : {
          id: "",
          name: "",
          sku: "",
          brand_id: "",
          price: 0,
          size: "",
          items_per_set: 12,
          product_type: "set",
          cost_price: 0,
          stock_quantity: 0,
          unit_of_measurement: "bottle",
          image_url: "",
          trackable: true,
          quantity: 1,
          source_type: "central_stock",
        },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      const payload = {
        name: values.name,
        sku: values.sku,
        brand_id: Number(values.brand_id),
        size: values.size,
        items_per_set: Number(values.items_per_set) || 12,
        selling_price: Number(values.price),
        cost_price: Number(values.cost_price),
        unit_of_measurement: values.unit_of_measurement,
        trackable: true,
        product_type: values.product_type as any,
        source_type: values.source_type as SourceType,
      };

      if (product) {
        updateProductMutation.mutate(
          { id: product.id, data: payload },
          {
            onSuccess: () => {
              toast.success("Product updated successfully");
              handleClose();
            },
            onError: (error: any) => {
              toast.error(
                error.response?.data?.message || "Failed to update product",
              );
            },
          },
        );
      } else {
        createProductMutation.mutate(
          {
            ...payload,
            quantity:
              values.source_type === "central_stock"
                ? Number(values.quantity)
                : 0,
          } as any,
          {
            onSuccess: () => {
              const message =
                values.source_type === "unit_produced"
                  ? "Unit-produced product created successfully"
                  : "Product created and added to central stock";
              toast.success(message);
              handleClose();
            },
            onError: (error: any) => {
              toast.error(
                error.response?.data?.message || "Failed to create product",
              );
            },
          },
        );
      }
    },
  });

  const handleClose = () => {
    onClose();
    formik.resetForm();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl max-h-[90vh] overflow-y-auto translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <Dialog.Title className="text-lg font-semibold leading-none tracking-tight">
              {product ? "Edit Product" : "Add New Product"}
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground">
              {product
                ? "Update product details below."
                : "Define a new item in the global catalog."}
            </Dialog.Description>
          </div>

          <form onSubmit={formik.handleSubmit} className="grid gap-6 py-4">
            {/* Barcode Scanner */}
            {showScanner && (
              <BarcodeScanner
                onScan={(barcode) => {
                  formik.setFieldValue("sku", barcode);
                  setShowScanner(false);
                }}
                onClose={() => setShowScanner(false)}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <CustomFormInput
                name="name"
                label="Product Name"
                formik={formik}
                placeholder="e.g. Star Radler"
              />
              <div className="space-y-2">
                <label htmlFor="sku" className="text-sm font-medium">
                  SKU / Barcode
                </label>
                <div className="flex gap-2">
                  <input
                    id="sku"
                    name="sku"
                    type="text"
                    className="flex-1 h-12 px-3 rounded-md border border-input bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="e.g. STR-001"
                    value={formik.values.sku}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="h-12 px-3 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                    title="Scan Barcode"
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                </div>
                {formik.touched.sku && formik.errors.sku && (
                  <p className="text-sm text-destructive">
                    {formik.errors.sku}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="brand_id" className="text-sm font-medium">
                  Brand
                </label>
                <select
                  id="brand_id"
                  name="brand_id"
                  className="w-full h-12 px-3 rounded-md border border-input bg-background"
                  value={formik.values.brand_id}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  <option value="">Select Brand</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
                {formik.touched.brand_id && formik.errors.brand_id && (
                  <p className="text-sm text-destructive">
                    {formik.errors.brand_id}
                  </p>
                )}
              </div>
              {formik.values.source_type === "central_stock" && (
                <CustomFormInput
                  name="quantity"
                  label="Initial Stock Quantity"
                  type="number"
                  formik={formik}
                  placeholder="e.g. 100"
                />
              )}
            </div>

            {/* Source Type Selector */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="source_type" className="text-sm font-medium">
                  Product Source
                </label>
                <select
                  id="source_type"
                  name="source_type"
                  className="w-full h-12 px-3 rounded-md border border-input bg-background"
                  value={formik.values.source_type}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  <option value="central_stock">📦 Central Stock</option>
                  <option value="unit_produced">🏭 Unit Produced</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  {formik.values.source_type === "unit_produced"
                    ? "Made/sourced at the unit (e.g., shawarma, popcorn)"
                    : "Stored in central warehouse"}
                </p>
              </div>
              {formik.values.source_type === "unit_produced" && (
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      <strong>ℹ️ Note:</strong> This product won't be added to
                      central stock.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="product_type" className="text-sm font-medium">
                  Product Type
                </label>
                <select
                  id="product_type"
                  name="product_type"
                  className="w-full h-12 px-3 rounded-md border border-input bg-background"
                  value={formik.values.product_type}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  <option value="set">Set (Crates/Groups)</option>
                  <option value="individual">
                    Individual (Single Items/Kg)
                  </option>
                </select>
                {formik.touched.product_type && formik.errors.product_type && (
                  <p className="text-sm text-destructive">
                    {formik.errors.product_type as string}
                  </p>
                )}
              </div>

              <CustomFormInput
                name="items_per_set"
                label="Items per Set"
                type="number"
                formik={formik}
                placeholder="e.g. 12"
                disabled={formik.values.product_type === "individual"}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="size" className="text-sm font-medium">
                  Size
                </label>
                <select
                  id="size"
                  name="size"
                  className="w-full h-12 px-3 rounded-md border border-input bg-background"
                  value={formik.values.size}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  <option value="">Select Size</option>
                  {["small", "medium", "big"].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                {formik.touched.size && formik.errors.size && (
                  <p className="text-sm text-destructive">
                    {formik.errors.size}
                  </p>
                )}
              </div>
              <CustomFormInput
                name="unit_of_measurement"
                label="Unit (e.g. Bottle, Pack)"
                formik={formik}
              />
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  createProductMutation.isPending ||
                  updateProductMutation.isPending
                }
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
              >
                {createProductMutation.isPending ||
                updateProductMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : product ? (
                  "Save Changes"
                ) : (
                  "Create Product"
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
