import { Banknote, CreditCard, Copy, Check, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "../../lib/utils";
import { toast } from "sonner";

const MOCK_BANK_DETAILS = {
  bankName: "Zenith Bank",
  accountNumber: "1012345678",
  accountName: "Inventory System Ltd",
};

interface PaymentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  cartTotal: number;
  paymentMethod: "cash" | "transfer";
  setPaymentMethod: (method: "cash" | "transfer") => void;
  onProcessPayment: () => void;
}

export function PaymentModal({
  isOpen,
  onOpenChange,
  cartTotal,
  paymentMethod,
  setPaymentMethod,
  onProcessPayment,
}: PaymentModalProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <Dialog.Title className="text-lg font-semibold leading-none tracking-tight">
                Complete Payment
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground mt-1">
                Choose your preferred payment method.
              </Dialog.Description>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-2">
            <button
              onClick={() => setPaymentMethod("cash")}
              className={cn(
                "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                paymentMethod === "cash"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-background hover:bg-accent text-muted-foreground"
              )}
            >
              <Banknote size={24} />
              <span className="font-semibold text-sm">Cash</span>
            </button>
            <button
              onClick={() => setPaymentMethod("transfer")}
              className={cn(
                "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                paymentMethod === "transfer"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-background hover:bg-accent text-muted-foreground"
              )}
            >
              <CreditCard size={24} />
              <span className="font-semibold text-sm">Transfer</span>
            </button>
          </div>

          <div className="py-2">
            <div className="bg-muted/30 p-4 rounded-lg flex justify-between items-center mb-6">
              <span className="text-sm font-medium">Total Amount Due</span>
              <span className="text-2xl font-bold text-primary">
                ₦{cartTotal.toLocaleString()}
              </span>
            </div>

            {paymentMethod === "transfer" ? (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-lg p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
                    Company Bank Account
                  </h4>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Bank Name</p>
                    <p className="font-medium">{MOCK_BANK_DETAILS.bankName}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Account Number
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-lg font-bold tracking-wider">
                        {MOCK_BANK_DETAILS.accountNumber}
                      </p>
                      <button
                        onClick={() =>
                          copyToClipboard(MOCK_BANK_DETAILS.accountNumber)
                        }
                        className="p-1.5 hover:bg-blue-200 dark:hover:bg-blue-800/30 rounded text-blue-600 dark:text-blue-400"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Account Name
                    </p>
                    <p className="font-medium">
                      {MOCK_BANK_DETAILS.accountName}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  Please ask the customer to verify the account name before
                  transferring.
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 mb-2">
                  <Check size={32} />
                </div>
                <div>
                  <h3 className="font-medium">Confirm Cash Payment</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Please ensure you have received the exact cash amount from
                    the customer.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 py-2.5 rounded-lg border border-input bg-background hover:bg-accent font-light transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onProcessPayment}
              className="flex-1 py-2.5 text-sm rounded-lg bg-primary text-primary-foreground font-light hover:bg-primary/90 transition-colors shadow-sm"
            >
              {paymentMethod === "cash"
                ? "Confirm Payment"
                : "I Have Sent The Money"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
