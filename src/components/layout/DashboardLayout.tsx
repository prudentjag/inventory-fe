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
  X,
  BarChart2,
  ClipboardCheck,
  Factory,
  Utensils,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../context/AuthContext";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transform transition-transform duration-300 ease-in-out md:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
              IM
            </div>
            <span className="font-bold text-lg tracking-tight">InvManager</span>
          </div>
          <button
            onClick={closeMobileMenu}
            className="p-2 hover:bg-accent rounded-md text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          <NavItem
            to="/dashboard"
            end
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            isOpen={true}
            onClick={closeMobileMenu}
          />
          <NavItem
            to="/dashboard/pos"
            icon={<ShoppingCart size={20} />}
            label="POS"
            isOpen={true}
            onClick={closeMobileMenu}
          />
          <NavItem
            to="/dashboard/unit-pos"
            icon={<Factory size={20} />}
            label="Unit POS"
            isOpen={true}
            onClick={closeMobileMenu}
          />
          <NavItem
            to="/dashboard/transactions"
            icon={<CreditCard size={20} />}
            label={user?.role === "server" ? "My Sales" : "Transactions"}
            isOpen={true}
            onClick={closeMobileMenu}
          />
          <NavItem
            to="/dashboard/invoices"
            icon={<FileText size={20} />}
            label="Invoices"
            isOpen={true}
            onClick={closeMobileMenu}
          />
          {/* <NavItem
            to="/dashboard/invoices?view=guest"
            icon={<Users size={20} />}
            label="Guest Orders"
            isOpen={true}
            onClick={closeMobileMenu}
          /> */}
          <NavItem
            to="/menu"
            icon={<Utensils size={20} />}
            label="Public Menu"
            isOpen={true}
            onClick={closeMobileMenu}
            external
          />
          <NavItem
            to="/dashboard/daily-reports"
            icon={<ClipboardCheck size={20} />}
            label="Daily Reports"
            isOpen={true}
            onClick={closeMobileMenu}
          />

          {["admin", "stockist"].includes(user?.role || "") && (
            <NavItem
              to="/dashboard/central-stock"
              icon={<Warehouse size={20} />}
              label="Central Stock"
              isOpen={true}
              onClick={closeMobileMenu}
            />
          )}
          {["admin", "stockist"].includes(user?.role || "") && (
            <NavItem
              to="/dashboard/stock-insights"
              icon={<BarChart2 size={20} />}
              label="Stock Insights"
              isOpen={true}
              onClick={closeMobileMenu}
            />
          )}
          <NavItem
            to="/dashboard/stock-requests"
            icon={<ClipboardList size={20} />}
            label="Stock Requests"
            isOpen={true}
            onClick={closeMobileMenu}
          />
          <NavItem
            to="/dashboard/facilities"
            icon={<Building2 size={20} />}
            label="Facilities"
            isOpen={true}
            onClick={closeMobileMenu}
          />
          <NavItem
            to="/dashboard/bookings"
            icon={<CalendarDays size={20} />}
            label="Bookings"
            isOpen={true}
            onClick={closeMobileMenu}
          />

          {["admin", "manager", "stockist"].includes(user?.role || "") && (
            <>
              {["admin", "stockist"].includes(user?.role || "") && (
                <NavItem
                  to="/dashboard/products"
                  icon={<Archive size={20} />}
                  label="Product Catalog"
                  isOpen={true}
                  onClick={closeMobileMenu}
                />
              )}
              <NavItem
                to="/dashboard/inventory"
                icon={<Package size={20} />}
                label="Unit Inventory"
                isOpen={true}
                onClick={closeMobileMenu}
              />
              <NavItem
                to="/dashboard/staff"
                icon={<Users size={20} />}
                label="Staff"
                isOpen={true}
                onClick={closeMobileMenu}
              />
              <NavItem
                to="/dashboard/units"
                icon={<Store size={20} />}
                label="Units"
                isOpen={true}
                onClick={closeMobileMenu}
              />
              <NavItem
                to="/dashboard/audit-logs"
                icon={<HistoryIcon size={20} />}
                label="Central Audit"
                isOpen={true}
                onClick={closeMobileMenu}
              />
            </>
          )}

          {["admin", "manager", "stockist"].includes(user?.role || "") && (
            <NavItem
              to="/dashboard/settings"
              icon={<Settings size={20} />}
              label="Settings"
              isOpen={true}
              onClick={closeMobileMenu}
            />
          )}
        </nav>

        <div className="p-4 border-t border-border">
          <button
            onClick={() => {
              closeMobileMenu();
              handleLogout();
            }}
            className="flex items-center gap-3 w-full p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex bg-card border-r border-border transition-all duration-300 flex-col z-20",
          isSidebarOpen ? "w-64" : "w-20",
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
            to="/dashboard/unit-pos"
            icon={<Factory size={20} />}
            label="Unit POS"
            isOpen={isSidebarOpen}
          />
          <NavItem
            to="/dashboard/transactions"
            icon={<CreditCard size={20} />}
            label={user?.role === "server" ? "My Sales" : "Transactions"}
            isOpen={isSidebarOpen}
          />
          <NavItem
            to="/dashboard/invoices"
            icon={<FileText size={20} />}
            label="Invoices"
            isOpen={isSidebarOpen}
          />
          {/* <NavItem
            to="/dashboard/invoices?view=guest"
            icon={<Users size={20} />}
            label="Guest Orders"
            isOpen={isSidebarOpen}
          /> */}
          <NavItem
            to="/menu"
            icon={<Utensils size={20} />}
            label="View Menu"
            isOpen={isSidebarOpen}
            external
          />
          <NavItem
            to="/dashboard/daily-reports"
            icon={<ClipboardCheck size={20} />}
            label="Daily Reports"
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
              <NavItem
                to="/dashboard/stock-insights"
                icon={<BarChart2 size={20} />}
                label="Stock Insights"
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
              {["admin", "stockist"].includes(user?.role || "") && (
                <NavItem
                  to="/dashboard/products"
                  icon={<Archive size={20} />}
                  label="Product Catalog"
                  isOpen={isSidebarOpen}
                />
              )}
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

          {["admin", "stockist"].includes(user?.role || "") && (
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
              !isSidebarOpen && "justify-center",
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
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 hover:bg-accent rounded-md text-foreground md:hidden"
          >
            <Menu size={20} />
          </button>
          {/* Desktop sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-accent rounded-md text-foreground hidden md:block"
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
  onClick,
  external,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  isOpen: boolean;
  end?: boolean;
  onClick?: () => void;
  external?: boolean;
}) {
  const content = (
    <>
      <div className="relative">{icon}</div>
      {isOpen && <span className="font-medium">{label}</span>}
    </>
  );

  if (external) {
    return (
      <a
        href={to}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 p-3 rounded-md transition-all duration-200 group text-muted-foreground hover:bg-accent hover:text-foreground",
          !isOpen && "justify-center",
        )}
      >
        {content}
      </a>
    );
  }

  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 p-3 rounded-md transition-all duration-200 group",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
          !isOpen && "justify-center",
        )
      }
    >
      {content}
    </NavLink>
  );
}
