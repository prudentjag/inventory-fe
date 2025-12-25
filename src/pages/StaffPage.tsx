import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Plus,
  Pencil,
  Trash,
  User as UserIcon,
  Shield,
  Building2,
  Lock,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { MOCK_USERS, MOCK_UNITS } from "../services/mockData";
import type { User, Role } from "../types";
import { CustomFormInput } from "../components/form/CustomFormInput";
import { CustomFormSelect } from "../components/form/CustomFormSelect";
import { toast } from "sonner";

import { DataTable, type Column } from "../components/ui/DataTable";

export default function StaffPage() {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form Logic
  const validationSchema = Yup.object({
    name: Yup.string().required("Required"),
    email: Yup.string().email("Invalid email").required("Required"),
    role: Yup.string().required("Required"),
    assigned_unit_id: Yup.string(), // Optional for super_admin or unassigned
  });

  const formik = useFormik({
    initialValues: editingUser || {
      id: "",
      name: "",
      email: "",
      role: "staff" as Role,
      assigned_unit_id: "",
      avatar_url: "",
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: (values) => {
      if (editingUser) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === editingUser.id ? ({ ...values, id: u.id } as User) : u
          )
        );
        toast.success("Staff member updated");
      } else {
        const newUser = { ...values, id: `u${Date.now()}` } as User;
        setUsers((prev) => [...prev, newUser]);
        toast.success("New staff member created");
      }
      handleCloseDialog();
    },
  });

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingUser(null);
    formik.resetForm();
  };

  const getUnitName = (id?: string) => {
    if (!id) return "Unassigned";
    return MOCK_UNITS.find((u) => u.id === id)?.name || "Unknown Unit";
  };

  // derived state
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const roleOptions = [
    { label: "Super Admin", value: "super_admin" },
    { label: "Unit Manager", value: "unit_manager" },
    { label: "Staff", value: "staff" },
    { label: "Auditor", value: "auditor" },
  ];

  const unitOptions = MOCK_UNITS.map((u) => ({ label: u.name, value: u.id }));

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
          {user.role === "super_admin" && <Lock size={10} />}
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
              {users.filter((u) => u.role === "unit_manager").length}
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

      {/* Add/Edit Modal */}
      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
            <div className="flex flex-col space-y-1.5 text-center sm:text-left">
              <Dialog.Title className="text-lg font-semibold leading-none tracking-tight">
                {editingUser ? "Edit Staff Member" : "Add New Staff"}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                {editingUser
                  ? "Update user permissions and details."
                  : "Create a new account for your team."}
              </Dialog.Description>
            </div>

            <form onSubmit={formik.handleSubmit} className="grid gap-6 py-4">
              <CustomFormInput
                name="name"
                label="Full Name"
                formik={formik}
                placeholder="e.g. John Doe"
              />
              <CustomFormInput
                name="email"
                label="Email Address"
                formik={formik}
                placeholder="e.g. john@example.com"
              />

              <div className="grid grid-cols-2 gap-4">
                <CustomFormSelect
                  name="role"
                  label="Role"
                  formik={formik}
                  options={roleOptions}
                />

                <CustomFormSelect
                  name="assigned_unit_id"
                  label="Assigned Unit"
                  formik={formik}
                  options={unitOptions}
                  placeholder="No Unit Assigned"
                />
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={handleCloseDialog}
                  className="px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                >
                  {editingUser ? "Save Changes" : "Create Account"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
