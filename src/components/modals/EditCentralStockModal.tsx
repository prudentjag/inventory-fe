import * as Dialog from "@radix-ui/react-dialog";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CustomFormInput } from "../form/CustomFormInput";
import { useUpdateStock } from "../../data/stock";
import type { Stock, Product } from "../../types";

interface EditCentralStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: (Stock & { product?: Product }) | null;
}

export function EditCentralStockModal({
  isOpen,
  onClose,
  stock,
}: EditCentralStockModalProps) {
  const updateStockMutation = useUpdateStock();

  const validationSchema = Yup.object({
    quantity: Yup.number().min(0, "Must be at least 0").required("Required"),
    low_stock_threshold: Yup.number().min(0, "Cannot be negative"),
    batch_number: Yup.string().nullable(),
  });

  const formik = useFormik({
    initialValues: {
      quantity: stock?.quantity || 0,
      low_stock_threshold: stock?.low_stock_threshold || 0,
      batch_number: stock?.batch_number || "",
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: (values) => {
      if (!stock) return;

      updateStockMutation.mutate(
        {
          id: stock.id,
          data: {
            quantity: values.quantity,
            low_stock_threshold: values.low_stock_threshold,
            batch_number: values.batch_number || undefined,
          },
        },
        {
          onSuccess: () => {
            toast.success("Stock updated successfully");
            onClose();
          },
          onError: (error: any) => {
            toast.error(
              error.response?.data?.message || "Failed to update stock"
            );
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
              Edit Central Stock
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground">
              Update details for {stock?.product?.name || "this item"}.
            </Dialog.Description>
          </div>

          <form onSubmit={formik.handleSubmit} className="grid gap-6 py-4">
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
                disabled={updateStockMutation.isPending}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
              >
                {updateStockMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Update Stock"
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
