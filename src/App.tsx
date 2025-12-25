import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/AuthContext";
import DashboardLayout from "./components/layout/DashboardLayout";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import PosPage from "./pages/PosPage";
import InventoryPage from "./pages/InventoryPage";
import StaffPage from "./pages/StaffPage";
import DashboardOverview from "./pages/DashboardOverview";
import TransactionsPage from "./pages/TransactionsPage";

// Placeholder Pages
const Settings = () => <h1 className="text-2xl font-bold">System Settings</h1>;

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading)
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

import { Toaster } from "sonner";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardOverview />} />
              <Route path="pos" element={<PosPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
