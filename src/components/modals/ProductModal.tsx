import * as Dialog from "@radix-ui/react-dialog";
import { useFormik } from "formik";
import { useState } from "react";
import * as Yup from "yup";
import { Loader2, Camera } from "lucide-react";
import { toast } from "sonner";
import { CustomFormInput } from "../form/CustomFormInput";
import { BarcodeScanner } from "../form/BarcodeScanner";
import { useCreateProduct } from "../../data/products";
import { useBrands } from "../../data/brands";
import { useCategories } from "../../data/categories";
import type { Product } from "../../types";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
}

export function ProductModal({ isOpen, onClose, product }: ProductModalProps) {
  const [showScanner, setShowScanner] = useState(false);
  const createProductMutation = useCreateProduct();
  const { data: brands = [] } = useBrands();
  const { data: categories = [] } = useCategories();

  const validationSchema = Yup.object({
    name: Yup.string().required("Required"),
    sku: Yup.string().required("Required"),
    brand_id: Yup.number().required("Required"),
    category_id: Yup.number().required("Required"),
    size: Yup.string()
      .oneOf(
        ["small", "medium", "large", "extra large"],
        "Must be small, medium, or large"
      )
      .nullable(),
    price: Yup.number().positive("Must be positive").required("Required"),
    cost_price: Yup.number().positive("Must be positive").required("Required"),
    unit_of_measurement: Yup.string().required("Required"),
  });

  const formik = useFormik({
    initialValues: product || {
      id: "",
      name: "",
      sku: "",
      brand_id: "",
      category_id: "",
      price: 0,
      size: "",
      cost_price: 0,
      stock_quantity: 0,
      unit_of_measurement: "bottle",
      image_url: "",
      trackable: true,
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      const payload = {
        name: values.name,
        sku: values.sku,
        brand_id: Number(values.brand_id),
        category_id: Number(values.category_id),
        size: values.size,
        selling_price: Number(values.price),
        cost_price: Number(values.cost_price),
        unit_of_measurement: values.unit_of_measurement,
        trackable: true, // Hardcoded as per request or UI toggle? Request implies true.
      };

      if (product) {
        toast.info("Edit not implemented yet");
      } else {
        createProductMutation.mutate(payload as any, {
          onSuccess: () => {
            toast.success("Product created successfully");
            handleClose();
          },
          onError: (error: any) => {
            toast.error(
              error.response?.data?.message || "Failed to create product"
            );
          },
        });
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

              <div className="space-y-2">
                <label htmlFor="category_id" className="text-sm font-medium">
                  Category
                </label>
                <select
                  id="category_id"
                  name="category_id"
                  className="w-full h-12 px-3 rounded-md border border-input bg-background"
                  value={formik.values.category_id}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {formik.touched.category_id && formik.errors.category_id && (
                  <p className="text-sm text-destructive">
                    {formik.errors.category_id}
                  </p>
                )}
              </div>
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
                  {["Small", "Medium", "Large", "Extra Large"].map((size) => (
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
                disabled={createProductMutation.isPending}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
              >
                {createProductMutation.isPending ? (
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
