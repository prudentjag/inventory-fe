import * as Dialog from "@radix-ui/react-dialog";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CustomFormInput } from "../form/CustomFormInput";
import { CustomFormSelect } from "../form/CustomFormSelect";
import { useCreateStaff, useUpdateUser } from "../../data/staff";
import { useUnits } from "../../data/units";
import type { User, Role, CreateStaffPayload } from "../../types";

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingUser?: User | null;
}

export function StaffModal({ isOpen, onClose, editingUser }: StaffModalProps) {
  const { data: units } = useUnits();
  const createStaffMutation = useCreateStaff();
  const updateUserMutation = useUpdateUser();

  const unitOptions = units?.map((u) => ({ label: u.name, value: u.id })) || [];

  const roleOptions = [
    { label: "Admin", value: "admin" },
    { label: "Manager", value: "manager" },
    { label: "Staff", value: "staff" },
    { label: "Auditor", value: "auditor" },
    { label: "Stockist", value: "stockist" },
  ];

  const validationSchema = Yup.object({
    name: Yup.string().required("Required"),
    email: Yup.string().email("Invalid email").required("Required"),
    role: Yup.string().required("Required"),
    assigned_unit_id: Yup.string(), // Optional for super_admin or unassigned
    password: editingUser
      ? Yup.string()
      : Yup.string()
          .min(6, "Password must be at least 6 characters")
          .required("Required"),
  });

  const formik = useFormik({
    initialValues: editingUser
      ? {
          id: editingUser.id || "",
          name: editingUser.name || "",
          email: editingUser.email || "",
          role: (editingUser.role as Role) || "staff",
          assigned_unit_id:
            editingUser.assigned_unit_id || editingUser.units?.[0]?.id || "",
          avatar_url: editingUser.avatar_url || "",
          password: "",
        }
      : {
          id: "",
          name: "",
          email: "",
          role: "staff" as Role,
          assigned_unit_id: "",
          avatar_url: "",
          password: "",
        },
    enableReinitialize: true,
    validationSchema,
    onSubmit: (values) => {
      if (editingUser) {
        // Remove password if empty string (don't update password)
        const { password, ...otherValues } = values;
        const payload = password ? values : otherValues;

        updateUserMutation.mutate(
          {
            id: String(editingUser.id),
            data: payload as any,
          },
          {
            onSuccess: () => {
              toast.success("Staff member updated");
              handleClose();
            },
            onError: (error: any) => {
              toast.error(
                error.response?.data?.message || "Failed to update staff"
              );
            },
          }
        );
      } else {
        createStaffMutation.mutate(
          {
            ...values,
            is_active: true,
          } as unknown as CreateStaffPayload,
          {
            onSuccess: () => {
              toast.success("New staff member created");
              handleClose();
            },
            onError: (error: any) => {
              toast.error(
                error.response?.data?.message || "Failed to create staff"
              );
            },
          }
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
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <Dialog.Title className="text-lg font-semibold leading-none tracking-tight">
              {editingUser ? "Edit Staff Member" : "Add New Staff"}
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground">
              {editingUser
                ? "Update user permissions and details."
                : "Create a new account for your team."}
            </Dialog.Description>
          </div>

          <form onSubmit={formik.handleSubmit} className="grid gap-6 py-4">
            <CustomFormInput
              name="name"
              label="Full Name"
              formik={formik}
              placeholder="e.g. John Doe"
            />
            <CustomFormInput
              name="email"
              label="Email Address"
              formik={formik}
              placeholder="e.g. john@example.com"
            />
            <CustomFormInput
              name="password"
              label="Password"
              formik={formik}
              placeholder="e.g. password"
            />
            <div className="grid grid-cols-2 gap-4">
              <CustomFormSelect
                name="role"
                label="Role"
                formik={formik}
                options={roleOptions}
              />

              <CustomFormSelect
                name="assigned_unit_id"
                label="Assigned Unit"
                formik={formik}
                options={unitOptions}
                placeholder="No Unit Assigned"
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
                disabled={
                  createStaffMutation.isPending || updateUserMutation.isPending
                }
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createStaffMutation.isPending ||
                updateUserMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : editingUser ? (
                  "Save Changes"
                ) : (
                  "Create Account"
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
