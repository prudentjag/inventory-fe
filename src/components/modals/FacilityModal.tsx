// import { useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CustomFormInput } from "../form/CustomFormInput";
import { useCreateFacility, useUpdateFacility } from "../../data/facilities";
import { useUnits } from "../../data/units";
import type { Facility, FacilityType } from "../../types";

interface FacilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  facility?: Facility | null;
}

const FACILITY_TYPES: { value: FacilityType; label: string }[] = [
  { value: "pitch", label: "Football Pitch" },
  { value: "event_hall", label: "Event Hall" },
  { value: "court", label: "Court" },
  { value: "conference_room", label: "Conference Room" },
];

export default function FacilityModal({
  isOpen,
  onClose,
  facility,
}: FacilityModalProps) {
  const { data: units } = useUnits(true);
  const createFacility = useCreateFacility();
  const updateFacility = useUpdateFacility();

  const validationSchema = Yup.object({
    name: Yup.string().required("Name is required"),
    type: Yup.string()
      .oneOf(["pitch", "event_hall", "court", "conference_room"])
      .required("Type is required"),
    description: Yup.string().nullable(),
    hourly_rate: Yup.number()
      .min(0, "Rate must be positive")
      .required("Hourly rate is required"),
    capacity: Yup.number().min(0).nullable(),
    unit_id: Yup.number()
      .min(1, "Unit is required")
      .required("Unit is required"),
    is_active: Yup.boolean(),
  });

  const formik = useFormik({
    initialValues: {
      name: facility?.name || "",
      type: facility?.type || "pitch",
      description: facility?.description || "",
      hourly_rate: facility?.hourly_rate || 0,
      capacity: facility?.capacity || "",
      unit_id: facility?.unit_id || units?.[0]?.id || "",
      is_active: facility?.is_active ?? true,
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      const payload = {
        name: values.name,
        type: values.type as FacilityType,
        description: values.description || undefined,
        hourly_rate: Number(values.hourly_rate),
        capacity: values.capacity ? Number(values.capacity) : undefined,
        unit_id: Number(values.unit_id),
        is_active: values.is_active,
      };

      try {
        if (facility) {
          await updateFacility.mutateAsync({ id: facility.id, ...payload });
          toast.success("Facility updated successfully");
        } else {
          await createFacility.mutateAsync(payload);
          toast.success("Facility created successfully");
        }
        handleClose();
      } catch (error: any) {
        toast.error(
          error.response?.data?.message ||
            (facility ? "Failed to update" : "Failed to create")
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
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] border border-border bg-background p-6 shadow-lg rounded-lg">
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-lg font-semibold">
              {facility ? "Edit Facility" : "Add Facility"}
            </Dialog.Title>
            <Dialog.Close className="p-1 hover:bg-accent rounded-md">
              <X size={20} />
            </Dialog.Close>
          </div>

          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <CustomFormInput
              name="name"
              label="Name"
              formik={formik}
              placeholder="e.g. Main Football Pitch"
            />

            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium">
                Type
              </label>
              <select
                id="type"
                name="type"
                className="w-full h-12 px-3 rounded-md border border-input bg-background"
                value={formik.values.type}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              >
                {FACILITY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {formik.touched.type && formik.errors.type && (
                <p className="text-sm text-destructive">{formik.errors.type}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={2}
                className="w-full px-3 py-2 rounded-md border border-input bg-background resize-none"
                placeholder="Optional description..."
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <CustomFormInput
                name="hourly_rate"
                label="Hourly Rate (₦)"
                type="number"
                formik={formik}
              />
              <CustomFormInput
                name="capacity"
                label="Capacity"
                type="number"
                formik={formik}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="unit_id" className="text-sm font-medium">
                Unit
              </label>
              <select
                id="unit_id"
                name="unit_id"
                className="w-full h-12 px-3 rounded-md border border-input bg-background"
                value={formik.values.unit_id}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              >
                <option value="">Select Unit</option>
                {units?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              {formik.touched.unit_id && formik.errors.unit_id && (
                <p className="text-sm text-destructive">
                  {formik.errors.unit_id}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formik.values.is_active}
                onChange={formik.handleChange}
                className="rounded border-input"
              />
              <label htmlFor="is_active" className="text-sm">
                Active (available for booking)
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium border border-input rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createFacility.isPending || updateFacility.isPending}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {createFacility.isPending || updateFacility.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : facility ? (
                  "Update"
                ) : (
                  "Create"
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
