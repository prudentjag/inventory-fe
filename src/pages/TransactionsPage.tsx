import { useState } from "react";
import {
  Download,
  Eye,
  CreditCard,
  User,
  CheckCircle,
  Clock,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { MOCK_TRANSACTIONS, MOCK_UNITS } from "../services/mockData";
import type { Transaction, CartItem } from "../types";
import { cn } from "../lib/utils";
import { format } from "date-fns";
import { DataTable, type Column } from "../components/ui/DataTable";

export default function TransactionsPage() {
  const [transactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  // derived state
  const filteredTxns = transactions.filter(
    (t: Transaction) =>
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.staff_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUnitName = (id: string) =>
    MOCK_UNITS.find((u) => u.id === id)?.name || "Unknown";

  const columns: Column<Transaction>[] = [
    {
      header: "Transaction ID",
      accessorKey: "id",
      cell: (txn) => (
        <span className="font-mono text-xs">{txn.id.toUpperCase()}</span>
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
          {getUnitName(txn.unit_id)}
        </span>
      ),
    },
    {
      header: "Staff",
      accessorKey: "staff_name",
      cell: (txn) => (
        <div className="flex items-center gap-2">
          <User size={14} className="text-muted-foreground" />
          {txn.staff_name}
        </div>
      ),
    },
    {
      header: "Amount",
      accessorKey: "total_amount",
      className: "font-bold",
      cell: (txn) => <span>₦{txn.total_amount.toLocaleString()}</span>,
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (txn) => (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
            txn.status === "completed"
              ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
              : "bg-yellow-100 text-yellow-700 border-yellow-200"
          )}
        >
          {txn.status === "completed" ? (
            <CheckCircle size={10} />
          ) : (
            <Clock size={10} />
          )}
          {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
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

      <DataTable
        data={filteredTxns}
        columns={columns}
        searchPlaceholder="Search by ID or Staff Name..."
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        onRowClick={(item) => setSelectedTxn(item)}
      />

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
                    <span>Transaction Details</span>
                    <span className="text-sm font-mono text-muted-foreground bg-secondary px-2 py-1 rounded">
                      {selectedTxn.id.toUpperCase()}
                    </span>
                  </Dialog.Title>
                  <p className="text-sm text-muted-foreground">
                    Processed on{" "}
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
                          : "Bank Transfer"}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">
                        Processed By
                      </span>
                      <div className="font-medium">
                        {selectedTxn.staff_name}
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 px-4 py-2 border-b text-xs font-semibold text-muted-foreground flex justify-between">
                      <span>ITEM</span>
                      <span>TOTAL</span>
                    </div>
                    <div className="divide-y max-h-40 overflow-y-auto">
                      {selectedTxn.items.map((item: CartItem, idx: number) => (
                        <div
                          key={idx}
                          className="px-4 py-3 flex justify-between text-sm"
                        >
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} x ₦{item.price.toLocaleString()}
                            </p>
                          </div>
                          <span className="font-medium">
                            ₦{(item.price * item.quantity).toLocaleString()}
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
                    Print Receipt
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
