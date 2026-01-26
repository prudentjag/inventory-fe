import { Clock, Play, Trash2, X, Pause } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { SuspendedOrder } from "../../types";

interface SuspendedOrdersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  suspendedOrders: SuspendedOrder[];
  onResumeOrder: (id: string) => void;
  onDeleteOrder: (id: string) => void;
}

export function SuspendedOrdersPanel({
  isOpen,
  onClose,
  suspendedOrders,
  onResumeOrder,
  onDeleteOrder,
}: SuspendedOrdersPanelProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-[400px] bg-card border-l border-border shadow-2xl z-50 animate-in slide-in-from-right duration-300">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pause size={20} className="text-amber-500" />
              <h2 className="font-semibold text-lg">Suspended Orders</h2>
              <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-medium px-2 py-0.5 rounded-full">
                {suspendedOrders.length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {suspendedOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center p-6">
                <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
                  <Pause size={36} className="opacity-50" />
                </div>
                <p className="font-medium text-lg">No Suspended Orders</p>
                <p className="text-sm mt-2 max-w-[250px]">
                  When you suspend an order, it will appear here so you can
                  resume it later.
                </p>
              </div>
            ) : (
              suspendedOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-background border border-border rounded-xl p-4 space-y-3 group hover:border-primary/30 transition-colors"
                >
                  {/* Order Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-primary">
                        #{order.id.slice(-6).toUpperCase()}
                      </span>
                      {order.customerNote && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded truncate max-w-[120px]">
                          {order.customerNote}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock size={12} />
                      <span>
                        {formatDistanceToNow(new Date(order.suspendedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Items Summary */}
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span>{order.items.length} item(s)</span>
                      <span>•</span>
                      <span>
                        {order.items.reduce((sum, i) => sum + i.quantity, 0)}{" "}
                        units
                      </span>
                    </div>
                    <div className="mt-1 text-xs truncate">
                      {order.items
                        .slice(0, 3)
                        .map((i) => i.name)
                        .join(", ")}
                      {order.items.length > 3 &&
                        ` +${order.items.length - 3} more`}
                    </div>
                  </div>

                  {/* Total & Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="font-bold text-lg">
                      ₦{order.total.toLocaleString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onDeleteOrder(order.id)}
                        className="p-2 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors"
                        title="Delete order"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        onClick={() => onResumeOrder(order.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
                      >
                        <Play size={14} />
                        Resume
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer info */}
          {suspendedOrders.length > 0 && (
            <div className="p-4 border-t border-border bg-muted/20">
              <p className="text-xs text-muted-foreground text-center">
                Suspended orders are saved locally and will persist across page
                refreshes.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
