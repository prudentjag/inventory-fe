import { useState } from "react";
import {
  FileText,
  Calendar,
  Loader2,
  Eye,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Save,
  X,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import {
  useDailyReports,
  useDailyReport,
  useUpdateDailyReportRemark,
} from "../data/dailyReports";
import { useInventory } from "../data/inventory";
import { useUnits } from "../data/units";
import { GenerateReportModal } from "../components/modals/GenerateReportModal";
import type { DailyReport, InventoryItem, Unit } from "../types";
import { cn } from "../lib/utils";

export default function DailyReportsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [selectedUnitId, setSelectedUnitId] = useState<
    number | string | undefined
  >(user?.assigned_unit_id || user?.units?.[0]?.id || undefined);

  // Fetch all units for filtering (if admin/stockist)
  const { data: units } = useUnits(
    ["admin", "stockist"].includes(user?.role || ""),
  );

  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [editingRemark, setEditingRemark] = useState(false);
  const [remarkValue, setRemarkValue] = useState("");

  // Queries
  const { data: reportsData, isLoading: isLoadingReports } = useDailyReports(
    { unit_id: selectedUnitId, page },
    { enabled: !!selectedUnitId },
  );
  const { data: selectedReportData, isLoading: isLoadingDetail } =
    useDailyReport(selectedReportId, { enabled: !!selectedReportId });
  const { data: inventoryData } = useInventory(selectedUnitId || undefined);
  const { mutate: updateRemark, isPending: isUpdatingRemark } =
    useUpdateDailyReportRemark();

  const reports = reportsData?.data?.data || [];
  const pagination = reportsData?.data;
  const selectedReport = selectedReportData?.data;
  const products = (inventoryData?.data || []).map(
    (item: InventoryItem) => item.product,
  );

  const handleViewReport = (report: DailyReport) => {
    setSelectedReportId(report.id);
    setEditingRemark(false);
    setRemarkValue(report.remark || "");
  };

  const handleStartEditRemark = () => {
    setRemarkValue(selectedReport?.remark || "");
    setEditingRemark(true);
  };

  const handleSaveRemark = () => {
    if (!selectedReportId) return;
    updateRemark(
      { id: selectedReportId, remark: remarkValue },
      {
        onSuccess: () => {
          toast.success("Remark updated successfully");
          setEditingRemark(false);
        },
        onError: () => {
          toast.error("Failed to update remark");
        },
      },
    );
  };

  if (!selectedUnitId && !["admin", "stockist"].includes(user?.role || "")) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center p-6">
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8 max-w-md text-center space-y-4">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto dark:bg-amber-900/20 dark:text-amber-400">
            <FileText size={32} />
          </div>
          <h2 className="text-2xl font-bold">No Unit Assigned</h2>
          <p className="text-muted-foreground">
            Please contact your administrator to assign you to a unit.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="text-primary" size={28} />
            Daily Reports
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            End-of-day summaries and regional reports
          </p>
        </div>

        {selectedUnitId && (
          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
          >
            <ClipboardCheck size={18} />
            Generate Report
          </button>
        )}
      </div>

      {/* Unit Filter - Only for Admins and Stockists */}
      {["admin", "stockist"].includes(user?.role || "") && (
        <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-muted-foreground whitespace-nowrap">
            <Filter size={18} />
            <span className="text-sm font-medium">Filter by Unit:</span>
          </div>
          <div className="w-full max-w-sm">
            <select
              value={selectedUnitId || ""}
              onChange={(e) => setSelectedUnitId(Number(e.target.value) || "")}
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer hover:border-primary/50"
            >
              <option value="">Choose a unit...</option>
              {units?.map((unit: Unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name} ({unit.type})
                </option>
              ))}
            </select>
          </div>
          {!selectedUnitId && (
            <p className="text-xs text-amber-600 font-medium">
              Please select a unit to view its daily reports.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports List */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/20">
            <h2 className="font-semibold flex items-center gap-2">
              <FileText size={18} className="text-muted-foreground" />
              Report History
            </h2>
          </div>

          {isLoadingReports ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <FileText size={48} className="mx-auto mb-4 opacity-30" />
              <p>No reports generated yet</p>
              <p className="text-sm mt-1">
                Click "Close Day" to create your first report
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary/30 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-right">Sales</th>
                      <th className="px-4 py-3 text-right">Items Sold</th>
                      <th className="px-4 py-3 text-right">Damages</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {reports.map((report) => (
                      <tr
                        key={report.id}
                        className={cn(
                          "hover:bg-muted/30 transition-colors",
                          selectedReportId === report.id && "bg-primary/5",
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Calendar
                              size={14}
                              className="text-muted-foreground"
                            />
                            <span className="font-medium">
                              {format(
                                new Date(report.report_date),
                                "MMM dd, yyyy",
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-primary">
                          ₦{Number(report.total_sales_amount).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {report.total_items_sold}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={cn(
                              "font-medium",
                              report.total_damages > 0 &&
                                "text-red-600 dark:text-red-400",
                            )}
                          >
                            {report.total_damages}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-xs font-medium",
                              report.status === "closed"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                            )}
                          >
                            {report.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleViewReport(report)}
                            className="p-1.5 hover:bg-secondary rounded-md transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} className="text-muted-foreground" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.last_page > 1 && (
                <div className="p-4 border-t border-border flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.current_page} of {pagination.last_page}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={pagination.current_page <= 1}
                      className="p-2 rounded-md border border-border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={pagination.current_page >= pagination.last_page}
                      className="p-2 rounded-md border border-border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Report Detail Panel */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
            <h2 className="font-semibold">Report Details</h2>
            {selectedReportId && (
              <button
                onClick={() => setSelectedReportId(null)}
                className="p-1 hover:bg-secondary rounded-md"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {isLoadingDetail ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : !selectedReport ? (
            <div className="p-8 text-center text-muted-foreground">
              <Eye size={48} className="mx-auto mb-4 opacity-30" />
              <p>Select a report to view details</p>
            </div>
          ) : (
            <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Total Sales</p>
                  <p className="font-bold text-primary">
                    ₦
                    {Number(selectedReport.total_sales_amount).toLocaleString()}
                  </p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Items Sold</p>
                  <p className="font-bold">{selectedReport.total_items_sold}</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    Stock Received
                  </p>
                  <p className="font-bold">
                    {selectedReport.total_stock_received}
                  </p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Damages</p>
                  <p
                    className={cn(
                      "font-bold",
                      selectedReport.total_damages > 0 && "text-red-600",
                    )}
                  >
                    {selectedReport.total_damages}
                  </p>
                </div>
              </div>

              {/* Items Breakdown */}
              {selectedReport.items && selectedReport.items.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Product Breakdown</h3>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-secondary/50">
                        <tr>
                          <th className="px-2 py-2 text-left">Product</th>
                          <th className="px-2 py-2 text-left">Opening Stock</th>
                          <th className="px-2 py-2 text-left">Closing Stock</th>
                          <th className="px-2 py-2 text-right">Sold</th>
                          <th className="px-2 py-2 text-right">Damage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {selectedReport.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-2 py-2 truncate max-w-[120px]">
                              {item.product?.name ||
                                `Product #${item.product_id}`}
                            </td>
                            <td className="px-2 py-2 text-right">
                              {item.formatted_opening_stock ||
                                item.opening_stock}
                            </td>
                            <td className="px-2 py-2 text-right">
                              {item.formatted_closing_stock ||
                                item.closing_stock}
                            </td>
                            <td className="px-2 py-2 text-right">
                              {item.formatted_quantity_sold ||
                                item.quantity_sold}
                            </td>
                            <td
                              className={cn(
                                "px-2 py-2 text-right",
                                item.damages > 0 && "text-red-600",
                              )}
                            >
                              {item.formatted_damages || item.damages}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Remark */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Remark</h3>
                  {!editingRemark && (
                    <button
                      onClick={handleStartEditRemark}
                      className="text-xs text-primary hover:underline"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {editingRemark ? (
                  <div className="space-y-2">
                    <textarea
                      value={remarkValue}
                      onChange={(e) =>
                        setRemarkValue(e.target.value.slice(0, 1000))
                      }
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-input resize-none text-sm"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingRemark(false)}
                        className="px-3 py-1.5 text-xs border border-border rounded-md hover:bg-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveRemark}
                        disabled={isUpdatingRemark}
                        className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-1"
                      >
                        {isUpdatingRemark ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Save size={12} />
                        )}
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground bg-secondary/30 rounded-lg p-3">
                    {selectedReport.remark || "No remark added"}
                  </p>
                )}
              </div>

              {/* Meta */}
              <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                <p>
                  Generated:{" "}
                  {format(
                    new Date(selectedReport.created_at),
                    "MMM dd, yyyy HH:mm",
                  )}
                </p>
                {selectedReport.user && <p>By: {selectedReport.user.name}</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Generate Modal */}
      <GenerateReportModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        unitId={Number(selectedUnitId)}
        products={products}
      />
    </div>
  );
}
