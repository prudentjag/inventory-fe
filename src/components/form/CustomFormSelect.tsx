import { Label } from "../ui/label";
import type { FormikProps } from "formik";
import { cn } from "../../lib/utils";

interface CustomFormSelectProps {
  name: string;
  label: string;
  formik: FormikProps<any>;
  options: { label: string; value: string }[];
  placeholder?: string;
}

export const CustomFormSelect = ({
  name,
  label,
  formik,
  options,
  placeholder = "Select an option",
}: CustomFormSelectProps) => {
  return (
    <div className="grid w-full items-center gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <div className="relative">
        <select
          id={name}
          name={name}
          className={cn(
            "w-full py-6 px-3 border border-primary-foreground rounded-md bg-white text-gray-900 focus:border-primary-foreground focus:ring-2 focus:ring-primary-foreground dark:bg-gray-800 dark:border-primary-foreground dark:text-gray-100 appearance-none",
            !formik.values[name] && "text-muted-foreground"
          )}
          value={formik.values[name] || ""}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {/* Custom Arrow Icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>
      {formik.touched[name] && formik.errors[name] && (
        <p className="text-red-500 text-sm">{String(formik.errors[name])}</p>
      )}
    </div>
  );
};
