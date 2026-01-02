import * as Dialog from "@radix-ui/react-dialog";
import { format } from "date-fns";
import {
  Printer,
  X,
  CheckCircle,
  Banknote,
  Clock,
  Copy,
  Loader2,
} from "lucide-react";
import { useRef, useEffect, useState } from "react";
import type { CartItem, VirtualAccountDetails } from "../../types";
import { toast } from "sonner";
import { useVerifyPayment } from "../../data/sales";

interface InvoiceModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  cartTotal: number;
  paymentMethod: "cash" | "transfer" | "pos" | "monnify";
  orderId: string;
  invoiceNumber?: string;
  checkoutUrl?: string;
  accountDetails?: VirtualAccountDetails;
  isPending?: boolean;
  onClose: () => void;
}

export function InvoiceModal({
  isOpen,
  onOpenChange,
  cart,
  cartTotal,
  paymentMethod,
  orderId,
  invoiceNumber,
  checkoutUrl,
  accountDetails,
  isPending: initialIsPending,
  onClose,
}: InvoiceModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Poll for payment verification when Monnify is pending
  const shouldPoll =
    paymentMethod === "monnify" && initialIsPending && !isConfirmed && isOpen;
  const { data: verificationData, isFetching } = useVerifyPayment(
    shouldPoll ? invoiceNumber || orderId : null,
    { enabled: shouldPoll, refetchInterval: 5000 }
  );

  // Check if payment was confirmed
  const paymentStatus = verificationData?.data?.payment_status;
  const isPending =
    initialIsPending &&
    !isConfirmed &&
    paymentStatus !== "paid" &&
    paymentStatus !== "completed";

  // Show toast and update state when payment is confirmed
  useEffect(() => {
    if (paymentStatus === "paid" || paymentStatus === "completed") {
      setIsConfirmed(true);
      toast.success("Payment confirmed! Thank you.");
    } else if (paymentStatus === "failed") {
      toast.error("Payment failed. Please try again.");
    }
  }, [paymentStatus]);

  // Reset confirmed state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsConfirmed(false);
    }
  }, [isOpen]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handlePrint = () => {
    const printContent = contentRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "", "height=600,width=800");
    if (!printWindow) return;

    printWindow.document.write("<html><head><title>Print Invoice</title>");
    printWindow.document.write(
      "<style>body{font-family: sans-serif; padding: 20px;} table{width: 100%; border-collapse: collapse;} th, td{text-align: left; padding: 5px; border-bottom: 1px solid #ddd;} .text-right{text-align: right;} .text-center{text-align: center;} .font-bold{font-weight: bold;} .text-sm{font-size: 0.875rem;} .mb-4{margin-bottom: 1rem;} .border-t{border-top: 1px solid #000;}</style>"
    );
    printWindow.document.write("</head><body>");
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-sm translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 sm:rounded-lg max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b pb-4 no-print">
            <Dialog.Title className="text-lg font-semibold leading-none tracking-tight flex items-center gap-2">
              {isPending ? (
                <>
                  <Clock className="text-amber-500" size={20} />
                  Payment Pending
                  {isFetching && (
                    <Loader2
                      className="animate-spin text-muted-foreground ml-2"
                      size={14}
                    />
                  )}
                </>
              ) : (
                <>
                  <CheckCircle className="text-green-500" size={20} />
                  Payment Successful
                </>
              )}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Polling Status */}
          {isPending && shouldPoll && (
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg px-3 py-2 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2 no-print">
              <Loader2 className="animate-spin" size={14} />
              <span>Waiting for payment confirmation...</span>
            </div>
          )}

          {/* Virtual Account Details for Monnify */}
          {accountDetails && (
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-lg p-4 space-y-3 no-print">
              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                <Banknote size={16} />
                Transfer to Complete Payment
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Bank Name</span>
                  <span className="font-medium">{accountDetails.bankName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Account Number</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold tracking-wider">
                      {accountDetails.accountNumber}
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(accountDetails.accountNumber)
                      }
                      className="p-1 hover:bg-blue-200 dark:hover:bg-blue-800/30 rounded text-blue-600 dark:text-blue-400"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold text-primary">
                    ₦{accountDetails.amount.toLocaleString()}
                  </span>
                </div>
                {accountDetails.expiresOn && (
                  <div className="flex justify-between items-center text-xs text-amber-600 dark:text-amber-400">
                    <span>Expires</span>
                    <span>
                      {format(new Date(accountDetails.expiresOn), "PPp")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Printable Invoice Area */}
          <div
            ref={contentRef}
            className="bg-white text-black p-4 rounded border border-gray-200 text-sm font-mono"
          >
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold uppercase tracking-wider">
                Inventory Sys
              </h2>
              <p className="text-xs text-gray-500">
                123 Business Road, Lagos
                <br />
                Tel: +234 800 123 4567
              </p>
            </div>

            <div className="mb-4 space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{format(new Date(), "dd/MM/yyyy HH:mm")}</span>
              </div>
              <div className="flex justify-between">
                <span>Order No:</span>
                <span>{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment:</span>
                <span className="uppercase">{paymentMethod}</span>
              </div>
            </div>

            <div className="border-t border-b border-dashed border-gray-300 py-2 mb-4">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="pb-2">Item</th>
                    <th className="pb-2 text-right">Qty</th>
                    <th className="pb-2 text-right">Price</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item.id}>
                      <td className="py-1">{item.name}</td>
                      <td className="py-1 text-right">{item.quantity}</td>
                      <td className="py-1 text-right">
                        {(
                          item.price ??
                          item.selling_price ??
                          0
                        ).toLocaleString()}
                      </td>
                      <td className="py-1 text-right">
                        {(
                          (item.price ?? item.selling_price ?? 0) *
                          item.quantity
                        ).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1 text-right mb-6">
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>₦{cartTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="text-center text-xs text-gray-500">
              <p>Thank you for your patronage!</p>
              <p>No refunds after purchase.</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2 no-print">
            {checkoutUrl && (
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Banknote size={16} />
                Open Monnify Checkout
              </a>
            )}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg border border-input bg-background hover:bg-accent font-medium transition-colors"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Printer size={16} />
                Print Receipt
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
