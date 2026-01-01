import * as Dialog from "@radix-ui/react-dialog";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CustomFormSelect } from "../form/CustomFormSelect";
import { CustomFormInput } from "../form/CustomFormInput";
import { useProducts } from "../../data/products";
import { useAddStock } from "../../data/stock";

interface AddCentralStockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddCentralStockModal({
  isOpen,
  onClose,
}: AddCentralStockModalProps) {
  const { data: products } = useProducts();
  const addStockMutation = useAddStock();

  const productOptions =
    products?.map((p) => ({
      label: `${p.name} (${p.sku})`,
      value: String(p.id),
    })) || [];

  const validationSchema = Yup.object({
    product_id: Yup.string().required("Required"),
    quantity: Yup.number().min(1, "Must be at least 1").required("Required"),
    low_stock_threshold: Yup.number().min(0, "Cannot be negative"),
    batch_number: Yup.string(),
  });

  const formik = useFormik({
    initialValues: {
      product_id: "",
      quantity: 1,
      low_stock_threshold: 10,
      batch_number: "",
    },
    validationSchema,
    onSubmit: (values) => {
      addStockMutation.mutate(
        {
          product_id: Number(values.product_id),
          quantity: values.quantity,
          low_stock_threshold: values.low_stock_threshold,
          batch_number: values.batch_number || undefined,
        },
        {
          onSuccess: () => {
            toast.success("Stock added successfully");
            handleClose();
          },
          onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to add stock");
          },
        }
      );
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
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <Dialog.Title className="text-lg font-semibold leading-none tracking-tight">
              Add Central Stock
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground">
              Add products to the central warehouse inventory.
            </Dialog.Description>
          </div>

          <form onSubmit={formik.handleSubmit} className="grid gap-6 py-4">
            <CustomFormSelect
              name="product_id"
              label="Select Product"
              formik={formik}
              options={productOptions}
              placeholder="Search product..."
            />

            <div className="grid grid-cols-2 gap-4">
              <CustomFormInput
                name="quantity"
                label="Quantity"
                type="number"
                formik={formik}
              />
              <CustomFormInput
                name="low_stock_threshold"
                label="Low Stock Alert"
                type="number"
                formik={formik}
              />
            </div>

            <CustomFormInput
              name="batch_number"
              label="Batch Number (Optional)"
              formik={formik}
              placeholder="e.g. BATCH-2024-001"
            />

            <div className="flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addStockMutation.isPending}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
              >
                {addStockMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Add Stock"
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
