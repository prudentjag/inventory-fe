import * as Dialog from "@radix-ui/react-dialog";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CustomFormSelect } from "../form/CustomFormSelect";
import { CustomFormInput } from "../form/CustomFormInput";
import { useProducts } from "../../data/products";
import { useUnits } from "../../data/units";
import { useCreateStockRequest } from "../../data/stockRequests";
import { useAuth } from "../../context/AuthContext";

interface RequestStockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RequestStockModal({ isOpen, onClose }: RequestStockModalProps) {
  const { user } = useAuth();
  const { data: products } = useProducts();
  const { data: units } = useUnits();
  const createRequestMutation = useCreateStockRequest();

  const productOptions =
    products?.map((p) => ({
      label: `${p.name} (${p.sku})`,
      value: String(p.id),
    })) || [];

  const unitOptions =
    units?.map((u) => ({
      label: u.name,
      value: String(u.id),
    })) || [];

    const staffunitOptions =
      user?.units?.map((u) => ({
        label: u.name,
        value: String(u.id),
      })) || [];

  // If user is assigned to a unit, default to that unit
  const defaultUnitId = user?.assigned_unit_id
    ? String(user.assigned_unit_id)
    : "";

  // Staff with assigned unit don't need to select a unit
  const isUnitSelectorHidden =
    user?.role === "staff" || !!user?.assigned_unit_id;

  const validationSchema = Yup.object({
    unit_id: isUnitSelectorHidden
      ? Yup.string()
      : Yup.string().required("Required"),
    product_id: Yup.string().required("Required"),
    quantity: Yup.number().min(1, "Must be at least 1").required("Required"),
    notes: Yup.string(),
  });

  const formik = useFormik({
    initialValues: {
      unit_id: defaultUnitId,
      product_id: "",
      quantity: 1,
      notes: "",
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: (values) => {
      // Use assigned_unit_id for staff, otherwise use selected unit
      const unitId =
        isUnitSelectorHidden && user?.assigned_unit_id
          ? user.assigned_unit_id
          : Number(values.unit_id);

      createRequestMutation.mutate(
        {
          unit_id: unitId,
          product_id: Number(values.product_id),
          quantity: values.quantity,
          notes: values.notes || undefined,
        },
        {
          onSuccess: () => {
            toast.success("Stock request submitted successfully");
            handleClose();
          },
          onError: (error: any) => {
            toast.error(
              error.response?.data?.message || "Failed to submit request"
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
              Request Stock
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground">
              Request products from the central warehouse for your unit.
            </Dialog.Description>
          </div>

          <form onSubmit={formik.handleSubmit} className="grid gap-6 py-4">
            {/* Only show unit selector for managers/admins or users without assigned unit */}

            <CustomFormSelect
              name="unit_id"
              label="Requesting Unit"
              formik={formik}
              options={isUnitSelectorHidden ? staffunitOptions : unitOptions}
              placeholder="Select unit..."
            />

            <CustomFormSelect
              name="product_id"
              label="Select Product"
              formik={formik}
              options={productOptions}
              placeholder="Search product..."
            />

            <CustomFormInput
              name="quantity"
              label="Quantity Needed"
              type="number"
              formik={formik}
            />

            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className="w-full px-3 py-2 rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Any additional notes for the stockist..."
                value={formik.values.notes}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
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
                disabled={createRequestMutation.isPending}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
              >
                {createRequestMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Submit Request"
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
