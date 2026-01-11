import { useFormik } from "formik";
import * as Yup from "yup";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, Ticket, Printer } from "lucide-react";
import { toast } from "sonner";
import { useRef, useState } from "react";
import { CustomFormInput } from "../form/CustomFormInput";
import { useCreateTicket } from "../../data/tickets";
import type { Facility, FacilityType, PaymentMethod } from "../../types";

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilities: Facility[];
}

const FACILITY_TYPE_LABELS: Record<FacilityType, string> = {
  pitch: "Football Pitch",
  event_hall: "Event Hall",
  court: "Court",
  conference_room: "Conference Room",
};

export default function TicketModal({
  isOpen,
  onClose,
  facilities,
}: TicketModalProps) {
  const createTicket = useCreateTicket();
  const [showPrintView, setShowPrintView] = useState(false);
  const [soldTicketData, setSoldTicketData] = useState<{
    facility: Facility | undefined;
    customer_name: string;
    customer_phone: string;
    ticket_date: string;
    check_in_time: string;
    amount: number;
    payment_method: PaymentMethod;
    has_boot?: boolean;
    boot_amount?: number;
    ticket_id?: number;
  } | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const validationSchema = Yup.object({
    facility_id: Yup.number()
      .min(1, "Facility is required")
      .required("Required"),
    customer_name: Yup.string().required("Name is required"),
    customer_phone: Yup.string()
      .min(10, "Valid phone required")
      .required("Required"),
    ticket_date: Yup.string().required("Date is required"),
    check_in_time: Yup.string().required("Check-in time is required"),
    amount: Yup.number()
      .min(1, "Amount must be greater than 0")
      .required("Required"),
    payment_method: Yup.string()
      .oneOf(["cash", "pos", "transfer"])
      .required("Required"),
    has_boot: Yup.boolean(),
    boot_amount: Yup.number().when("has_boot", {
      is: true,
      then: (schema) =>
        schema.min(1, "Boot amount required").required("Required"),
      otherwise: (schema) => schema.nullable(),
    }),
    notes: Yup.string().nullable(),
  });

  const formik = useFormik({
    initialValues: {
      facility_id: "",
      customer_name: "",
      customer_phone: "",
      ticket_date: new Date().toISOString().split("T")[0],
      check_in_time: new Date().toTimeString().slice(0, 5),
      amount: "",
      payment_method: "cash" as PaymentMethod,
      has_boot: false,
      boot_amount: "",
      notes: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const result = await createTicket.mutateAsync({
          facility_id: Number(values.facility_id),
          customer_name: values.customer_name,
          customer_phone: values.customer_phone,
          ticket_date: values.ticket_date,
          check_in_time: values.check_in_time,
          amount:
            Number(values.amount) +
            (values.has_boot ? Number(values.boot_amount) : 0),
          payment_method: values.payment_method,
          has_boot: values.has_boot,
          boot_amount: values.has_boot ? Number(values.boot_amount) : undefined,
          notes: values.notes || undefined,
        });

        // Store ticket data for printing
        setSoldTicketData({
          facility: facilities.find((f) => f.id === Number(values.facility_id)),
          customer_name: values.customer_name,
          customer_phone: values.customer_phone,
          ticket_date: values.ticket_date,
          check_in_time: values.check_in_time,
          amount:
            Number(values.amount) +
            (values.has_boot ? Number(values.boot_amount) : 0),
          payment_method: values.payment_method,
          has_boot: values.has_boot,
          boot_amount: values.has_boot ? Number(values.boot_amount) : undefined,
          ticket_id: result?.data?.id,
        });
        setShowPrintView(true);
        toast.success("Ticket sold successfully!");
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to sell ticket");
      }
    },
  });

  const selectedFacility = facilities.find(
    (f) => f.id === Number(formik.values.facility_id)
  );

  // Auto-fill ticket price when facility is selected
  const handleFacilityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const facilityId = e.target.value;
    formik.setFieldValue("facility_id", facilityId);

    const facility = facilities.find((f) => f.id === Number(facilityId));
    if (facility?.ticket_price) {
      formik.setFieldValue("amount", facility.ticket_price);
    }
  };

  const handleClose = () => {
    onClose();
    formik.resetForm();
    setShowPrintView(false);
    setSoldTicketData(null);
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print the ticket");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket Receipt</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 20px;
              max-width: 300px;
              margin: 0 auto;
            }
            .ticket {
              border: 2px dashed #333;
              padding: 16px;
              text-align: center;
            }
            .ticket-header {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 8px;
              border-bottom: 1px solid #ccc;
              padding-bottom: 8px;
            }
            .ticket-id {
              font-size: 12px;
              color: #666;
              margin-bottom: 12px;
            }
            .ticket-row {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
              font-size: 14px;
            }
            .ticket-row.total {
              font-weight: bold;
              font-size: 16px;
              border-top: 1px solid #ccc;
              margin-top: 8px;
              padding-top: 8px;
            }
            .boot-info {
              font-size: 11px;
              color: #444;
              font-style: italic;
              margin-top: 2px;
            }
            .ticket-footer {
              margin-top: 12px;
              font-size: 12px;
              color: #666;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const activeFacilities = facilities.filter((f) => f.is_active);

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] border border-border bg-background p-6 shadow-lg rounded-lg max-h-[90vh] overflow-y-auto">
          {showPrintView && soldTicketData ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <Ticket
                      size={20}
                      className="text-green-600 dark:text-green-400"
                    />
                  </div>
                  <Dialog.Title className="text-lg font-semibold">
                    Ticket Sold!
                  </Dialog.Title>
                </div>
                <Dialog.Close className="p-1 hover:bg-accent rounded-md">
                  <X size={20} />
                </Dialog.Close>
              </div>

              {/* Printable Ticket Content */}
              <div ref={printRef}>
                <div className="ticket border-2 border-dashed border-border p-4 rounded-lg text-center">
                  <div className="ticket-header text-lg font-bold border-b border-border pb-2 mb-2">
                    {soldTicketData.facility?.name || "Facility"}
                  </div>
                  {soldTicketData.ticket_id && (
                    <div className="ticket-id text-xs text-muted-foreground mb-3">
                      Ticket #{soldTicketData.ticket_id}
                    </div>
                  )}
                  <div className="space-y-2 text-sm text-left">
                    <div className="ticket-row flex justify-between">
                      <span className="text-muted-foreground">Customer:</span>
                      <span className="font-medium">
                        {soldTicketData.customer_name}
                      </span>
                    </div>
                    <div className="ticket-row flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span>{soldTicketData.customer_phone}</span>
                    </div>
                    <div className="ticket-row flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span>{soldTicketData.ticket_date}</span>
                    </div>
                    <div className="ticket-row flex justify-between">
                      <span className="text-muted-foreground">Check-in:</span>
                      <span>{soldTicketData.check_in_time}</span>
                    </div>
                    <div className="ticket-row flex justify-between">
                      <span className="text-muted-foreground">Payment:</span>
                      <span className="capitalize">
                        {soldTicketData.payment_method}
                      </span>
                    </div>
                    {soldTicketData.has_boot && (
                      <div className="ticket-row boot-info">
                        <span className="text-muted-foreground">
                          Incl. Boot:
                        </span>
                        <span>
                          ₦{Number(soldTicketData.boot_amount).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="ticket-row total flex justify-between font-bold text-base border-t border-border pt-2 mt-2">
                      <span>Total:</span>
                      <span>₦{soldTicketData.amount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="ticket-footer mt-3 text-xs text-muted-foreground">
                    Thank you for your patronage!
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium border border-input rounded-lg hover:bg-accent transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  <Printer size={16} />
                  Print Ticket
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Ticket size={20} className="text-primary" />
                  </div>
                  <Dialog.Title className="text-lg font-semibold">
                    Sell Ticket
                  </Dialog.Title>
                </div>
                <Dialog.Close className="p-1 hover:bg-accent rounded-md">
                  <X size={20} />
                </Dialog.Close>
              </div>

              <form onSubmit={formik.handleSubmit} className="space-y-4">
                {/* Facility Selection */}
                <div className="space-y-2">
                  <label htmlFor="facility_id" className="text-sm font-medium">
                    Facility
                  </label>
                  <select
                    id="facility_id"
                    name="facility_id"
                    className="w-full h-12 px-3 rounded-md border border-input bg-background"
                    value={formik.values.facility_id}
                    onChange={handleFacilityChange}
                    onBlur={formik.handleBlur}
                  >
                    <option value="">Select a facility...</option>
                    {activeFacilities.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({FACILITY_TYPE_LABELS[f.type]})
                        {f.ticket_price
                          ? ` - ₦${f.ticket_price.toLocaleString()}`
                          : ""}
                      </option>
                    ))}
                  </select>
                  {formik.touched.facility_id && formik.errors.facility_id && (
                    <p className="text-sm text-destructive">
                      {formik.errors.facility_id}
                    </p>
                  )}
                </div>

                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-4">
                  <CustomFormInput
                    name="customer_name"
                    label="Customer Name"
                    formik={formik}
                    placeholder="John Doe"
                  />
                  <CustomFormInput
                    name="customer_phone"
                    label="Phone"
                    formik={formik}
                    placeholder="08012345678"
                  />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="ticket_date"
                      className="text-sm font-medium"
                    >
                      Date
                    </label>
                    <input
                      type="date"
                      id="ticket_date"
                      name="ticket_date"
                      className="w-full h-12 px-3 rounded-md border border-input bg-background"
                      value={formik.values.ticket_date}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.touched.ticket_date &&
                      formik.errors.ticket_date && (
                        <p className="text-sm text-destructive">
                          {formik.errors.ticket_date}
                        </p>
                      )}
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="check_in_time"
                      className="text-sm font-medium"
                    >
                      Check-in Time
                    </label>
                    <input
                      type="time"
                      id="check_in_time"
                      name="check_in_time"
                      className="w-full h-12 px-3 rounded-md border border-input bg-background"
                      value={formik.values.check_in_time}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.touched.check_in_time &&
                      formik.errors.check_in_time && (
                        <p className="text-sm text-destructive">
                          {formik.errors.check_in_time}
                        </p>
                      )}
                  </div>
                </div>

                {/* Amount & Payment */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="amount" className="text-sm font-medium">
                      Amount (₦)
                    </label>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      min="0"
                      className="w-full h-12 px-3 rounded-md border border-input bg-background"
                      placeholder="500"
                      value={formik.values.amount}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.touched.amount && formik.errors.amount && (
                      <p className="text-sm text-destructive">
                        {formik.errors.amount}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="payment_method"
                      className="text-sm font-medium"
                    >
                      Payment
                    </label>
                    <select
                      id="payment_method"
                      name="payment_method"
                      className="w-full h-12 px-3 rounded-md border border-input bg-background"
                      value={formik.values.payment_method}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    >
                      <option value="cash">Cash</option>
                      <option value="pos">POS</option>
                      <option value="transfer">Transfer</option>
                    </select>
                  </div>
                </div>

                {/* Boot Option */}
                <div className="space-y-3 p-3 border border-border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="has_boot"
                      name="has_boot"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={formik.values.has_boot}
                      onChange={formik.handleChange}
                    />
                    <label htmlFor="has_boot" className="text-sm font-medium">
                      Customer wants Boot?
                    </label>
                  </div>

                  {formik.values.has_boot && (
                    <div className="space-y-2 pl-6 animate-in slide-in-from-top-1 duration-200">
                      <label
                        htmlFor="boot_amount"
                        className="text-sm font-medium"
                      >
                        Boot Amount (₦)
                      </label>
                      <input
                        type="number"
                        id="boot_amount"
                        name="boot_amount"
                        min="0"
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        placeholder="e.g. 500"
                        value={formik.values.boot_amount}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                      {formik.touched.boot_amount &&
                        formik.errors.boot_amount && (
                          <p className="text-sm text-destructive">
                            {formik.errors.boot_amount}
                          </p>
                        )}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label htmlFor="notes" className="text-sm font-medium">
                    Notes (optional)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={2}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background resize-none"
                    placeholder="Regular player, etc."
                    value={formik.values.notes}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                </div>

                {/* Summary */}
                {selectedFacility && formik.values.amount && (
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total:</span>
                      <span className="text-lg font-bold">
                        ₦
                        {(
                          Number(formik.values.amount) +
                          (formik.values.has_boot
                            ? Number(formik.values.boot_amount || 0)
                            : 0)
                        ).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedFacility.name} • {formik.values.ticket_date}
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-sm font-medium border border-input rounded-lg hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createTicket.isPending}
                    className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {createTicket.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Ticket size={16} />
                        Sell Ticket
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
