import * as Dialog from "@radix-ui/react-dialog";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CustomFormInput } from "../form/CustomFormInput";
import { useCreateCategory, useUpdateCategory } from "../../data/categories";
import type { Category } from "../../types";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category | null;
}

export function CategoryModal({
  isOpen,
  onClose,
  category,
}: CategoryModalProps) {
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();

  const validationSchema = Yup.object({
    name: Yup.string().required("Required"),
    description: Yup.string().nullable(),
  });

  const formik = useFormik({
    initialValues: category || {
      id: 0,
      name: "",
      description: "",
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      const payload = {
        name: values.name,
        description: values.description || undefined,
      };

      if (category) {
        updateCategoryMutation.mutate(
          { id: category.id, data: payload },
          {
            onSuccess: () => {
              toast.success("Category updated successfully");
              handleClose();
            },
            onError: (error: any) => {
              toast.error(
                error.response?.data?.message || "Failed to update category"
              );
            },
          }
        );
      } else {
        createCategoryMutation.mutate(payload, {
          onSuccess: () => {
            toast.success("Category created successfully");
            handleClose();
          },
          onError: (error: any) => {
            toast.error(
              error.response?.data?.message || "Failed to create category"
            );
          },
        });
      }
    },
  });

  const handleClose = () => {
    onClose();
    formik.resetForm();
  };

  const isPending =
    createCategoryMutation.isPending || updateCategoryMutation.isPending;

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <Dialog.Title className="text-lg font-semibold leading-none tracking-tight">
              {category ? "Edit Category" : "Add New Category"}
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground">
              {category
                ? "Update category details."
                : "Create a new category definition."}
            </Dialog.Description>
          </div>

          <form onSubmit={formik.handleSubmit} className="grid gap-6 py-4">
            <CustomFormInput
              name="name"
              label="Category Name"
              formik={formik}
              placeholder="e.g. Beverages"
            />

            <CustomFormInput
              name="description"
              label="Description (Optional)"
              formik={formik}
              placeholder="e.g. Alcoholic and non-alcoholic drinks"
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
                disabled={isPending}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : category ? (
                  "Save Changes"
                ) : (
                  "Create Category"
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
