import * as Dialog from "@radix-ui/react-dialog";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CustomFormInput } from "../form/CustomFormInput";
import { CustomFormSelect } from "../form/CustomFormSelect";
import { useCreateProduct } from "../../data/products";
import { useAddInventory } from "../../data/inventory";
import { useAuth } from "../../context/AuthContext";
import { useUnits } from "../../data/units";
import type { Product } from "../../types";

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product?: Product | null;
}

export function ProductModal({ isOpen, onClose, product }: ProductModalProps) {
    const { user } = useAuth();
    const createProductMutation = useCreateProduct();
    const addInventoryMutation = useAddInventory();

    const isManager = user?.role === "manager";

    // Fetch real units
    const { data: units } = useUnits();

    // Admins need to select a unit for initial stock
    const unitOptions = units?.map(u => ({ label: u.name, value: u.id })) || [];

    const validationSchema = Yup.object({
        name: Yup.string().required("Required"),
        sku: Yup.string().required("Required"),
        brand: Yup.string().required("Required"),
        category: Yup.string().required("Required"),
        price: Yup.number().positive("Must be positive").required("Required"),
        cost_price: Yup.number().positive("Must be positive").required("Required"),
        stock_quantity: Yup.number().min(0, "Cannot be negative"),
        unit_of_measurement: Yup.string().required("Required"),
        initial_unit_id: Yup.string().when("stock_quantity", {
            is: (val: number) => val > 0 && !isManager,
            then: (schema) => schema.required("Required when adding initial stock"),
            otherwise: (schema) => schema.optional(),
        }),
    });

    const formik = useFormik({
        initialValues: product || {
            id: "",
            name: "",
            sku: "",
            brand: "",
            category: "",
            price: 0,
            cost_price: 0,
            stock_quantity: 0,
            unit_of_measurement: "bottle",
            image_url: "",
            initial_unit_id: isManager ? user?.assigned_unit_id : "",
        },
        enableReinitialize: true,
        validationSchema,
        onSubmit: async (values) => {
            const { stock_quantity, initial_unit_id, ...productData } = values as any;

            if (product) {
                toast.info("Edit not implemented yet");
            } else {
                // Step 1: Create Product (Definition only)
                createProductMutation.mutate(
                    { ...productData } as Product,
                    {
                        onSuccess: (newProduct) => {
                            const productId = newProduct?.data?.id; // Accessing data from ApiResponse wrapper
                            // If mock or simplified, we might rely on invalidation. 
                            // But for chaining, we need the ID. 
                            // If API doesn't return ID in data, we can't chain immediately without refetch.
                            // Assuming backend returns the created Post structure.

                            if (stock_quantity > 0) {
                                // Determine Target ID
                                const targetUnitId = isManager ? user?.assigned_unit_id : initial_unit_id;

                                if (targetUnitId && productId) {
                                    // Step 2: Add Inventory
                                    addInventoryMutation.mutate({
                                        unit_id: targetUnitId,
                                        product_id: productId,
                                        quantity: Number(stock_quantity)
                                    }, {
                                        onSuccess: () => {
                                            toast.success("Product created and stock assigned");
                                            handleClose();
                                        },
                                        onError: () => {
                                            toast.warning("Product created, but failed to assign stock");
                                            handleClose();
                                        }
                                    });
                                } else {
                                    toast.success("Product created (No stock assigned)");
                                    handleClose();
                                }
                            } else {
                                toast.success("Product created");
                                handleClose();
                            }
                        },
                        onError: (error: any) => {
                            toast.error(
                                error.response?.data?.message || "Failed to create product"
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
                <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
                    <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                        <Dialog.Title className="text-lg font-semibold leading-none tracking-tight">
                            {product ? "Edit Product" : "Add New Product"}
                        </Dialog.Title>
                        <Dialog.Description className="text-sm text-muted-foreground">
                            {product
                                ? "Update product details below."
                                : "Add a new item to your global inventory."}
                        </Dialog.Description>
                    </div>

                    <form onSubmit={formik.handleSubmit} className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <CustomFormInput
                                name="name"
                                label="Product Name"
                                formik={formik}
                                placeholder="e.g. Star Radler"
                            />
                            <CustomFormInput
                                name="sku"
                                label="SKU / Barcode"
                                formik={formik}
                                placeholder="e.g. STR-001"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <CustomFormInput
                                name="brand"
                                label="Brand"
                                formik={formik}
                                placeholder="e.g. Star"
                            />
                            <CustomFormInput
                                name="category"
                                label="Category"
                                formik={formik}
                                placeholder="e.g. Beer"
                            />
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
                            <CustomFormInput
                                name="stock_quantity"
                                label="Initial Stock"
                                type="number"
                                formik={formik}
                            />
                            {/* Only show unit selector if admin and adding stock */}
                            {!isManager && formik.values.stock_quantity > 0 && (
                                <CustomFormSelect
                                    name="initial_unit_id"
                                    label="Add to Unit"
                                    formik={formik}
                                    options={unitOptions}
                                    placeholder="Select Unit"
                                />
                            )}
                        </div>

                        <CustomFormInput
                            name="unit_of_measurement"
                            label="Unit (e.g. Bottle, Pack)"
                            formik={formik}
                        />

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
                                disabled={createProductMutation.isPending || addInventoryMutation.isPending}
                                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
                            >
                                {createProductMutation.isPending || addInventoryMutation.isPending ? (
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
