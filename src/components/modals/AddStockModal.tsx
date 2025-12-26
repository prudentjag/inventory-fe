import * as Dialog from "@radix-ui/react-dialog";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CustomFormSelect } from "../form/CustomFormSelect";
import { CustomFormInput } from "../form/CustomFormInput";
import { useProducts } from "../../data/products";
import { useAddInventory } from "../../data/inventory";
import { useAuth } from "../../context/AuthContext";

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddStockModal({ isOpen, onClose }: AddStockModalProps) {
  const { user } = useAuth();
  const { data: products } = useProducts();
  const addInventoryMutation = useAddInventory();

  const productOptions =
    products?.data?.map((p) => ({
      label: `${p.name} (${p.sku})`,
      value: String(p.id),
    })) || [];

  const validationSchema = Yup.object({
    product_id: Yup.string().required("Required"),
    quantity: Yup.number().min(1, "Must be at least 1").required("Required"),
    low_stock_threshold: Yup.number().min(0, "Cannot be negative"),
  });

  const formik = useFormik({
    initialValues: {
      product_id: "",
      quantity: 1,
      low_stock_threshold: 10,
    },
    validationSchema,
    onSubmit: (values) => {
      if (!user?.assigned_unit_id) {
        toast.error("You are not assigned to a unit");
        return;
      }

      addInventoryMutation.mutate(
        {
          unit_id: user.assigned_unit_id,
          product_id: values.product_id,
          quantity: values.quantity,
          low_stock_threshold: values.low_stock_threshold,
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
              Restock Item
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground">
              Add existing products to your unit's inventory.
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
                label="Quantity to Add"
                type="number"
                formik={formik}
              />
              <CustomFormInput
                name="low_stock_threshold"
                label="Low Stock Alert at"
                type="number"
                formik={formik}
              />
            </div>

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
                disabled={addInventoryMutation.isPending}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
              >
                {addInventoryMutation.isPending ? (
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
