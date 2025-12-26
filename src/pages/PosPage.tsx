import { useState, useMemo } from "react";
import { toast } from "sonner";
import { MOCK_PRODUCTS } from "../services/mockData";
import type { Product, CartItem } from "../types";
import { PosProductGrid } from "../components/pos/PosProductGrid";
import { PosCart } from "../components/pos/PosCart";
import { PaymentModal } from "../components/pos/PaymentModal";
import { InvoiceModal } from "../components/pos/InvoiceModal";

export default function PosPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer"| "pos">(
    "cash"
  );

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<{
    items: CartItem[];
    total: number;
    orderId: string;
  } | null>(null);

  // Derived State
  const categories = [
    "All",
    ...Array.from(new Set(MOCK_PRODUCTS.map((p) => p.category))),
  ];

  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Handlers
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      })
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setIsPaymentModalOpen(true);
  };

  const handleSelectPaymentMethod = (method: "cash" | "transfer") => {
    setPaymentMethod(method);
    setIsPaymentModalOpen(true);
  };

  const processPayment = () => {
    const orderId = `ORD-${Math.floor(Math.random() * 1000000)}`;
    const orderData = {
      items: [...cart],
      total: cartTotal,
      orderId,
    };

    // Save order data for invoice
    setCurrentOrder(orderData);

    // Show success
    toast.success(`Payment of ₦${cartTotal.toLocaleString()} successful!`);

    // Close payment, Open Invoice
    setIsPaymentModalOpen(false);
    setIsInvoiceModalOpen(true);

    // Clear cart
    setCart([]);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6">
      <PosProductGrid
        products={filteredProducts}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddToCart={addToCart}
      />

      <PosCart
        cart={cart}
        cartTotal={cartTotal}
        onUpdateQuantity={updateQuantity}
        onRemoveFromCart={removeFromCart}
        onCheckout={handleCheckout}
        onSelectPaymentMethod={handleSelectPaymentMethod}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        cartTotal={cartTotal}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        onProcessPayment={processPayment}
      />

      {currentOrder && (
        <InvoiceModal
          isOpen={isInvoiceModalOpen}
          onOpenChange={setIsInvoiceModalOpen}
          cart={currentOrder.items}
          cartTotal={currentOrder.total}
          paymentMethod={paymentMethod}
          orderId={currentOrder.orderId}
          onClose={() => setIsInvoiceModalOpen(false)}
        />
      )}
    </div>
  );
}
