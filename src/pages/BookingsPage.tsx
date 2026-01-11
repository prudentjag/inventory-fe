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
  Ticket,
  CalendarCheck,
  RotateCcw,
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
import {
  useTickets,
  useRefundTicket,
  useTicketStats,
  type TicketFilters,
} from "../data/tickets";
import { useFacilities } from "../data/facilities";
import type {
  FacilityBooking,
  FacilityTicket,
  BookingStatus,
  TicketStatus,
  FacilityType,
  PaginationLink,
} from "../types";
import BookingModal from "../components/modals/BookingModal";
import TicketModal from "../components/modals/TicketModal";

type TabType = "bookings" | "ticketing";

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

const TICKET_STATUS_STYLES: Record<TicketStatus, string> = {
  paid: "bg-green-100 text-green-700 border-green-200",
  refunded: "bg-gray-100 text-gray-700 border-gray-200",
};

const FACILITY_TYPE_LABELS: Record<FacilityType, string> = {
  pitch: "Football Pitch",
  event_hall: "Event Hall",
  court: "Court",
  conference_room: "Conference Room",
};

export default function BookingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("bookings");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] =
    useState<FacilityBooking | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<FacilityTicket | null>(
    null
  );
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Booking Filters
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "">("");
  const [facilityTypeFilter, setFacilityTypeFilter] = useState<
    FacilityType | ""
  >("");

  // Ticket Filters
  const [ticketDateFilter, setTicketDateFilter] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [ticketStatusFilter, setTicketStatusFilter] = useState<
    TicketStatus | ""
  >("");

  const bookingFilters: BookingFilters = {
    date: dateFilter || undefined,
    status: statusFilter || undefined,
    facility_type: facilityTypeFilter || undefined,
    page: currentPage,
  };

  const ticketFilters: TicketFilters = {
    date: ticketDateFilter || undefined,
    status: ticketStatusFilter || undefined,
    page: currentPage,
  };

  const { data: bookingsData, isLoading: loadingBookings } =
    useBookings(bookingFilters);
  const { data: ticketsData, isLoading: loadingTickets } =
    useTickets(ticketFilters);
  const { data: ticketStatsData } = useTicketStats({
    date: ticketDateFilter,
  });
  const { data: facilitiesData } = useFacilities();
  const confirmBooking = useConfirmBooking();
  const cancelBooking = useCancelBooking();
  const refundTicket = useRefundTicket();

  const canManage = ["admin", "manager", "staff"].includes(user?.role || "");

  // Extract pagination info for bookings
  const bookingPaginationInfo = (() => {
    if (!bookingsData?.data) return null;
    const inner = bookingsData.data;
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

  // Extract pagination info for tickets
  const ticketPaginationInfo = (() => {
    if (!ticketsData?.data) return null;
    const inner = ticketsData.data;
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
    if (!bookingsData?.data) return [];
    const inner = bookingsData.data;
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

  const tickets: FacilityTicket[] = (() => {
    if (!ticketsData?.data) return [];
    const inner = ticketsData.data;
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

  const filteredTickets = tickets.filter(
    (t) =>
      t.ticket_reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customer_phone.includes(searchQuery)
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

  const handleRefundTicket = async (ticket: FacilityTicket) => {
    if (!confirm(`Refund ticket ${ticket.ticket_reference}?`)) return;
    try {
      await refundTicket.mutateAsync(ticket.id);
      toast.success("Ticket refunded");
      setSelectedTicket(null);
    } catch {
      toast.error("Failed to refund ticket");
    }
  };

  const getAmount = (item: FacilityBooking | FacilityTicket) => {
    const amt = "total_amount" in item ? item.total_amount : item.amount;
    return typeof amt === "string" ? parseFloat(amt) : amt;
  };

  const bookingColumns: Column<FacilityBooking>[] = [
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

  const ticketColumns: Column<FacilityTicket>[] = [
    {
      header: "Reference",
      accessorKey: "ticket_reference",
      cell: (t) => (
        <span className="font-mono text-xs font-semibold">
          {t.ticket_reference}
        </span>
      ),
    },
    {
      header: "Facility",
      accessorKey: "facility_id",
      cell: (t) => (
        <div>
          <p className="font-medium">{t.facility?.name || "Unknown"}</p>
          <p className="text-xs text-muted-foreground">
            {t.facility?.type ? FACILITY_TYPE_LABELS[t.facility.type] : ""}
          </p>
        </div>
      ),
    },
    {
      header: "Customer",
      accessorKey: "customer_name",
      cell: (t) => (
        <div>
          <div className="flex items-center gap-1.5">
            <User size={12} className="text-muted-foreground" />
            <span className="font-medium">{t.customer_name}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone size={10} />
            {t.customer_phone}
          </div>
        </div>
      ),
    },
    {
      header: "Check-in",
      accessorKey: "check_in_time",
      cell: (t) => (
        <div>
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-muted-foreground" />
            <span>{t.check_in_time}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {format(new Date(t.ticket_date), "MMM dd")}
          </p>
        </div>
      ),
    },
    {
      header: "Amount",
      accessorKey: "amount",
      className: "font-bold",
      cell: (t) => <span>₦{getAmount(t).toLocaleString()}</span>,
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (t) => (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
            TICKET_STATUS_STYLES[t.status]
          )}
        >
          {t.status === "paid" ? (
            <CheckCircle size={10} />
          ) : (
            <RotateCcw size={10} />
          )}
          {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
        </span>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      headerClassName: "text-right",
      cell: (t) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTicket(t);
            }}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          {t.status === "paid" && canManage && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRefundTicket(t);
              }}
              className="p-2 text-orange-600 hover:bg-orange-100 rounded-md transition-colors"
              title="Refund"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  const ticketStats = ticketStatsData?.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Bookings & Tickets
          </h1>
          <p className="text-muted-foreground">
            Manage facility reservations and individual ticket sales.
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            {activeTab === "bookings" ? (
              <button
                onClick={() => setIsBookingModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                <Plus size={18} />
                New Booking
              </button>
            ) : (
              <button
                onClick={() => setIsTicketModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                <Ticket size={18} />
                Sell Ticket
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        <button
          onClick={() => {
            setActiveTab("bookings");
            setCurrentPage(1);
            setSearchQuery("");
          }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
            activeTab === "bookings"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <CalendarCheck size={16} />
          Bookings
        </button>
        <button
          onClick={() => {
            setActiveTab("ticketing");
            setCurrentPage(1);
            setSearchQuery("");
          }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
            activeTab === "ticketing"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Ticket size={16} />
          Ticketing
        </button>
      </div>

      {activeTab === "bookings" ? (
        <>
          {/* Booking Filters */}
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
            columns={bookingColumns}
            isLoading={loadingBookings}
            searchPlaceholder="Search by reference, customer..."
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            onRowClick={(item) => setSelectedBooking(item)}
          />

          {/* Booking Pagination */}
          {bookingPaginationInfo && bookingPaginationInfo.lastPage > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-card border border-border rounded-xl">
              <div className="text-sm text-muted-foreground">
                Showing {bookingPaginationInfo.from} to{" "}
                {bookingPaginationInfo.to} of {bookingPaginationInfo.total}{" "}
                bookings
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
                  {bookingPaginationInfo.links
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
                    setCurrentPage((p) =>
                      Math.min(bookingPaginationInfo.lastPage, p + 1)
                    )
                  }
                  disabled={currentPage === bookingPaginationInfo.lastPage}
                  className="p-2 rounded-md border border-input bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Ticket Stats */}
          {ticketStats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card p-4 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground">Today's Tickets</p>
                <p className="text-2xl font-bold">
                  {ticketStats.total_tickets}
                </p>
              </div>
              <div className="bg-card p-4 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  ₦{ticketStats.total_revenue.toLocaleString()}
                </p>
              </div>
              <div className="bg-card p-4 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-2">By Payment</p>
                <div className="flex gap-2 flex-wrap">
                  {ticketStats.payment_breakdown.map((pb) => (
                    <span
                      key={pb.payment_method}
                      className="text-xs px-2 py-1 rounded bg-muted"
                    >
                      {pb.payment_method}: {pb.count}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Ticket Filters */}
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
                  value={ticketDateFilter}
                  onChange={(e) => setTicketDateFilter(e.target.value)}
                  className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </label>
                <select
                  value={ticketStatusFilter}
                  onChange={(e) =>
                    setTicketStatusFilter(e.target.value as TicketStatus | "")
                  }
                  className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">All Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>
          </div>

          <DataTable
            data={filteredTickets}
            columns={ticketColumns}
            isLoading={loadingTickets}
            searchPlaceholder="Search by reference, customer..."
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            onRowClick={(item) => setSelectedTicket(item)}
          />

          {/* Ticket Pagination */}
          {ticketPaginationInfo && ticketPaginationInfo.lastPage > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-card border border-border rounded-xl">
              <div className="text-sm text-muted-foreground">
                Showing {ticketPaginationInfo.from} to {ticketPaginationInfo.to}{" "}
                of {ticketPaginationInfo.total} tickets
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
                  {ticketPaginationInfo.links
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
                    setCurrentPage((p) =>
                      Math.min(ticketPaginationInfo.lastPage, p + 1)
                    )
                  }
                  disabled={currentPage === ticketPaginationInfo.lastPage}
                  className="p-2 rounded-md border border-input bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Booking Details Modal */}
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

      {/* Ticket Details Modal */}
      <Dialog.Root
        open={!!selectedTicket}
        onOpenChange={(open) => !open && setSelectedTicket(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] border border-border bg-background p-6 shadow-lg rounded-lg">
            {selectedTicket && (
              <>
                <Dialog.Title className="text-lg font-semibold mb-1">
                  Ticket Details
                </Dialog.Title>
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedTicket.ticket_reference}
                </p>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block mb-1">
                        Facility
                      </span>
                      <p className="font-medium">
                        {selectedTicket.facility?.name}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">
                        Status
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
                          TICKET_STATUS_STYLES[selectedTicket.status]
                        )}
                      >
                        {selectedTicket.status === "paid" ? (
                          <CheckCircle size={10} />
                        ) : (
                          <RotateCcw size={10} />
                        )}
                        {selectedTicket.status.charAt(0).toUpperCase() +
                          selectedTicket.status.slice(1)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">
                        Customer
                      </span>
                      <p className="font-medium">
                        {selectedTicket.customer_name}
                      </p>
                      <p className="text-xs">{selectedTicket.customer_phone}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">
                        Check-in
                      </span>
                      <p className="font-medium">
                        {format(
                          new Date(selectedTicket.ticket_date),
                          "MMM dd, yyyy"
                        )}
                      </p>
                      <p className="text-xs">{selectedTicket.check_in_time}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">
                        Amount
                      </span>
                      <p className="font-bold text-lg">
                        ₦{getAmount(selectedTicket).toLocaleString()}
                      </p>
                      {selectedTicket.has_boot && (
                        <p className="text-xs text-muted-foreground italic">
                          (Includes ₦
                          {Number(selectedTicket.boot_amount).toLocaleString()}{" "}
                          boot)
                        </p>
                      )}
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">
                        Payment
                      </span>
                      <p className="font-medium capitalize">
                        {selectedTicket.payment_method}
                      </p>
                    </div>
                  </div>

                  {selectedTicket.notes && (
                    <div>
                      <span className="text-muted-foreground block mb-1 text-sm">
                        Notes
                      </span>
                      <p className="text-sm bg-muted/50 p-2 rounded">
                        {selectedTicket.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  {selectedTicket.status === "paid" && canManage && (
                    <button
                      onClick={() => handleRefundTicket(selectedTicket)}
                      className="px-4 py-2 text-sm font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      Refund
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedTicket(null)}
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
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        facilities={facilitiesData?.data || []}
      />

      {/* Sell Ticket Modal */}
      <TicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        facilities={facilitiesData?.data || []}
      />
    </div>
  );
}
