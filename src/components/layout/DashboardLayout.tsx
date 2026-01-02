import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Settings,
  LogOut,
  Menu,
  Store,
  CreditCard,
  Archive,
  Warehouse,
  ClipboardList,
  History as HistoryIcon,
  FileText,
  Building2,
  CalendarDays,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../context/AuthContext";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "hidden md:flex bg-card border-r border-border transition-all duration-300 flex-col z-20",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
              IM
            </div>
            {isSidebarOpen && (
              <span className="font-bold text-lg tracking-tight">
                InvManager
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          <NavItem
            to="/dashboard"
            end
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            isOpen={isSidebarOpen}
          />
          <NavItem
            to="/dashboard/pos"
            icon={<ShoppingCart size={20} />}
            label="POS"
            isOpen={isSidebarOpen}
          />
          <NavItem
            to="/dashboard/transactions"
            icon={<CreditCard size={20} />}
            label="Transactions"
            isOpen={isSidebarOpen}
          />
          <NavItem
            to="/dashboard/invoices"
            icon={<FileText size={20} />}
            label="Invoices"
            isOpen={isSidebarOpen}
          />

          {/* Stockist & Admin: Central Stock */}
          {["admin", "stockist"].includes(user?.role || "") && (
            <>
              <NavItem
                to="/dashboard/central-stock"
                icon={<Warehouse size={20} />}
                label="Central Stock"
                isOpen={isSidebarOpen}
              />
            </>
          )}
          <NavItem
            to="/dashboard/stock-requests"
            icon={<ClipboardList size={20} />}
            label="Stock Requests"
            isOpen={isSidebarOpen}
          />
          <NavItem
            to="/dashboard/facilities"
            icon={<Building2 size={20} />}
            label="Facilities"
            isOpen={isSidebarOpen}
          />
          <NavItem
            to="/dashboard/bookings"
            icon={<CalendarDays size={20} />}
            label="Bookings"
            isOpen={isSidebarOpen}
          />

          {/* Admin & Manager sections */}
          {["admin", "manager", "stockist"].includes(user?.role || "") && (
            <>
              {/* {user?.role === "admin" && (
                <NavItem
                  to="/dashboard/products"
                  icon={<Archive size={20} />}
                  label="Product Catalog"
                  isOpen={isSidebarOpen}
                />
              )} */}
              <NavItem
                to="/dashboard/inventory"
                icon={<Package size={20} />}
                label="Unit Inventory"
                isOpen={isSidebarOpen}
              />
              <NavItem
                to="/dashboard/staff"
                icon={<Users size={20} />}
                label="Staff"
                isOpen={isSidebarOpen}
              />
              <NavItem
                to="/dashboard/units"
                icon={<Store size={20} />}
                label="Units"
                isOpen={isSidebarOpen}
              />
              <NavItem
                to="/dashboard/audit-logs"
                icon={<HistoryIcon size={20} />}
                label="Central Audit"
                isOpen={isSidebarOpen}
              />
            </>
          )}

          {user?.role === "admin" && (
            <NavItem
              to="/dashboard/settings"
              icon={<Settings size={20} />}
              label="Settings"
              isOpen={isSidebarOpen}
            />
          )}
        </nav>

        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors",
              !isSidebarOpen && "justify-center"
            )}
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 z-10">
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-accent rounded-md text-foreground"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-4">
            {/* Unit Selector (Mock) */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-full border border-border text-sm">
              <Store size={14} className="text-muted-foreground" />
              <span className="font-medium text-foreground">
                {user?.units?.[0]?.name
                  ? user.units[0].name
                  : user?.assigned_unit_id
                  ? `Unit ID: ${user.assigned_unit_id}`
                  : ["admin", "stockist"].includes(user?.role || "")
                  ? "Central Warehouse"
                  : "No Unit Assigned"}
              </span>
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-border">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium leading-none">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.role || "Guest"}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium border border-primary/20">
                {user?.name?.charAt(0) || "U"}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-secondary/20 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({
  to,
  icon,
  label,
  isOpen,
  end,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  isOpen: boolean;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 p-3 rounded-md transition-all duration-200 group",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
          !isOpen && "justify-center"
        )
      }
    >
      <div className="relative">{icon}</div>
      {isOpen && <span className="font-medium">{label}</span>}
    </NavLink>
  );
}
