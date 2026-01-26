import { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Loader2, Store } from "lucide-react";
import type {
  Product,
  CartItem,
  Brand,
  InventoryItem,
  SuspendedOrder,
} from "../types";
import { useCategories } from "../data/categories";
import { useInventory } from "../data/inventory";
import { useBrands } from "../data/brands";
import { useAuth } from "../context/AuthContext";
import { PosProductGrid } from "../components/pos/PosProductGrid";
import { PosCart } from "../components/pos/PosCart";
import { PaymentModal } from "../components/pos/PaymentModal";
import { InvoiceModal } from "../components/pos/InvoiceModal";
import { SuspendedOrdersPanel } from "../components/pos/SuspendedOrdersPanel";
import { useCreateSale } from "../data/sales";
import type { Sale, VirtualAccountDetails } from "../types";

const SUSPENDED_ORDERS_KEY = "pos_suspended_orders";

export default function PosPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "transfer" | "pos" | "monnify"
  >("cash");

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<{
    items: CartItem[];
    total: number;
    orderId: string;
    invoiceNumber?: string;
    checkoutUrl?: string;
    accountDetails?: VirtualAccountDetails;
    isPending?: boolean;
  } | null>(null);

  // Suspended orders state
  const [suspendedOrders, setSuspendedOrders] = useState<SuspendedOrder[]>([]);
  const [isSuspendedPanelOpen, setIsSuspendedPanelOpen] = useState(false);

  // Load suspended orders from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SUSPENDED_ORDERS_KEY);
      if (saved) {
        setSuspendedOrders(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to load suspended orders:", error);
    }
  }, []);

  // Save suspended orders to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(
        SUSPENDED_ORDERS_KEY,
        JSON.stringify(suspendedOrders),
      );
    } catch (error) {
      console.error("Failed to save suspended orders:", error);
    }
  }, [suspendedOrders]);

  const { user } = useAuth();
  const effectiveUnitId = user?.assigned_unit_id || user?.units?.[0]?.id;

  // API Data
  const { data: categoriesData } = useCategories();
  const { data: inventoryData, isLoading } = useInventory(
    effectiveUnitId || undefined,
  );
  const { data: brandsData } = useBrands();
  const { mutate: createSale, isPending: isCreatingSale } = useCreateSale();

  // Build brand lookup map for efficient access
  const brandsMap = useMemo(() => {
    const map = new Map<number, Brand>();
    brandsData?.forEach((brand) => map.set(brand.id, brand));
    return map;
  }, [brandsData]);

  // Categories with "All" prepended
  const categories = useMemo(() => {
    const categoryNames = categoriesData?.map((c) => c.name) ?? [];
    return ["All", ...categoryNames];
  }, [categoriesData]);

  // Products from unit inventory, with mapped category names
  const products = useMemo(() => {
    return (inventoryData?.data ?? []).map((item: InventoryItem) => {
      const product = item.product;
      // Map category_id to category name
      const categoryObj = categoriesData?.find(
        (c) => c.id === product.category_id,
      );
      return {
        ...product,
        category:
          categoryObj?.name ??
          (typeof product.category === "object"
            ? product.category?.name
            : product.category),
        stock_quantity: item.quantity, // Use unit-specific stock
        total_items: item.total_items, // Total available items
      };
    });
  }, [inventoryData, categoriesData]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const cartTotal = cart.reduce(
    (sum, item) =>
      sum + (item.price ?? item.selling_price ?? 0) * item.quantity,
    0,
  );

  // Handlers
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string | number, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      }),
    );
  };

  const removeFromCart = (id: string | number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // Suspend current order
  const handleSuspendOrder = useCallback(() => {
    if (cart.length === 0) return;

    const newSuspendedOrder: SuspendedOrder = {
      id: `susp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      items: [...cart],
      total: cartTotal,
      suspendedAt: new Date().toISOString(),
      suspendedBy: user?.name,
    };

    setSuspendedOrders((prev) => [...prev, newSuspendedOrder]);
    setCart([]);
    toast.success("Order suspended. You can resume it later.");
  }, [cart, cartTotal, user?.name]);

  // Resume a suspended order
  const handleResumeOrder = useCallback(
    (orderId: string) => {
      const order = suspendedOrders.find((o) => o.id === orderId);
      if (!order) return;

      // If there's currently items in cart, ask to suspend first
      if (cart.length > 0) {
        const confirmSwitch = window.confirm(
          "You have items in your current cart. Do you want to suspend them and resume the selected order?",
        );
        if (confirmSwitch) {
          // Suspend current cart first
          const currentOrderToSuspend: SuspendedOrder = {
            id: `susp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            items: [...cart],
            total: cartTotal,
            suspendedAt: new Date().toISOString(),
            suspendedBy: user?.name,
          };
          setSuspendedOrders((prev) => [
            ...prev.filter((o) => o.id !== orderId),
            currentOrderToSuspend,
          ]);
        } else {
          return;
        }
      } else {
        // Just remove the order being resumed
        setSuspendedOrders((prev) => prev.filter((o) => o.id !== orderId));
      }

      // Restore the order to cart
      setCart(order.items);
      setIsSuspendedPanelOpen(false);
      toast.success("Order resumed. Continue checkout when ready.");
    },
    [cart, cartTotal, suspendedOrders, user?.name],
  );

  // Delete a suspended order
  const handleDeleteSuspendedOrder = useCallback((orderId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this suspended order? This cannot be undone.",
    );
    if (!confirmDelete) return;

    setSuspendedOrders((prev) => prev.filter((o) => o.id !== orderId));
    toast.success("Suspended order deleted.");
  }, []);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setIsPaymentModalOpen(true);
  };

  const handleSelectPaymentMethod = (
    method: "cash" | "transfer" | "pos" | "monnify",
  ) => {
    setPaymentMethod(method);
    setIsPaymentModalOpen(true);
  };

  const processPayment = () => {
    if (!effectiveUnitId) return;

    createSale(
      {
        unit_id: effectiveUnitId,
        payment_method: paymentMethod,
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price ?? item.selling_price ?? 0,
        })),
      },
      {
        onSuccess: (response) => {
          // Handle nested response structure from Monnify
          const responseData = response.data as Sale & {
            sale?: Sale;
            account_details?: VirtualAccountDetails;
          };
          const sale = responseData.sale || responseData;
          const accountDetails = responseData.account_details;

          const isMonnifyPending =
            paymentMethod === "monnify" && accountDetails;

          setCurrentOrder({
            items: [...cart],
            total: cartTotal,
            orderId: (sale?.id || "N/A").toString(),
            invoiceNumber: sale?.invoice_number,
            checkoutUrl: sale?.payment_data?.checkoutUrl,
            accountDetails: accountDetails,
            isPending: !!(paymentMethod === "monnify" && accountDetails),
          });

          // Show appropriate message
          if (isMonnifyPending) {
            toast.info(
              `Virtual account generated. Please transfer ₦${cartTotal.toLocaleString()} to complete.`,
            );
          } else {
            toast.success(
              `Payment of ₦${cartTotal.toLocaleString()} successful!`,
            );
          }

          // Close payment, Open Invoice
          setIsPaymentModalOpen(false);
          setIsInvoiceModalOpen(true);

          // Clear cart
          setCart([]);
        },
        onError: (
          error: Error & { response?: { data?: { message?: string } } },
        ) => {
          toast.error(
            error.response?.data?.message ||
              "Failed to process payment. Please try again.",
          );
        },
      },
    );
  };

  if (!effectiveUnitId) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center p-6">
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8 max-w-md text-center space-y-4">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto dark:bg-amber-900/20 dark:text-amber-400">
            <Store size={32} />
          </div>
          <h2 className="text-2xl font-bold">No Unit Assigned</h2>
          <p className="text-muted-foreground">
            Your account is not currently assigned to any unit or location.
            Please contact your administrator to assign you to a unit to start
            using the POS system.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="animate-spin text-primary" />
        <p className="text-muted-foreground font-medium animate-pulse">
          Loading unit inventory...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-4rem)] gap-6 animate-in fade-in duration-500">
      <PosProductGrid
        products={filteredProducts}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddToCart={addToCart}
        brandsMap={brandsMap}
      />

      <PosCart
        cart={cart}
        cartTotal={cartTotal}
        onUpdateQuantity={updateQuantity}
        onRemoveFromCart={removeFromCart}
        onCheckout={handleCheckout}
        onSelectPaymentMethod={handleSelectPaymentMethod}
        onSuspendOrder={handleSuspendOrder}
        suspendedCount={suspendedOrders.length}
        onViewSuspended={() => setIsSuspendedPanelOpen(true)}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        cartTotal={cartTotal}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        isLoading={isCreatingSale}
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
          invoiceNumber={currentOrder.invoiceNumber}
          checkoutUrl={currentOrder.checkoutUrl}
          accountDetails={currentOrder.accountDetails}
          isPending={currentOrder.isPending}
          onClose={() => setIsInvoiceModalOpen(false)}
        />
      )}

      <SuspendedOrdersPanel
        isOpen={isSuspendedPanelOpen}
        onClose={() => setIsSuspendedPanelOpen(false)}
        suspendedOrders={suspendedOrders}
        onResumeOrder={handleResumeOrder}
        onDeleteOrder={handleDeleteSuspendedOrder}
      />
    </div>
  );
}
