import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAuth } from "../context/AuthContext";
import { MOCK_USERS } from "../services/mockData";
import { CustomFormInput } from "../components/form/CustomFormInput";

import { toast } from "sonner";

export default function LoginPage() {
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      email: "admin@system.com",
    },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email address").required("Required"),
    }),
    onSubmit: async (values) => {
      setError("");
      const toastId = toast.loading("Signing in...");
      try {
        await login(values.email);
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
          <CustomFormInput
            name="email"
            label="Email Address"
            formik={formik}
            placeholder="Enter your email"
          />

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground text-center mb-4">
            Demo Accounts:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {MOCK_USERS.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => formik.setFieldValue("email", user.email)}
                className="px-3 py-1 text-xs rounded-full bg-accent hover:bg-accent/80 transition-colors text-foreground"
              >
                {user.role}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
