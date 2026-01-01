import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, X, History } from "lucide-react";
import { useResourceAuditLogs } from "../../data/auditLogs";
import { DataTable, type Column } from "../ui/DataTable";
import { RawJsonModal } from "./RawJsonModal";
import { useState } from "react";
import { cn } from "../../lib/utils";
import type { AuditLog } from "../../types";

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceType: string;
  resourceId: number | null;
  resourceName?: string;
}

export function AuditLogModal({
  isOpen,
  onClose,
  resourceType,
  resourceId,
  resourceName,
}: AuditLogModalProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isRawModalOpen, setIsRawModalOpen] = useState(false);
  const { data: logs, isLoading } = useResourceAuditLogs(
    resourceType,
    resourceId || 0
  );

  const columns: Column<AuditLog>[] = [
    {
      header: "Performed By",
      cell: (log) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">
            {log.user?.name || "System"}
          </span>
          <span className="text-xs text-muted-foreground">
            {log.user?.role || "user"}
          </span>
        </div>
      ),
    },
    {
      header: "Action",
      cell: (log) => (
        <span className="capitalize text-sm font-medium">
          {log.action.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      header: "Changes",
      cell: (log) => {
        let diff = 0;
        if (
          log.action === "stock_updated" &&
          log.new_values &&
          log.old_values
        ) {
          diff =
            (log.new_values.quantity || 0) - (log.old_values.quantity || 0);
        } else if (log.action === "stock_added" && log.new_values) {
          diff = log.new_values.quantity || 0;
        }

        if (diff === 0)
          return <span className="text-muted-foreground text-sm">-</span>;

        return (
          <span
            className={cn(
              "text-sm font-bold px-2 py-0.5 rounded",
              diff > 0
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            )}
          >
            {diff > 0 ? "+" : ""}
            {diff} products
          </span>
        );
      },
    },
    {
      header: "Date",
      cell: (log) => (
        <span className="text-muted-foreground text-sm">
          {new Date(log.created_at).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] border border-border bg-background p-0 shadow-lg duration-200 sm:rounded-lg overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <History className="h-5 w-5" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-semibold leading-none tracking-tight">
                  Audit Trail
                </Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground mt-1">
                  History for {resourceName || "this item"}
                </Dialog.Description>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <DataTable
                data={logs || []}
                columns={columns}
                searchPlaceholder="Filter logs..."
                isLoading={false}
              />
            )}
          </div>

          <div className="p-4 bg-muted/30 border-t border-border flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors font-medium text-sm"
            >
              Close
            </button>
          </div>

          <RawJsonModal
            isOpen={isRawModalOpen}
            onClose={() => {
              setIsRawModalOpen(false);
              setSelectedLog(null);
            }}
            data={selectedLog}
            title="Log Entry Data"
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
