import { useState } from "react";
import { X, Plus, Trash2, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "../../types";
import { useGenerateDailyReport } from "../../data/dailyReports";

interface GenerateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  unitId: number;
  products: Product[];
  onSuccess?: () => void;
}

interface DamageEntry {
  productId: number | "";
  quantity: number;
}

export function GenerateReportModal({
  isOpen,
  onClose,
  unitId,
  products,
  onSuccess,
}: GenerateReportModalProps) {
  const [damages, setDamages] = useState<DamageEntry[]>([]);
  const [remark, setRemark] = useState("");
  const [reportDate, setReportDate] = useState("");
  const { mutate: generateReport, isPending } = useGenerateDailyReport();

  if (!isOpen) return null;

  const addDamageEntry = () => {
    setDamages((prev) => [...prev, { productId: "", quantity: 1 }]);
  };

  const removeDamageEntry = (index: number) => {
    setDamages((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDamageEntry = (
    index: number,
    field: "productId" | "quantity",
    value: number | "",
  ) => {
    setDamages((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry,
      ),
    );
  };

  const handleSubmit = () => {
    // Build damages object
    const damagesPayload: Record<number, number> = {};
    damages.forEach((entry) => {
      if (entry.productId && entry.quantity > 0) {
        damagesPayload[entry.productId] = entry.quantity;
      }
    });

    generateReport(
      {
        unit_id: unitId,
        date: reportDate || undefined,
        damages:
          Object.keys(damagesPayload).length > 0 ? damagesPayload : undefined,
        remark: remark.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Daily report generated successfully!");
          setDamages([]);
          setRemark("");
          onSuccess?.();
          onClose();
        },
        onError: (
          error: Error & { response?: { data?: { message?: string } } },
        ) => {
          toast.error(
            error.response?.data?.message || "Failed to generate report",
          );
        },
      },
    );
  };

  const usedProductIds = damages
    .map((d) => d.productId)
    .filter((id): id is number => id !== "");

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
            <div>
              <h2 className="text-lg font-semibold">
                Close Day - Generate Report
              </h2>
              <p className="text-sm text-muted-foreground">
                Create end-of-day summary for this unit
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* Date Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Report Date (Optional)
              </label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to generate report for today. Useful for catching up
                on missed daily reports.
              </p>
            </div>

            {/* Damages Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Record Damages (Optional)
                </label>
                <button
                  onClick={addDamageEntry}
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <Plus size={14} />
                  Add Damage
                </button>
              </div>

              {damages.length === 0 ? (
                <p className="text-sm text-muted-foreground bg-secondary/30 rounded-lg p-3 text-center">
                  No damages to report. Click "Add Damage" if any products were
                  damaged today.
                </p>
              ) : (
                <div className="space-y-2">
                  {damages.map((entry, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-secondary/30 rounded-lg p-2"
                    >
                      <select
                        value={entry.productId}
                        onChange={(e) =>
                          updateDamageEntry(
                            index,
                            "productId",
                            e.target.value ? Number(e.target.value) : "",
                          )
                        }
                        className="flex-1 px-3 py-2 rounded-md bg-background border border-input text-sm"
                      >
                        <option value="">Select product...</option>
                        {products
                          .filter(
                            (p) =>
                              !usedProductIds.includes(Number(p.id)) ||
                              Number(p.id) === entry.productId,
                          )
                          .map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        value={entry.quantity}
                        onChange={(e) =>
                          updateDamageEntry(
                            index,
                            "quantity",
                            Math.max(1, Number(e.target.value)),
                          )
                        }
                        className="w-20 px-3 py-2 rounded-md bg-background border border-input text-sm text-center"
                      />
                      <button
                        onClick={() => removeDamageEntry(index)}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Remark Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Remark (Optional)</label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value.slice(0, 1000))}
                placeholder="Add any notes about today's operations..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-background border border-input resize-none text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {remark.length}/1000 characters
              </p>
            </div>

            {/* Info */}
            <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <AlertCircle
                size={16}
                className="text-blue-600 dark:text-blue-400 mt-0.5"
              />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Once generated, the report will summarize all sales, stock
                movements, and damages for the selected date (defaults to
                today). You can only generate one report per day per unit.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Report"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
