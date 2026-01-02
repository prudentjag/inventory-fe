import { useState } from "react";
import {
  Download,
  Eye,
  CreditCard,
  User,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import type { Transaction, PaymentMethod, PaginationLink } from "../types";
import { cn } from "../lib/utils";
import { format } from "date-fns";
import { DataTable, type Column } from "../components/ui/DataTable";
import { useAuth } from "../context/AuthContext";
import {
  useSales,
  useUnitSales,
  useMySales,
  type SaleFilters,
} from "../data/sales";
import { useUnits } from "../data/units";

export default function InvoicesPage() {
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [selectedUnitId, setSelectedUnitId] = useState<string | number>("");

  const filters: SaleFilters = {
    start_date: startDate || undefined,
    end_date: endDate || undefined,
    payment_method: (paymentMethod as PaymentMethod) || undefined,
    // CRITICAL: Hardcode to pending for Invoices page
    payment_status: "pending",
    unit_id: selectedUnitId || undefined,
    page: currentPage,
  };

  // Determine which hook to use based on role
  const isAdminOrStockist = ["admin", "stockist"].includes(user?.role || "");
  const isManagerOrUnitHead = ["manager", "unit_head"].includes(
    user?.role || ""
  );

  const { data: units } = useUnits(isAdminOrStockist);

  const salesQuery = isAdminOrStockist
    ? useSales(filters)
    : isManagerOrUnitHead
    ? useUnitSales(user?.assigned_unit_id || "", filters)
    : useMySales(filters);

  // Safely handle transactions array - API returns {status, message, data: Sale[]} or {status, message, data: {data: Sale[]}}
  const rawData = salesQuery.data;

  // Extract pagination info
  const paginationInfo = (() => {
    if (!rawData) return null;
    if (typeof rawData === "object" && "data" in rawData) {
      const inner = (rawData as any).data;
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
      const inner = (rawData as any).data;
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
      t.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to get staff name
  const getStaffName = (txn: Transaction) =>
    txn.staff_name || txn.user?.name || "Unknown";

  // Helper to get items (backend uses sale_items)
  const getItems = (txn: Transaction) => {
    if (txn.sale_items && txn.sale_items.length > 0) {
      return txn.sale_items.map((si) => ({
        id: si.product_id,
        name: si.product?.name || `Product #${si.product_id}`,
        quantity: si.quantity,
        price: Number(si.unit_price),
        selling_price: Number(si.unit_price),
      }));
    }
    return txn.items || [];
  };

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
      header: "Invoice #",
      accessorKey: "invoice_number",
      cell: (txn) => (
        <span className="font-mono text-xs font-semibold">
          {txn.invoice_number || txn.id.toString().toUpperCase()}
        </span>
      ),
    },
    {
      header: "Issued Date",
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
      cell: () => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-yellow-100 text-yellow-700 border-yellow-200">
          <Clock size={10} />
          Pending
        </span>
      ),
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
            title="View Invoice"
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
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Manage pending payments and outstanding invoices.
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
        </div>
        {(startDate || endDate || paymentMethod || selectedUnitId) && (
          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setPaymentMethod("");
                setSelectedUnitId("");
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
        searchPlaceholder="Search by Invoice # or Staff Name..."
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        onRowClick={(item) => setSelectedTxn(item)}
      />

      {/* Pagination Controls */}
      {paginationInfo && paginationInfo.lastPage > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-card border border-border rounded-xl">
          <div className="text-sm text-muted-foreground">
            Showing {paginationInfo.from} to {paginationInfo.to} of{" "}
            {paginationInfo.total} invoices
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
                        : "border border-input bg-background hover:bg-accent"
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
            {selectedTxn && (
              <>
                <div className="flex flex-col space-y-1.5">
                  <Dialog.Title className="text-lg font-semibold leading-none tracking-tight flex justify-between items-center">
                    <span>Invoice Details</span>
                    <span className="text-sm font-mono text-muted-foreground bg-secondary px-2 py-1 rounded">
                      {selectedTxn.invoice_number ||
                        selectedTxn.id.toString().toUpperCase()}
                    </span>
                  </Dialog.Title>
                  <p className="text-sm text-muted-foreground">
                    Issued on{" "}
                    {format(new Date(selectedTxn.created_at), "PPP at pp")}
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
                        {selectedTxn.payment_method === "cash"
                          ? "Cash Payment"
                          : selectedTxn.payment_method === "pos"
                          ? "POS Payment"
                          : "Bank Transfer"}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">
                        Issued By
                      </span>
                      <div className="font-medium">
                        {getStaffName(selectedTxn)}
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 px-4 py-2 border-b text-xs font-semibold text-muted-foreground flex justify-between">
                      <span>ITEM</span>
                      <span>TOTAL</span>
                    </div>
                    <div className="divide-y max-h-40 overflow-y-auto">
                      {getItems(selectedTxn).map((item, idx: number) => (
                        <div
                          key={idx}
                          className="px-4 py-3 flex justify-between text-sm"
                        >
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} x ₦
                              {(
                                item.price ??
                                item.selling_price ??
                                0
                              ).toLocaleString()}
                            </p>
                          </div>
                          <span className="font-medium">
                            ₦
                            {(
                              (item.price ?? item.selling_price ?? 0) *
                              item.quantity
                            ).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-muted/20 px-4 py-3 border-t flex justify-between items-center">
                      <span className="font-bold">Grand Total</span>
                      <span className="font-bold text-lg">
                        ₦{selectedTxn.total_amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-2">
                  <button className="px-4 py-2 rounded-md border border-input bg-background hover:bg-accent transition-colors text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <FileText size={16} />
                      Print Invoice
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedTxn(null)}
                    className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
