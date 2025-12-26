import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Banknote,
  CreditCard,
} from "lucide-react";
import type { CartItem } from "../../types";

interface PosCartProps {
  cart: CartItem[];
  cartTotal: number;
  onUpdateQuantity: (id: string | number, delta: number) => void;
  onRemoveFromCart: (id: string | number) => void;
  onCheckout: () => void;
  onSelectPaymentMethod: (method: "cash" | "transfer" | "pos") => void;
}

export function PosCart({
  cart,
  cartTotal,
  onUpdateQuantity,
  onRemoveFromCart,
  onCheckout,
  onSelectPaymentMethod,
}: PosCartProps) {
  return (
    <div className="w-full lg:w-[380px] flex flex-col bg-card rounded-xl border border-border shadow-sm overflow-hidden flex-shrink-0">
      <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart size={20} className="text-primary" />
          <h2 className="font-semibold">Current Order</h2>
        </div>
        <span className="text-xs font-mono bg-background px-2 py-1 rounded border border-border text-muted-foreground">
          #ORD-{Math.floor(Math.random() * 10000)}
        </span>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center p-4">
            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
              <ShoppingCart size={32} className="opacity-50" />
            </div>
            <p className="font-medium">Cart is empty</p>
            <p className="text-sm mt-1">
              Select products from the grid to add them here.
            </p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.id}
              className="flex gap-3 bg-background p-3 rounded-lg border border-border group"
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{item.name}</h4>
                <p className="text-xs text-muted-foreground">
                  @{item.price.toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-secondary rounded-md px-1 py-0.5">
                  <button
                    onClick={() => onUpdateQuantity(item.id, -1)}
                    className="p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center text-sm font-medium">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, 1)}
                    className="p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="text-right min-w-[60px]">
                  <div className="font-bold text-sm">
                    ₦{(item.price * item.quantity).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => onRemoveFromCart(item.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Footer */}
      <div className="p-4 bg-muted/20 border-t border-border space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>₦{cartTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Tax (0%)</span>
            <span>₦0</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="font-bold text-lg">Total</span>
            <span className="font-bold text-xl text-primary">
              ₦{cartTotal.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => onSelectPaymentMethod("cash")}
            className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg border border-border bg-background hover:bg-accent hover:border-primary/50 transition-all"
          >
            <Banknote size={20} className="text-green-600" />
            <span className="text-xs font-medium">Cash</span>
          </button>
          <button
            onClick={() => onSelectPaymentMethod("transfer")}
            className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg border border-border bg-background hover:bg-accent hover:border-primary/50 transition-all"
          >
            <CreditCard size={20} className="text-red-600" />
            <span className="text-xs font-medium">Pos</span>
          </button>
          <button
            onClick={() => onSelectPaymentMethod("transfer")}
            className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg border border-border bg-background hover:bg-accent hover:border-primary/50 transition-all"
          >
            <CreditCard size={20} className="text-blue-600" />
            <span className="text-xs font-medium">Transfer</span>
          </button>
        </div>

        <button
          onClick={onCheckout}
          disabled={cart.length === 0}
          className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          Complete Order
        </button>
      </div>
    </div>
  );
}
