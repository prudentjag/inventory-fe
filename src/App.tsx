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
import ProductsPage from "./pages/ProductsPage";
import { UnitsPage } from "./pages/UnitsPage";
import SettingsPage from "./pages/SettingsPage";
import { CentralStockPage } from "./pages/CentralStockPage";
import { StockRequestsPage } from "./pages/StockRequestsPage";
import { AuditLogsPage } from "./pages/AuditLogsPage";

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
              <Route path="products" element={<ProductsPage />} />
              <Route path="units" element={<UnitsPage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="central-stock" element={<CentralStockPage />} />
              <Route path="stock-requests" element={<StockRequestsPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
