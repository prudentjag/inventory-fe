import {
  Plus,
  Pencil,
  Trash,
  User as UserIcon,
  Shield,
  Building2,
  Lock,
} from "lucide-react";
import { StaffModal } from "../components/modals/StaffModal";
import { useUsers } from "../data/staff";
import { useUnits } from "../data/units";
import type { User } from "../types";
import { DataTable, type Column } from "../components/ui/DataTable";
import { Skeleton } from "../components/ui/Skeleton";
import { useState } from "react";

export default function StaffPage() {
  const { data: apiUsers, isLoading } = useUsers();
  const { data: units } = useUnits();

  // Use API data or empty array if loading/error
  const users = apiUsers?.data || [];

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingUser(null);
  };

  const getUnitName = (id?: string) => {
    if (!id) return "Unassigned";
    return units?.find((u) => u.id === id)?.name || "Unknown Unit";
  };

  // derived state
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const roleOptions = [
    { label: "Admin", value: "admin" },
    { label: "Manager", value: "manager" },
    { label: "Staff", value: "staff" },
    { label: "Auditor", value: "auditor" },
  ];

  const unitOptions = units?.map((u) => ({ label: u.name, value: u.id })) || [];

  const columns: Column<User>[] = [
    {
      header: "Name",
      accessorKey: "name",
      cell: (user) => (
        <div className="flex items-center gap-3 font-medium text-foreground">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden border border-border text-xs">
            {user.name.substring(0, 2).toUpperCase()}
          </div>
          {user.name}
        </div>
      ),
    },
    {
      header: "Email",
      accessorKey: "email",
      cell: (user) => (
        <span className="text-muted-foreground">{user.email}</span>
      ),
    },
    {
      header: "Role",
      accessorKey: "role",
      cell: (user) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
          {user.role === "admin" && <Lock size={10} />}
          {user.role.replace("_", " ")}
        </span>
      ),
    },
    {
      header: "Assigned Unit",
      accessorKey: "assigned_unit_id",
      cell: (user) => (
        <span className="text-muted-foreground">
          {getUnitName(user.assigned_unit_id)}
        </span>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      headerClassName: "text-right",
      cell: (user) => (
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(user);
            }}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
            title="Edit"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Delete logic
            }}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
            title="Delete"
          >
            <Trash size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ... Info Cards ... */}
        <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg dark:bg-blue-900/20 dark:text-blue-400">
            <UserIcon size={24} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">
              Total Staff
            </p>
            <h3 className="text-2xl font-bold">{users.length}</h3>
          </div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg dark:bg-purple-900/20 dark:text-purple-400">
            <Shield size={24} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">
              Managers
            </p>
            <h3 className="text-2xl font-bold">
              {users.filter((u) => u.role === "manager").length}
            </h3>
          </div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg dark:bg-indigo-900/20 dark:text-indigo-400">
            <Building2 size={24} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">
              Active Units
            </p>
            <h3 className="text-2xl font-bold">
              {new Set(users.map((u) => u.assigned_unit_id)).size}
            </h3>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <DataTable
          data={filteredUsers}
          columns={columns}
          searchPlaceholder="Search by name or email..."
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          actionButton={
            <button
              onClick={() => setIsDialogOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm w-full sm:w-auto justify-center"
            >
              <Plus size={18} />
              Add Staff Member
            </button>
          }
        />

      )}

      {/* Add/Edit Modal */}
      <StaffModal
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        editingUser={editingUser}
      />
    </div>
  );
}
