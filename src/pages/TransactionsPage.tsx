import { useState } from "react";
import {
  Download,
  Eye,
  CreditCard,
  User,
  CheckCircle,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import type {
  Transaction,
  PaymentMethod,
  PaymentStatus,
  PaginationLink,
} from "../types";
import { cn } from "../lib/utils";
import { format } from "date-fns";
import { DataTable, type Column } from "../components/ui/DataTable";
import { useAuth } from "../context/AuthContext";
import {
  useSales,
  useUnitSales,
  useMySales,
  useMarkAsPaid,
  type SaleFilters,
} from "../data/sales";
import { useUnits } from "../data/units";
import { useUsers } from "../data/staff";

export default function TransactionsPage() {
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | "">("");
  const [selectedUnitId, setSelectedUnitId] = useState<string | number>("");
  const [selectedServerId, setSelectedServerId] = useState<string | number>("");

  const filters: SaleFilters = {
    start_date: startDate || undefined,
    end_date: endDate || undefined,
    payment_method: (paymentMethod as PaymentMethod) || undefined,
    payment_status: (paymentStatus as PaymentStatus) || undefined,
    unit_id: selectedUnitId || undefined,
    user_id: selectedServerId || undefined,
    page: currentPage,
  };

  // Determine which hook to use based on role
  const isAdminOrStockist = ["admin", "stockist"].includes(user?.role || "");
  const isManagerOrUnitHead = ["manager", "unit_head"].includes(
    user?.role || "",
  );

  const { data: units } = useUnits(isAdminOrStockist);
  const { data: userData } = useUsers();
  const allUsers = userData?.data || [];

  // Always call all hooks unconditionally - only one will be enabled at a time
  const adminQuery = useSales(filters, { enabled: isAdminOrStockist });
  const managerQuery = useUnitSales(user?.assigned_unit_id || "", filters, {
    enabled: isManagerOrUnitHead,
  });
  const staffQuery = useMySales(filters, {
    enabled: !isAdminOrStockist && !isManagerOrUnitHead,
  });

  // Select the appropriate query based on role
  const salesQuery = isAdminOrStockist
    ? adminQuery
    : isManagerOrUnitHead
      ? managerQuery
      : staffQuery;

  // Safely handle transactions array - API returns {status, message, data: Sale[]} or {status, message, data: {data: Sale[]}}
  const rawData = salesQuery.data;

  // Extract pagination info
  const paginationInfo = (() => {
    if (!rawData) return null;
    if (typeof rawData === "object" && "data" in rawData) {
      const inner = (
        rawData as {
          data: {
            current_page?: number;
            last_page?: number;
            total?: number;
            from?: number | null;
            to?: number | null;
            links?: PaginationLink[];
          };
        }
      ).data;
      if (inner && typeof inner === "object" && "current_page" in inner) {
        return {
          currentPage: inner.current_page as number,
          lastPage: inner.last_page as number,
          total: inner.total as number,
          from: inner.from as number | null,
          to: inner.to as number | null,
          links: (inner.links || []) as PaginationLink[],
        };
      }
    }
    return null;
  })();

  const transactions: Transaction[] = (() => {
    if (!rawData) return [];
    // If it's an array directly
    if (Array.isArray(rawData)) return rawData;
    // If it's wrapped in ApiResponse (has .data property)
    if (typeof rawData === "object" && "data" in rawData) {
      const inner = (
        rawData as { data: { data?: Transaction[] } | Transaction[] }
      ).data;
      // If inner.data is array (paginated response)
      if (
        inner &&
        typeof inner === "object" &&
        "data" in inner &&
        Array.isArray(inner.data)
      ) {
        return inner.data;
      }
      // If inner is array directly
      if (Array.isArray(inner)) return inner;
    }
    // Fallback
    return [];
  })();

  const isLoading = salesQuery.isLoading;

  // derived state
  const filteredTxns = transactions.filter(
    (t: Transaction) =>
      t.id.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.invoice_number || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      t.staff_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Helper to get status (backend uses payment_status, fallback to status)
  const getStatus = (txn: Transaction) =>
    txn.payment_status || txn.status || "completed";

  // Helper to get staff name
  const getStaffName = (txn: Transaction) =>
    txn.staff_name || txn.user?.name || "Unknown";

  // Helper to get total amount as number
  const getAmount = (txn: Transaction) => {
    const amt = txn.total_amount;
    return typeof amt === "string" ? parseFloat(amt) : amt;
  };

  const getUnitName = (txn: Transaction) => {
    if (txn.unit?.name) return txn.unit.name;
    const id = txn.unit_id;
    return (
      units?.find((u) => u.id === id || u.id.toString() === id.toString())
        ?.name || "Unit " + id
    );
  };

  const columns: Column<Transaction>[] = [
    {
      header: "Transaction ID",
      accessorKey: "id",
      cell: (txn) => (
        <span className="font-mono text-xs">
          {(txn.invoice_number || txn.id).toString().toUpperCase()}
        </span>
      ),
    },
    {
      header: "Date & Time",
      accessorKey: "created_at",
      cell: (txn) => (
        <span className="text-muted-foreground">
          {format(new Date(txn.created_at), "MMM dd, HH:mm")}
        </span>
      ),
    },
    {
      header: "Unit",
      accessorKey: "unit_id",
      cell: (txn) => (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-secondary text-secondary-foreground border border-border">
          {getUnitName(txn)}
        </span>
      ),
    },
    {
      header: "Staff",
      accessorKey: "staff_name",
      cell: (txn) => (
        <div className="flex items-center gap-2">
          <User size={14} className="text-muted-foreground" />
          {getStaffName(txn)}
        </div>
      ),
    },
    {
      header: "Amount",
      accessorKey: "total_amount",
      className: "font-bold",
      cell: (txn) => <span>₦{getAmount(txn).toLocaleString()}</span>,
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (txn) => {
        const status = getStatus(txn);
        return (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
              status === "completed" || status === "paid"
                ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-100 dark:text-green-600 dark:border-green-200"
                : "bg-yellow-100 text-yellow-700 border-yellow-200",
            )}
          >
            {status === "completed" || status === "paid" ? (
              <CheckCircle size={10} />
            ) : (
              <Clock size={10} />
            )}
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
    },
    {
      header: "Actions",
      className: "text-right",
      headerClassName: "text-right",
      cell: (txn) => (
        <div className="flex justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTxn(txn);
            }}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
            title="View Details"
          >
            <Eye size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            View and manage sales history across all units.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium border border-border">
          <Download size={18} />
          Export Report
        </button>
      </div>

      <div className="bg-card p-4 rounded-xl border border-border shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Filter size={18} />
          <span className="text-sm font-medium">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All Methods</option>
              <option value="cash">Cash</option>
              <option value="pos">POS</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Status
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as any)}
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          {isAdminOrStockist && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Unit
              </label>
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All Units</option>
                {units?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {(isAdminOrStockist || isManagerOrUnitHead) && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Server/Waiter
              </label>
              <select
                value={selectedServerId}
                onChange={(e) => setSelectedServerId(e.target.value)}
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All Servers</option>
                {allUsers
                  ?.filter((u) => u.role === "server")
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>
        {(startDate ||
          endDate ||
          paymentMethod ||
          paymentStatus ||
          selectedUnitId ||
          selectedServerId) && (
          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setPaymentMethod("");
                setPaymentStatus("");
                setSelectedUnitId("");
                setSelectedServerId("");
              }}
              className="text-xs text-primary hover:underline font-medium"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      <DataTable
        data={filteredTxns}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search by ID or Staff Name..."
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        onRowClick={(item) => setSelectedTxn(item)}
      />

      {/* Pagination Controls */}
      {paginationInfo && paginationInfo.lastPage > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-card border border-border rounded-xl">
          <div className="text-sm text-muted-foreground">
            Showing {paginationInfo.from} to {paginationInfo.to} of{" "}
            {paginationInfo.total} transactions
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-md border border-input bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1">
              {paginationInfo.links
                .filter((link) => link.page !== null)
                .map((link) => (
                  <button
                    key={link.page}
                    onClick={() => setCurrentPage(link.page!)}
                    className={cn(
                      "min-w-[32px] h-8 px-2 rounded-md text-sm font-medium transition-colors",
                      link.active
                        ? "bg-primary text-primary-foreground"
                        : "border border-input bg-background hover:bg-accent",
                    )}
                  >
                    {link.page}
                  </button>
                ))}
            </div>
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(paginationInfo.lastPage, p + 1))
              }
              disabled={currentPage === paginationInfo.lastPage}
              className="p-2 rounded-md border border-input bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Details Modal */}
      <Dialog.Root
        open={!!selectedTxn}
        onOpenChange={(open) => !open && setSelectedTxn(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
            <MarkAsPaidAction
              txn={selectedTxn}
              onClose={() => setSelectedTxn(null)}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function MarkAsPaidAction({
  txn,
  onClose,
}: {
  txn: Transaction | null;
  onClose: () => void;
}) {
  const { mutate: markAsPaid, isPending } = useMarkAsPaid();

  if (!txn) return null;

  const isPendingStatus =
    txn.payment_status === "pending" || txn.status === "pending";

  const handleMarkPaid = () => {
    if (window.confirm("Are you sure you want to mark this invoice as PAID?")) {
      markAsPaid(
        {
          invoiceNumber: txn.invoice_number || txn.id.toString(),
          payment_method: txn.payment_method,
        },
        {
          onSuccess: () => {
            onClose();
          },
        },
      );
    }
  };

  return (
    <>
      <div className="flex flex-col space-y-1.5">
        <Dialog.Title className="text-lg font-semibold leading-none tracking-tight flex justify-between items-center">
          <span>Transaction Details</span>
          <span className="text-sm font-mono text-muted-foreground bg-secondary px-2 py-1 rounded">
            {(txn.invoice_number || txn.id).toString().toUpperCase()}
          </span>
        </Dialog.Title>
        <p className="text-sm text-muted-foreground">
          Processed on {format(new Date(txn.created_at), "PPP at pp")}
        </p>
      </div>

      <div className="py-2 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground block mb-1">
              Payment Method
            </span>
            <div className="flex items-center gap-2 font-medium">
              <CreditCard size={16} />
              {txn.payment_method === "cash"
                ? "Cash Payment"
                : txn.payment_method === "pos"
                  ? "POS Payment"
                  : txn.payment_method === "monnify"
                    ? "Monnify Transfer"
                    : "Manual Transfer"}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1">
              Processed By
            </span>
            <div className="font-medium">
              {txn.staff_name || txn.user?.name || "Unknown"}
            </div>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b text-xs font-semibold text-muted-foreground flex justify-between">
            <span>ITEM</span>
            <span>TOTAL</span>
          </div>
          <div className="divide-y max-h-40 overflow-y-auto">
            {(txn.sale_items || txn.items || []).map(
              (item: any, idx: number) => (
                <div
                  key={idx}
                  className="px-4 py-3 flex justify-between text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {item.product?.name ||
                        item.name ||
                        `Product #${item.product_id}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} x ₦
                      {(item.unit_price || item.price || 0).toLocaleString()}
                    </p>
                  </div>
                  <span className="font-medium">
                    ₦
                    {(
                      (item.unit_price || item.price || 0) * item.quantity
                    ).toLocaleString()}
                  </span>
                </div>
              ),
            )}
          </div>
          <div className="bg-muted/20 px-4 py-3 border-t flex justify-between items-center">
            <span className="font-bold">Grand Total</span>
            <span className="font-bold text-lg">
              ₦{txn.total_amount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-2">
        {isPendingStatus && (
          <button
            onClick={handleMarkPaid}
            disabled={isPending}
            className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors text-sm font-bold flex items-center gap-2 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <CheckCircle size={16} />
            )}
            Mark as Paid
          </button>
        )}
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-md border border-input bg-background hover:bg-accent transition-colors text-sm font-medium"
        >
          Close
        </button>
      </div>
    </>
  );
}
