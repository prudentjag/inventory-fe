import * as Dialog from "@radix-ui/react-dialog";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CustomFormSelect } from "../form/CustomFormSelect";
import { useUsers } from "../../data/staff";
import { useAssignStaff } from "../../data/units";
import type { Unit } from "../../types";

interface AssignStaffModalProps {
    isOpen: boolean;
    onClose: () => void;
    unit: Unit | null;
}

export function AssignStaffModal({ isOpen, onClose, unit }: AssignStaffModalProps) {
    const { data: apiUsers } = useUsers();
    const assignStaffMutation = useAssignStaff();

    // Filter users: 
    // 1. Exclude users ALREADY assigned to THIS unit using the nested users list.
    const users = apiUsers?.data || [];

    const assignedUserIds = new Set(unit?.users?.map(u => u.id) || []);
    const availableUsers = users.filter(user => !assignedUserIds.has(user.id));

    const userOptions = availableUsers.map(u => ({
        label: `${u.name} (${u.role}) ${u.assigned_unit_id ? '- Reassign' : ''}`,
        value: String(u.id)
    }));

    const validationSchema = Yup.object({
        user_id: Yup.string().required("Required"),
    });

    const formik = useFormik({
        initialValues: {
            user_id: "",
        },
        enableReinitialize: true, // Reset when reopening or unit changes
        validationSchema,
        onSubmit: (values) => {
            if (!unit) return;

            assignStaffMutation.mutate(
                {
                    unitId: unit.id,
                    userId: values.user_id,
                },
                {
                    onSuccess: () => {
                        toast.success("Staff assigned to unit");
                        handleClose();
                    },
                    onError: (error: any) => {
                        toast.error(error.response?.data?.message || "Failed to assign staff");
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
                            Assign Staff to {unit?.name}
                        </Dialog.Title>
                        <Dialog.Description className="text-sm text-muted-foreground">
                            Select a staff member to assign to this unit.
                        </Dialog.Description>
                    </div>

                    <form onSubmit={formik.handleSubmit} className="grid gap-6 py-4">
                        <CustomFormSelect
                            name="user_id"
                            label="Select Staff Member"
                            formik={formik}
                            options={userOptions}
                            placeholder="Select a user..."
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
                                disabled={assignStaffMutation.isPending}
                                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
                            >
                                {assignStaffMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    "Assign Staff"
                                )}
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
