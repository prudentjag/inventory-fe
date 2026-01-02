import { useFormik } from "formik";
import * as Yup from "yup";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Clock, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CustomFormInput } from "../form/CustomFormInput";
import { useCreateBooking } from "../../data/bookings";
import { useFacilityAvailability } from "../../data/facilities";
import type { Facility, FacilityType, PaymentMethod } from "../../types";

interface BookingModalProps {
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

export default function BookingModal({
  isOpen,
  onClose,
  facilities,
}: BookingModalProps) {
  const createBooking = useCreateBooking();

  const validationSchema = Yup.object({
    facility_id: Yup.number()
      .min(1, "Facility is required")
      .required("Required"),
    customer_name: Yup.string().required("Name is required"),
    customer_phone: Yup.string()
      .min(10, "Valid phone required")
      .required("Required"),
    customer_email: Yup.string().email("Invalid email").nullable(),
    booking_date: Yup.string().required("Date is required"),
    start_time: Yup.string().required("Start time is required"),
    end_time: Yup.string().required("End time is required"),
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
      customer_email: "",
      booking_date: "",
      start_time: "",
      end_time: "",
      payment_method: "cash" as PaymentMethod,
      notes: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        await createBooking.mutateAsync({
          facility_id: Number(values.facility_id),
          customer_name: values.customer_name,
          customer_phone: values.customer_phone,
          customer_email: values.customer_email || undefined,
          booking_date: values.booking_date,
          start_time: values.start_time,
          end_time: values.end_time,
          payment_method: values.payment_method,
          notes: values.notes || undefined,
        });
        toast.success("Booking created successfully");
        handleClose();
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || "Failed to create booking"
        );
      }
    },
  });

  const { data: availabilityData, isLoading: checkingAvailability } =
    useFacilityAvailability(
      formik.values.facility_id || null,
      formik.values.booking_date || null
    );

  const selectedFacility = facilities.find(
    (f) => f.id === Number(formik.values.facility_id)
  );

  // Calculate estimated cost
  const estimatedCost = (() => {
    if (
      !selectedFacility ||
      !formik.values.start_time ||
      !formik.values.end_time
    )
      return 0;
    const start = formik.values.start_time.split(":").map(Number);
    const end = formik.values.end_time.split(":").map(Number);
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];
    const hours = Math.max(0, (endMinutes - startMinutes) / 60);
    return hours * selectedFacility.hourly_rate;
  })();

  const handleClose = () => {
    onClose();
    formik.resetForm();
  };

  const activeFacilities = facilities.filter((f) => f.is_active);

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] border border-border bg-background p-6 shadow-lg rounded-lg max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-lg font-semibold">
              New Booking
            </Dialog.Title>
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
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              >
                <option value="">Select a facility...</option>
                {activeFacilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({FACILITY_TYPE_LABELS[f.type]}) - ₦
                    {f.hourly_rate.toLocaleString()}/hr
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

            <CustomFormInput
              name="customer_email"
              label="Email (optional)"
              type="email"
              formik={formik}
              placeholder="john@example.com"
            />

            {/* Date & Time */}
            <div className="space-y-2">
              <label htmlFor="booking_date" className="text-sm font-medium">
                Booking Date
              </label>
              <input
                type="date"
                id="booking_date"
                name="booking_date"
                min={new Date().toISOString().split("T")[0]}
                className="w-full h-12 px-3 rounded-md border border-input bg-background"
                value={formik.values.booking_date}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.booking_date && formik.errors.booking_date && (
                <p className="text-sm text-destructive">
                  {formik.errors.booking_date}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="start_time" className="text-sm font-medium">
                  Start Time
                </label>
                <input
                  type="time"
                  id="start_time"
                  name="start_time"
                  className="w-full h-12 px-3 rounded-md border border-input bg-background"
                  value={formik.values.start_time}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.start_time && formik.errors.start_time && (
                  <p className="text-sm text-destructive">
                    {formik.errors.start_time}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="end_time" className="text-sm font-medium">
                  End Time
                </label>
                <input
                  type="time"
                  id="end_time"
                  name="end_time"
                  className="w-full h-12 px-3 rounded-md border border-input bg-background"
                  value={formik.values.end_time}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.end_time && formik.errors.end_time && (
                  <p className="text-sm text-destructive">
                    {formik.errors.end_time}
                  </p>
                )}
              </div>
            </div>

            {/* Availability Check */}
            {formik.values.facility_id && formik.values.booking_date && (
              <div className="bg-muted/50 p-3 rounded-lg">
                {checkingAvailability ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock size={14} className="animate-spin" />
                    Checking availability...
                  </div>
                ) : availabilityData?.data ? (
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Operating Hours:</span>
                      <span>
                        {availabilityData.data.operating_hours.open} -{" "}
                        {availabilityData.data.operating_hours.close}
                      </span>
                    </div>
                    {availabilityData.data.booked_slots.length > 0 && (
                      <div>
                        <p className="font-medium text-yellow-600 mb-1">
                          Already Booked:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {availabilityData.data.booked_slots.map((slot, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 border border-red-200"
                            >
                              {slot.start_time} - {slot.end_time}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {availabilityData.data.booked_slots.length === 0 && (
                      <p className="text-green-600">
                        ✓ No bookings yet - all slots available!
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-yellow-600">
                    <AlertCircle size={14} />
                    Could not check availability
                  </div>
                )}
              </div>
            )}

            {/* Payment Method */}
            <div className="space-y-2">
              <label htmlFor="payment_method" className="text-sm font-medium">
                Payment Method
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
                <option value="transfer">Bank Transfer</option>
              </select>
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
                placeholder="Special requests, event type, etc."
                value={formik.values.notes}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </div>

            {/* Estimated Cost */}
            {estimatedCost > 0 && (
              <div className="bg-primary/10 p-3 rounded-lg flex justify-between items-center">
                <span className="font-medium">Estimated Total:</span>
                <span className="text-lg font-bold">
                  ₦{estimatedCost.toLocaleString()}
                </span>
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
                disabled={createBooking.isPending}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {createBooking.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Create Booking"
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
