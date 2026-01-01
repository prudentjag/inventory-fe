import { useState } from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Filter,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import {
  useStockRequests,
  useApproveRequest,
  useRejectRequest,
} from "../data/stockRequests";
import { useAuth } from "../context/AuthContext";
import { Skeleton } from "../components/ui/Skeleton";
import { RequestStockModal } from "../components/modals/RequestStockModal";
import type { StockRequest, StockRequestStatus } from "../types";

type TabType = "all" | StockRequestStatus;

export function StockRequestsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const { user } = useAuth();
  const { data: requests, isLoading } = useStockRequests(
    activeTab === "all" ? undefined : activeTab
  );
  const approveMutation = useApproveRequest();
  const rejectMutation = useRejectRequest();

  const canApprove = user?.role === "admin" || user?.role === "stockist";

  const handleApprove = (request: StockRequest) => {
    approveMutation.mutate(request.id, {
      onSuccess: () => toast.success("Request approved successfully"),
      onError: (error: any) =>
        toast.error(
          error.response?.data?.message || "Failed to approve request"
        ),
    });
  };

  const handleReject = (request: StockRequest) => {
    const notes = prompt("Rejection reason (optional):");
    rejectMutation.mutate(
      { id: request.id, data: notes ? { notes } : undefined },
      {
        onSuccess: () => toast.success("Request rejected"),
        onError: (error: any) =>
          toast.error(
            error.response?.data?.message || "Failed to reject request"
          ),
      }
    );
  };

  const getStatusBadge = (status: StockRequestStatus) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="h-3 w-3" />
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <XCircle className="h-3 w-3" />
            Rejected
          </span>
        );
    }
  };

  const tabs: { value: TabType; label: string }[] = [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "all", label: "All" },
  ];

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Stock Requests</h1>
            <p className="text-muted-foreground">
              Review and manage stock requests from units
            </p>
          </div>
          {["staff", "manager", "unit_head"].includes(user?.role || "") && (
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium shadow-sm"
            >
              <Plus size={18} />
              New Request
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab.value
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Requests Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-4 font-medium">Unit</th>
                  <th className="text-left p-4 font-medium">Product</th>
                  <th className="text-right p-4 font-medium">Quantity</th>
                  <th className="text-left p-4 font-medium">Notes</th>
                  <th className="text-left p-4 font-medium">Requested By</th>
                  <th className="text-left p-4 font-medium">Date</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  {canApprove && activeTab === "pending" && (
                    <th className="text-right p-4 font-medium">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      <td className="p-4">
                        <Skeleton className="h-5 w-28" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-5 w-36" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-5 w-16 ml-auto" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-5 w-24" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-5 w-24" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-5 w-20" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-5 w-20" />
                      </td>
                      {canApprove && activeTab === "pending" && (
                        <td className="p-4">
                          <Skeleton className="h-8 w-24 ml-auto" />
                        </td>
                      )}
                    </tr>
                  ))
                ) : requests?.length === 0 ? (
                  <tr>
                    <td
                      colSpan={canApprove && activeTab === "pending" ? 8 : 7}
                      className="p-8 text-center text-muted-foreground"
                    >
                      <Filter className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>
                        No {activeTab !== "all" ? activeTab : ""} requests found
                      </p>
                    </td>
                  </tr>
                ) : (
                  requests?.map((request) => (
                    <tr
                      key={request.id}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4 font-medium">
                        {request.unit?.name || `Unit #${request.unit_id}`}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          {request.product?.name ||
                            `Product #${request.product_id}`}
                        </div>
                      </td>
                      <td className="p-4 text-right font-mono">
                        {request.quantity}
                      </td>
                      <td className="p-4 text-muted-foreground max-w-[200px] truncate">
                        {request.notes || "-"}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {request.requested_by?.name || "-"}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">{getStatusBadge(request.status)}</td>
                      {canApprove && activeTab === "pending" && (
                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleApprove(request)}
                              disabled={approveMutation.isPending}
                              className="px-3 py-1.5 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(request)}
                              disabled={rejectMutation.isPending}
                              className="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <RequestStockModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />
    </>
  );
}
