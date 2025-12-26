import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAuth } from "../context/AuthContext";
import { CustomFormInput } from "../components/form/CustomFormInput";

import { toast } from "sonner";

export default function LoginPage() {
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email address").required("Required"),
      password: Yup.string().required("Required"),
    }),
    onSubmit: async (values) => {
      setError("");
      const toastId = toast.loading("Signing in...");
      try {
        await login(values.email, values.password);
        toast.dismiss(toastId);
        toast.success("Welcome back!");
        navigate("/dashboard");
      } catch (err) {
        toast.dismiss(toastId);
        toast.error("Invalid credentials");
        setError("Invalid credentials");
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-xl shadow-lg border border-border">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to your inventory workspace
          </p>
        </div>

        <form onSubmit={formik.handleSubmit} className="space-y-6 mt-8">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}
          <CustomFormInput
            name="email"
            label="Email Address"
            formik={formik}
            placeholder="Enter your email"
          />

          <CustomFormInput
            name="password"
            label="Password"
            type="password"
            formik={formik}
            placeholder="Enter your password"
          />

          <button
            type="submit"
            className="w-full py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
