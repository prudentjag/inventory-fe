import { Input } from "../ui/input";
import { Label } from "../ui/label";
import type { FormikProps } from "formik";

interface CustomFormInputProps {
  name: string;
  label: string;
  formik: FormikProps<any>;
  type?: string;
  placeholder?: string;
}

export const CustomFormInput = ({
  name,
  label,
  formik,
  type = "text",
  placeholder,
}: CustomFormInputProps) => {
  return (
    <div className="grid w-full items-center gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        type={type}
        id={name}
        name={name}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        className="w-full py-6 border border-primary-foreground rounded-md bg-white text-gray-900 focus:border-primary-foreground focus:ring-2 focus:ring-primary-foreground dark:bg-gray-800 dark:border-primary-foreground dark:text-gray-100 dark:placeholder-gray-400"
        value={formik.values[name] || ""}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
      />
      {formik.touched[name] && formik.errors[name] && (
        <p className="text-red-500 text-sm">{String(formik.errors[name])}</p>
      )}
    </div>
  );
};
