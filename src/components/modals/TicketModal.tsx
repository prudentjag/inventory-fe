import { useFormik } from "formik";
import * as Yup from "yup";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, Ticket } from "lucide-react";
import { toast } from "sonner";
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
      notes: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        await createTicket.mutateAsync({
          facility_id: Number(values.facility_id),
          customer_name: values.customer_name,
          customer_phone: values.customer_phone,
          ticket_date: values.ticket_date,
          check_in_time: values.check_in_time,
          amount: Number(values.amount),
          payment_method: values.payment_method,
          notes: values.notes || undefined,
        });
        toast.success("Ticket sold successfully!");
        handleClose();
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
  };

  const activeFacilities = facilities.filter((f) => f.is_active);

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] border border-border bg-background p-6 shadow-lg rounded-lg max-h-[90vh] overflow-y-auto">
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
                <label htmlFor="ticket_date" className="text-sm font-medium">
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
                {formik.touched.ticket_date && formik.errors.ticket_date && (
                  <p className="text-sm text-destructive">
                    {formik.errors.ticket_date}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="check_in_time" className="text-sm font-medium">
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
                <label htmlFor="payment_method" className="text-sm font-medium">
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
                    ₦{Number(formik.values.amount).toLocaleString()}
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
