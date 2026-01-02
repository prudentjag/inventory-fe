import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Loader2, Store } from "lucide-react";
import type { Product, CartItem, Brand, InventoryItem } from "../types";
import { useCategories } from "../data/categories";
import { useInventory } from "../data/inventory";
import { useBrands } from "../data/brands";
import { useAuth } from "../context/AuthContext";
import { PosProductGrid } from "../components/pos/PosProductGrid";
import { PosCart } from "../components/pos/PosCart";
import { PaymentModal } from "../components/pos/PaymentModal";
import { InvoiceModal } from "../components/pos/InvoiceModal";
import { useCreateSale } from "../data/sales";
import type { ApiResponse, Sale, VirtualAccountDetails } from "../types";

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

  const { user } = useAuth();
  const effectiveUnitId = user?.assigned_unit_id || user?.units?.[0]?.id;

  // API Data
  const { data: categoriesData } = useCategories();
  const { data: inventoryData, isLoading } = useInventory(
    effectiveUnitId || undefined
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
        (c) => c.id === product.category_id
      );
      return {
        ...product,
        category:
          categoryObj?.name ??
          (typeof product.category === "object"
            ? product.category?.name
            : product.category),
        stock_quantity: item.quantity, // Use unit-specific stock
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

  const updateQuantity = (id: string | number, delta: number) => {
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

  const removeFromCart = (id: string | number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setIsPaymentModalOpen(true);
  };

  const handleSelectPaymentMethod = (
    method: "cash" | "transfer" | "pos" | "monnify"
  ) => {
    setPaymentMethod(method);
    setIsPaymentModalOpen(true);
  };

  const processPayment = () => {
    if (!effectiveUnitId) return;

    createSale(
      {
        unit_id: effectiveUnitId,
        payment_method: paymentMethod as any,
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price ?? item.selling_price ?? 0,
        })),
      },
      {
        onSuccess: (response: ApiResponse<Sale> | any) => {
          // Handle nested response structure from Monnify
          const sale = response.data?.sale || response.data;
          const accountDetails = response.data?.account_details;

          const isMonnifyPending =
            paymentMethod === "monnify" && accountDetails;

          const orderData = {
            items: [...cart],
            total: cartTotal,
            orderId: (sale?.id || "N/A").toString(),
            invoiceNumber: sale?.invoice_number,
            checkoutUrl: sale?.payment_data?.checkoutUrl,
            accountDetails: accountDetails,
            isPending: isMonnifyPending,
          };

          // Save order data for invoice
          setCurrentOrder(orderData);

          // Show appropriate message
          if (isMonnifyPending) {
            toast.info(
              `Virtual account generated. Please transfer ₦${cartTotal.toLocaleString()} to complete.`
            );
          } else {
            toast.success(
              `Payment of ₦${cartTotal.toLocaleString()} successful!`
            );
          }

          // Close payment, Open Invoice
          setIsPaymentModalOpen(false);
          setIsInvoiceModalOpen(true);

          // Clear cart
          setCart([]);
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message ||
              "Failed to process payment. Please try again."
          );
        },
      }
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
    </div>
  );
}
