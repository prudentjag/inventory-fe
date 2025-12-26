import * as Dialog from "@radix-ui/react-dialog";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useState, useRef } from "react";
import { CustomFormInput } from "../form/CustomFormInput";
import { useCreateBrand, useUpdateBrand } from "../../data/brands";
import { useCategories } from "../../data/categories";
import type { Brand } from "../../types";

interface BrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  brand?: Brand | null;
}

export function BrandModal({ isOpen, onClose, brand }: BrandModalProps) {
  const createBrandMutation = useCreateBrand();
  const updateBrandMutation = useUpdateBrand();
  const { data: categories = [] } = useCategories();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validationSchema = Yup.object({
    name: Yup.string().required("Required"),
    category_id: Yup.number().nullable(),
  });

  const formik = useFormik({
    initialValues: brand || {
      id: 0,
      name: "",
      category_id: "",
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      const payload = {
        name: values.name,
        category_id: values.category_id
          ? Number(values.category_id)
          : undefined,
        image: imageFile,
      };

      if (brand) {
        updateBrandMutation.mutate(
          { id: brand.id, data: payload },
          {
            onSuccess: () => {
              toast.success("Brand updated successfully");
              handleClose();
            },
            onError: (error: any) => {
              toast.error(
                error.response?.data?.message || "Failed to update brand"
              );
            },
          }
        );
      } else {
        createBrandMutation.mutate(payload, {
          onSuccess: () => {
            toast.success("Brand created successfully");
            handleClose();
          },
          onError: (error: any) => {
            toast.error(
              error.response?.data?.message || "Failed to create brand"
            );
          },
        });
      }
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    onClose();
    formik.resetForm();
    setImageFile(null);
    setImagePreview(null);
  };

  const isPending =
    createBrandMutation.isPending || updateBrandMutation.isPending;

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <Dialog.Title className="text-lg font-semibold leading-none tracking-tight">
              {brand ? "Edit Brand" : "Add New Brand"}
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground">
              {brand
                ? "Update brand details."
                : "Create a new brand definition."}
            </Dialog.Description>
          </div>

          <form onSubmit={formik.handleSubmit} className="grid gap-6 py-4">
            <CustomFormInput
              name="name"
              label="Brand Name"
              formik={formik}
              placeholder="e.g. Nike"
            />

            <div className="space-y-2">
              <label htmlFor="category_id" className="text-sm font-medium">
                Default Category (Optional)
              </label>
              <select
                id="category_id"
                name="category_id"
                className="w-full h-12 px-3 rounded-md border border-input bg-background"
                value={formik.values.category_id || ""}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Brand Image (Optional)
              </label>
              <div className="flex items-center gap-4">
                {/* Preview */}
                {(imagePreview || brand?.image) && (
                  <div className="relative w-20 h-20 rounded-lg border border-border overflow-hidden bg-secondary/50">
                    <img
                      src={imagePreview || brand?.image || ""}
                      alt="Brand preview"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-1 -right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                {/* Upload Button */}
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-input rounded-lg cursor-pointer hover:border-primary/50 hover:bg-secondary/30 transition-all">
                  <Upload size={18} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {imageFile ? imageFile.name : "Upload image"}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

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
                ) : brand ? (
                  "Save Changes"
                ) : (
                  "Create Brand"
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
