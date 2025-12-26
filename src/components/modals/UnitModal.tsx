import * as Dialog from "@radix-ui/react-dialog";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "sonner";
import { CustomFormInput } from "../form/CustomFormInput";
import { CustomFormSelect } from "../form/CustomFormSelect";
import { useCreateUnit } from "../../data/units";
import { Loader2 } from "lucide-react";

interface UnitModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function UnitModal({ isOpen, onClose }: UnitModalProps) {
    const createUnitMutation = useCreateUnit();

    const unitTypes = [
        { label: "Bar", value: "bar" },
        { label: "Kitchen", value: "kitchen" },
        { label: "Supermarket", value: "supermarket" },
        { label: "Club", value: "club" },
        { label: "Football Pitch", value: "football_pitch" },
        { label: "Other", value: "other" },
    ];

    const validationSchema = Yup.object({
        name: Yup.string().required("Required"),
        type: Yup.string().required("Required"),
        address: Yup.string().optional(),
    });

    const formik = useFormik({
        initialValues: {
            name: "",
            type: "",
            address: "",
        },
        validationSchema,
        onSubmit: (values) => {
            createUnitMutation.mutate(values as any, {
                onSuccess: () => {
                    toast.success("Unit created successfully");
                    handleClose();
                },
                onError: (error: any) => {
                    toast.error(error.response?.data?.message || "Failed to create unit");
                },
            });
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
                <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
                    <div className="flex flex-col space-y-1.5">
                        <Dialog.Title className="text-lg font-semibold">Create New Unit</Dialog.Title>
                        <Dialog.Description className="text-sm text-muted-foreground">
                            Add a new unit to tracking inventory and sales.
                        </Dialog.Description>
                    </div>
                    <form onSubmit={formik.handleSubmit} className="grid gap-4 py-4">
                        <CustomFormInput
                            name="name"
                            label="Unit Name"
                            placeholder="e.g. Main Bar"
                            formik={formik}
                        />
                        <CustomFormSelect
                            name="type"
                            label="Unit Type"
                            options={unitTypes}
                            placeholder="Select type"
                            formik={formik}
                        />
                        <CustomFormInput
                            name="address"
                            label="Location / Address"
                            placeholder="e.g. Ground Floor"
                            formik={formik}
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2 rounded-md border hover:bg-muted"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createUnitMutation.isPending}
                                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                            >
                                {createUnitMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Unit"}
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
