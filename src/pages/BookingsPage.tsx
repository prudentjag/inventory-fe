import { useState } from "react";
import {
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  User,
  Phone,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { format } from "date-fns";
import { DataTable, type Column } from "../components/ui/DataTable";
import { useAuth } from "../context/AuthContext";
import {
  useBookings,
  useConfirmBooking,
  useCancelBooking,
  type BookingFilters,
} from "../data/bookings";
import { useFacilities } from "../data/facilities";
import type {
  FacilityBooking,
  BookingStatus,
  FacilityType,
  PaginationLink,
} from "../types";
import BookingModal from "../components/modals/BookingModal";

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  confirmed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_ICONS: Record<BookingStatus, React.ReactNode> = {
  pending: <Clock size={10} />,
  confirmed: <CheckCircle size={10} />,
  cancelled: <XCircle size={10} />,
};

const FACILITY_TYPE_LABELS: Record<FacilityType, string> = {
  pitch: "Football Pitch",
  event_hall: "Event Hall",
  court: "Court",
  conference_room: "Conference Room",
};

export default function BookingsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] =
    useState<FacilityBooking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "">("");
  const [facilityTypeFilter, setFacilityTypeFilter] = useState<
    FacilityType | ""
  >("");

  const filters: BookingFilters = {
    date: dateFilter || undefined,
    status: statusFilter || undefined,
    facility_type: facilityTypeFilter || undefined,
    page: currentPage,
  };

  const { data: bookingsData, isLoading } = useBookings(filters);
  const { data: facilitiesData } = useFacilities();
  const confirmBooking = useConfirmBooking();
  const cancelBooking = useCancelBooking();

  const canManage = ["admin", "manager", "staff"].includes(user?.role || "");

  // Extract pagination info
  const rawData = bookingsData;
  const paginationInfo = (() => {
    if (!rawData?.data) return null;
    const inner = rawData.data;
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
    return null;
  })();

  const bookings: FacilityBooking[] = (() => {
    if (!rawData?.data) return [];
    const inner = rawData.data;
    if (
      inner &&
      typeof inner === "object" &&
      "data" in inner &&
      Array.isArray(inner.data)
    ) {
      return inner.data;
    }
    if (Array.isArray(inner)) return inner;
    return [];
  })();

  const filteredBookings = bookings.filter(
    (b) =>
      b.booking_reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customer_phone.includes(searchQuery)
  );

  const handleConfirm = async (booking: FacilityBooking) => {
    try {
      await confirmBooking.mutateAsync(booking.id);
      toast.success("Booking confirmed");
    } catch {
      toast.error("Failed to confirm booking");
    }
  };

  const handleCancel = async (booking: FacilityBooking) => {
    if (!confirm(`Cancel booking ${booking.booking_reference}?`)) return;
    try {
      await cancelBooking.mutateAsync(booking.id);
      toast.success("Booking cancelled");
    } catch {
      toast.error("Failed to cancel booking");
    }
  };

  const getAmount = (booking: FacilityBooking) => {
    const amt = booking.total_amount;
    return typeof amt === "string" ? parseFloat(amt) : amt;
  };

  const columns: Column<FacilityBooking>[] = [
    {
      header: "Reference",
      accessorKey: "booking_reference",
      cell: (b) => (
        <span className="font-mono text-xs font-semibold">
          {b.booking_reference}
        </span>
      ),
    },
    {
      header: "Facility",
      accessorKey: "facility_id",
      cell: (b) => (
        <div>
          <p className="font-medium">{b.facility?.name || "Unknown"}</p>
          <p className="text-xs text-muted-foreground">
            {b.facility?.type ? FACILITY_TYPE_LABELS[b.facility.type] : ""}
          </p>
        </div>
      ),
    },
    {
      header: "Customer",
      accessorKey: "customer_name",
      cell: (b) => (
        <div>
          <div className="flex items-center gap-1.5">
            <User size={12} className="text-muted-foreground" />
            <span className="font-medium">{b.customer_name}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone size={10} />
            {b.customer_phone}
          </div>
        </div>
      ),
    },
    {
      header: "Date & Time",
      accessorKey: "booking_date",
      cell: (b) => (
        <div>
          <div className="flex items-center gap-1.5">
            <Calendar size={12} className="text-muted-foreground" />
            <span>{format(new Date(b.booking_date), "MMM dd, yyyy")}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {b.start_time} - {b.end_time}
          </p>
        </div>
      ),
    },
    {
      header: "Amount",
      accessorKey: "total_amount",
      className: "font-bold",
      cell: (b) => <span>₦{getAmount(b).toLocaleString()}</span>,
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (b) => (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
            STATUS_STYLES[b.status]
          )}
        >
          {STATUS_ICONS[b.status]}
          {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
        </span>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      headerClassName: "text-right",
      cell: (b) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedBooking(b);
            }}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          {b.status === "pending" && canManage && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleConfirm(b);
                }}
                className="p-2 text-green-600 hover:bg-green-100 rounded-md transition-colors"
                title="Confirm"
              >
                <CheckCircle size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancel(b);
                }}
                className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                title="Cancel"
              >
                <XCircle size={16} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground">
            Manage facility reservations and appointments.
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <Plus size={18} />
            New Booking
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Filter size={18} />
          <span className="text-sm font-medium">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Date
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as BookingStatus | "")
              }
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Facility Type
            </label>
            <select
              value={facilityTypeFilter}
              onChange={(e) =>
                setFacilityTypeFilter(e.target.value as FacilityType | "")
              }
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All Types</option>
              {(Object.keys(FACILITY_TYPE_LABELS) as FacilityType[]).map(
                (type) => (
                  <option key={type} value={type}>
                    {FACILITY_TYPE_LABELS[type]}
                  </option>
                )
              )}
            </select>
          </div>
        </div>
        {(dateFilter || statusFilter || facilityTypeFilter) && (
          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                setDateFilter("");
                setStatusFilter("");
                setFacilityTypeFilter("");
              }}
              className="text-xs text-primary hover:underline font-medium"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      <DataTable
        data={filteredBookings}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search by reference, customer..."
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        onRowClick={(item) => setSelectedBooking(item)}
      />

      {/* Pagination */}
      {paginationInfo && paginationInfo.lastPage > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-card border border-border rounded-xl">
          <div className="text-sm text-muted-foreground">
            Showing {paginationInfo.from} to {paginationInfo.to} of{" "}
            {paginationInfo.total} bookings
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
        open={!!selectedBooking}
        onOpenChange={(open) => !open && setSelectedBooking(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] border border-border bg-background p-6 shadow-lg rounded-lg">
            {selectedBooking && (
              <>
                <Dialog.Title className="text-lg font-semibold mb-1">
                  Booking Details
                </Dialog.Title>
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedBooking.booking_reference}
                </p>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block mb-1">
                        Facility
                      </span>
                      <p className="font-medium">
                        {selectedBooking.facility?.name}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">
                        Status
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
                          STATUS_STYLES[selectedBooking.status]
                        )}
                      >
                        {STATUS_ICONS[selectedBooking.status]}
                        {selectedBooking.status.charAt(0).toUpperCase() +
                          selectedBooking.status.slice(1)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">
                        Customer
                      </span>
                      <p className="font-medium">
                        {selectedBooking.customer_name}
                      </p>
                      <p className="text-xs">
                        {selectedBooking.customer_phone}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">
                        Date & Time
                      </span>
                      <p className="font-medium">
                        {format(
                          new Date(selectedBooking.booking_date),
                          "MMM dd, yyyy"
                        )}
                      </p>
                      <p className="text-xs">
                        {selectedBooking.start_time} -{" "}
                        {selectedBooking.end_time}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">
                        Total Amount
                      </span>
                      <p className="font-bold text-lg">
                        ₦{getAmount(selectedBooking).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">
                        Payment
                      </span>
                      <p className="font-medium capitalize">
                        {selectedBooking.payment_method}
                      </p>
                    </div>
                  </div>

                  {selectedBooking.notes && (
                    <div>
                      <span className="text-muted-foreground block mb-1 text-sm">
                        Notes
                      </span>
                      <p className="text-sm bg-muted/50 p-2 rounded">
                        {selectedBooking.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  {selectedBooking.status === "pending" && canManage && (
                    <>
                      <button
                        onClick={() => {
                          handleConfirm(selectedBooking);
                          setSelectedBooking(null);
                        }}
                        className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => {
                          handleCancel(selectedBooking);
                          setSelectedBooking(null);
                        }}
                        className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="px-4 py-2 text-sm font-medium border border-input rounded-lg hover:bg-accent transition-colors"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* New Booking Modal */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        facilities={facilitiesData?.data || []}
      />
    </div>
  );
}
