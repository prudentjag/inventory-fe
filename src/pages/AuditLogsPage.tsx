import { useState } from "react";
import {
  History,
  User as UserIcon,
  Package,
  Warehouse,
  ClipboardList,
  Eye,
} from "lucide-react";
import { useAuditLogs } from "../data/auditLogs";
import { DataTable, type Column } from "../components/ui/DataTable";
import { RawJsonModal } from "../components/modals/RawJsonModal";
import type { AuditLog } from "../types";

export function AuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isRawModalOpen, setIsRawModalOpen] = useState(false);
  const { data: logs, isLoading } = useAuditLogs();

  const getActionIcon = (action: string) => {
    if (action.includes("stock"))
      return <Warehouse className="h-4 w-4 text-blue-500" />;
    if (action.includes("product"))
      return <Package className="h-4 w-4 text-purple-500" />;
    if (action.includes("request"))
      return <ClipboardList className="h-4 w-4 text-amber-500" />;
    return <History className="h-4 w-4 text-gray-500" />;
  };

  const columns: Column<AuditLog>[] = [
    {
      header: "Action",
      cell: (log) => (
        <div className="flex items-center gap-2">
          {getActionIcon(log.action)}
          <span className="capitalize font-medium">
            {log.action.replace(/_/g, " ")}
          </span>
        </div>
      ),
    },
    {
      header: "Resource",
      cell: (log) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium capitalize">
            {log.resource_type}
          </span>
          <span className="text-xs text-muted-foreground">
            ID: {log.resource_id}
          </span>
        </div>
      ),
    },
    {
      header: "Performed By",
      cell: (log) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <UserIcon size={14} className="text-muted-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {log.user?.name || "System"}
            </span>
            <span className="text-xs text-muted-foreground">
              {log.user?.email || "-"}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Date",
      cell: (log) => (
        <span className="text-muted-foreground">
          {new Date(log.created_at).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Actions",
      headerClassName: "text-right",
      cell: (log) => (
        <div className="flex justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedLog(log);
              setIsRawModalOpen(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-semibold shadow-sm"
          >
            <Eye size={14} />
            View Details
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">
            Track all system activities and inventory movements
          </p>
        </div>
      </div>

      <DataTable
        data={logs || []}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search logs..."
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
      />

      <RawJsonModal
        isOpen={isRawModalOpen}
        onClose={() => {
          setIsRawModalOpen(false);
          setSelectedLog(null);
        }}
        data={selectedLog}
        title="Audit Log Details"
      />
    </div>
  );
}
