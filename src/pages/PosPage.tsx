import { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Loader2, Store, Search } from "lucide-react";
import api from "../services/api";
import { API_ENDPOINTS } from "../data/endpoints";
import type {
  Product,
  CartItem,
  Brand,
  InventoryItem,
  SuspendedOrder,
} from "../types";
import { useCategories } from "../data/categories";
import { useInventory } from "../data/inventory";
import { useProducts } from "../data/products";
import { useBrands } from "../data/brands";
import { useAuth } from "../context/AuthContext";
import { useUsers } from "../data/staff";
import { PosProductGrid } from "../components/pos/PosProductGrid";
import { PosCart } from "../components/pos/PosCart";
import { PaymentModal } from "../components/pos/PaymentModal";
import { InvoiceModal } from "../components/pos/InvoiceModal";
import { SuspendedOrdersPanel } from "../components/pos/SuspendedOrdersPanel";
import { useCreateSale, useAddItemsToSale, useMarkAsPaid } from "../data/sales";
import type { Sale, VirtualAccountDetails, ApiResponse } from "../types";

const SUSPENDED_ORDERS_KEY = "pos_suspended_orders";

export default function PosPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "transfer" | "pos" | "monnify"
  >("cash");
  const [selectedServerId, setSelectedServerId] = useState<string | number>("");
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState("");
  const [isSearchingInvoice, setIsSearchingInvoice] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<Sale | null>(null);

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
  const { data: inventoryData, isLoading: isInventoryLoading } = useInventory(
    effectiveUnitId || undefined,
  );
  const { data: allProducts = [], isLoading: isProductsLoading } =
    useProducts();
  const isLoading = isInventoryLoading || isProductsLoading;
  const { data: brandsData } = useBrands();
  const { data: userData } = useUsers();
  const { mutate: createSale, isPending: isCreatingSale } = useCreateSale();
  const { isPending: isMarkingPaid } = useMarkAsPaid();
  const { isPending: isAddingItems } = useAddItemsToSale(
    activeInvoice?.invoice_number || "",
  );

  const servers = useMemo(() => {
    return userData?.data?.filter((u) => u.role === "server") || [];
  }, [userData]);

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

  // Products from unit inventory + unit_processed items
  const products = useMemo(() => {
    // 1. Map inventory items (central_stock)
    const inventoryProducts = (inventoryData?.data ?? []).map(
      (item: InventoryItem) => {
        const product = item.product;
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
          stock_quantity: item.quantity,
          total_items: item.total_items,
        };
      },
    );

    // 2. Map unit_processed items from global list (on-demand)
    const processedProducts = allProducts
      .filter((p: Product) => p.source_type === "unit_processed")
      // Avoid duplicates if already in inventory (though unlikely for unit_processed)
      .filter((p: Product) => !inventoryProducts.some((ip) => ip.id === p.id))
      .map((product: Product) => {
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
          // Unit processed items are on-demand, so they don't have stock limits in POS
          stock_quantity: 999,
          total_items: 999,
        };
      });

    return [...inventoryProducts, ...processedProducts];
  }, [inventoryData, allProducts, categoriesData]);

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

  const { mutate: addItems } = useAddItemsToSale(
    activeInvoice?.invoice_number || "",
  );
  const { mutate: markAsPaid } = useMarkAsPaid();

  const handleCreateSale = (
    method?: "cash" | "transfer" | "pos" | "monnify",
    isPayLater = false,
  ) => {
    if (!effectiveUnitId) return;
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    const finalMethod = method || paymentMethod;
    const items = cart.map((item) => ({
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.price ?? item.selling_price ?? 0,
    }));

    if (activeInvoice) {
      addItems(
        { items },
        {
          onSuccess: (response) => {
            if (response.data) {
              const sale = response.data;

              // If it's a "Pay Later" (isPayLater === true), we just refresh and close
              if (isPayLater) {
                setCurrentOrder({
                  items: (sale.sale_items || []).map((si: any) => ({
                    ...si.product,
                    quantity: si.quantity,
                    price: Number(si.unit_price),
                  })),
                  total: Number(sale.total_amount),
                  orderId: String(sale.id),
                  invoiceNumber: sale.invoice_number,
                  checkoutUrl: sale.payment_data?.checkoutUrl,
                  accountDetails: sale.account_details,
                  isPending: true,
                });
                setIsInvoiceModalOpen(true);
                setCart([]);
                setActiveInvoice(null);
                toast.success("Items added to invoice");
              } else {
                // Otherwise, fulfill/mark as paid
                markAsPaid(
                  {
                    invoiceNumber: sale.invoice_number || "",
                    payment_method: finalMethod,
                  },
                  {
                    onSuccess: (markPaidResponse: ApiResponse<Sale>) => {
                      const fulfilledSale = markPaidResponse.data || sale;
                      setCurrentOrder({
                        items: (fulfilledSale.sale_items || []).map(
                          (si: any) => ({
                            ...si.product,
                            quantity: si.quantity,
                            price: Number(si.unit_price),
                          }),
                        ),
                        total: Number(fulfilledSale.total_amount),
                        orderId: String(fulfilledSale.id),
                        invoiceNumber: fulfilledSale.invoice_number,
                        checkoutUrl: fulfilledSale.payment_data?.checkoutUrl,
                        accountDetails: fulfilledSale.account_details,
                        isPending: false,
                      });
                      setIsInvoiceModalOpen(true);
                      setCart([]);
                      setActiveInvoice(null);
                      toast.success("Invoice fulfilled and marked as paid");
                    },
                  },
                );
              }
            }
          },
          onError: (error: any) => {
            toast.error(
              error.response?.data?.message || "Failed to add items to invoice",
            );
          },
        },
      );
      return;
    }

    createSale(
      {
        unit_id: effectiveUnitId,
        payment_method: finalMethod,
        server_id: selectedServerId || undefined,
        payment_status: isPayLater ? "pending" : "paid",
        items,
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

          const isMonnifyPending = finalMethod === "monnify" && accountDetails;

          setCurrentOrder({
            items: [...cart],
            total: cartTotal,
            orderId: (sale?.id || "N/A").toString(),
            invoiceNumber: sale?.invoice_number,
            checkoutUrl: sale?.payment_data?.checkoutUrl,
            accountDetails: accountDetails,
            isPending:
              !!(finalMethod === "monnify" && accountDetails) || isPayLater,
          });

          // Show appropriate message
          if (isPayLater) {
            toast.success("Invoice generated for later payment.");
          } else if (isMonnifyPending) {
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
              "Failed to process sale. Please try again.",
          );
        },
      },
    );
  };

  const handleInvoiceSearch = async () => {
    if (!invoiceSearchQuery.trim()) {
      toast.error("Please enter an invoice number");
      return;
    }

    setIsSearchingInvoice(true);
    try {
      const response = await api.get<ApiResponse<Sale>>(
        `${API_ENDPOINTS.SALES}/${invoiceSearchQuery}`,
      );

      if (response.data?.data) {
        const sale = response.data.data;
        if (sale) {
          const items: CartItem[] = (sale.sale_items || []).map((si: any) => ({
            ...si.product,
            quantity: si.quantity,
            price: Number(si.unit_price),
            selling_price: Number(si.unit_price),
          }));

          setCurrentOrder({
            items,
            total: Number(sale.total_amount),
            orderId: String(sale.id),
            invoiceNumber: sale.invoice_number,
            checkoutUrl: sale.payment_data?.checkoutUrl,
            accountDetails: sale.account_details,
            isPending:
              sale.payment_status === "pending" || sale.status === "pending",
          });

          // If pending, load for editing. Otherwise show receipt.
          if (sale.payment_status === "pending" || sale.status === "pending") {
            setCart(items);
            setActiveInvoice(sale);
            setIsInvoiceModalOpen(false);
            toast.success(`Invoice #${sale.invoice_number} loaded for editing`);
          } else {
            setIsInvoiceModalOpen(true);
            toast.success("Invoice found - displaying receipt");
          }
        } else {
          toast.error("Invoice found but no sale details available");
        }
      } else {
        toast.error("Invoice not found or invalid");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Failed to find invoice. Please check the number.",
      );
    } finally {
      setIsSearchingInvoice(false);
    }
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
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header with Search and Product Grid */}
        <div className="bg-card rounded-xl border border-border shadow-sm mb-6 overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/5 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <Store size={20} className="text-primary" />
              <h2 className="font-bold text-lg">Point of Sale</h2>
            </div>

            <div className="flex w-full md:w-auto items-center gap-2">
              <div className="relative flex-1 md:w-64">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Find Invoice #..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-input focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
                  value={invoiceSearchQuery}
                  onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInvoiceSearch()}
                />
              </div>
              <button
                onClick={handleInvoiceSearch}
                disabled={isSearchingInvoice}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium border border-border disabled:opacity-50 flex items-center gap-2"
              >
                {isSearchingInvoice ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Search size={14} />
                )}
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
          </div>
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
        </div>
      </div>

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
        serverId={selectedServerId}
        onServerIdChange={setSelectedServerId}
        servers={servers}
        activeInvoice={activeInvoice}
        onCancelEdit={() => setActiveInvoice(null)}
        onPayLater={() => handleCreateSale("cash", true)}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        cartTotal={cartTotal}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        isLoading={isCreatingSale || isAddingItems || isMarkingPaid}
        onProcessPayment={() => handleCreateSale()}
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
