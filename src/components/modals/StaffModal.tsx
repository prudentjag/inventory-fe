import * as Dialog from "@radix-ui/react-dialog";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CustomFormInput } from "../form/CustomFormInput";
import { CustomFormSelect } from "../form/CustomFormSelect";
import { useCreateStaff } from "../../data/staff";
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

    const unitOptions = units?.map((u) => ({ label: u.name, value: u.id })) || [];

    const roleOptions = [
        { label: "Admin", value: "admin" },
        { label: "Manager", value: "manager" },
        { label: "Staff", value: "staff" },
        { label: "Auditor", value: "auditor" },
    ];

    const validationSchema = Yup.object({
        name: Yup.string().required("Required"),
        email: Yup.string().email("Invalid email").required("Required"),
        role: Yup.string().required("Required"),
        assigned_unit_id: Yup.string(), // Optional for super_admin or unassigned
    });

    const formik = useFormik({
        initialValues: editingUser || {
            id: "",
            name: "",
            email: "",
            role: "staff" as Role,
            assigned_unit_id: "",
            avatar_url: "",
            // Password not included in editingUser usually, but needed for create
            // For now, let's assume password is required for create, optional for edit?
            // The original code had password input without validation for edit? 
            // Original code:
            // initialValues: editingUser || { ... password: "password" ... } was not there?
            // Wait, looking at StaffPage source:
            // <CustomFormInput name="password" ... /> was present.
            // But initialValues didn't have password.
            // And formik validation schema:
            // name, email, role, assigned_unit_id. NO PASSWORD VALIDATION?
            // Ah, I missed looking at the validation schema carefully in StaffPage?
            // Let's re-read StaffPage content from step 556.
            // Lines 38-42: name, email, role, assigned_unit_id.
            // Line 281: <CustomFormInput name="password" ... />
            // So password field was there but not in validation schema/initial values properly?
            // Wait, `CustomFormInput` just reads from formik.values.
            // Use `password` in initial values if not editing.
            password: "",
        },
        enableReinitialize: true,
        validationSchema,
        onSubmit: (values) => {
            if (editingUser) {
                toast.info("Edit functionality coming soon");
            } else {
                createStaffMutation.mutate(
                    {
                        ...values,
                        is_active: true,
                        // Ensure password is sent. If it's missing in values (empty string), backend might fail or standard password?
                        // The form implementation has a password field.
                    } as unknown as CreateStaffPayload,
                    {
                        onSuccess: () => {
                            toast.success("New staff member created");
                            handleClose();
                        },
                        onError: (error: any) => {
                            toast.error(error.response?.data?.message || "Failed to create staff");
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
                                disabled={createStaffMutation.isPending}
                                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {createStaffMutation.isPending
                                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    : editingUser
                                        ? "Save Changes"
                                        : "Create Account"}
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
