import { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Loader2, Store, Factory } from "lucide-react";
import type { Product, CartItem, Brand, SuspendedOrder } from "../types";
import { useCategories } from "../data/categories";
import { useUnitProducedProducts } from "../data/products";
import { useBrands } from "../data/brands";
import { useAuth } from "../context/AuthContext";
import { PosCart } from "../components/pos/PosCart";
import { PaymentModal } from "../components/pos/PaymentModal";
import { InvoiceModal } from "../components/pos/InvoiceModal";
import { SuspendedOrdersPanel } from "../components/pos/SuspendedOrdersPanel";
import { useCreateSale, useAddItemsToSale, useMarkAsPaid } from "../data/sales";
import { useUsers } from "../data/staff";
import api from "../services/api";
import { API_ENDPOINTS } from "../data/endpoints";
import type { Sale, VirtualAccountDetails, ApiResponse } from "../types";
import { cn } from "../lib/utils";
import { Search, Plus } from "lucide-react";

const SUSPENDED_ORDERS_KEY = "unit_pos_suspended_orders";

export default function UnitPosPage() {
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

  // API Data - Use unit-produced products instead of inventory
  const { data: categoriesData } = useCategories();
  const { data: products = [], isLoading } = useUnitProducedProducts();
  const { data: brandsData } = useBrands();
  const { data: userData } = useUsers();
  const { mutate: createSale, isPending: isCreatingSale } = useCreateSale();
  const { mutate: addItems, isPending: isAddingItems } = useAddItemsToSale(
    activeInvoice?.invoice_number || "",
  );
  const { mutate: markAsPaid, isPending: isMarkingPaid } = useMarkAsPaid();

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

  // Products with mapped category names (no stock tracking needed)
  const productsWithCategories = useMemo(() => {
    return products.map((product: Product) => {
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
      };
    });
  }, [products, categoriesData]);

  const filteredProducts = useMemo(() => {
    return productsWithCategories.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [productsWithCategories, searchQuery, selectedCategory]);

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

      if (cart.length > 0) {
        const confirmSwitch = window.confirm(
          "You have items in your current cart. Do you want to suspend them and resume the selected order?",
        );
        if (confirmSwitch) {
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
        setSuspendedOrders((prev) => prev.filter((o) => o.id !== orderId));
      }

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

          setIsPaymentModalOpen(false);
          setIsInvoiceModalOpen(true);
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

  // Helper to get brand image for a product
  const getBrandImage = (product: Product): string | null | undefined => {
    if (!brandsMap || !product.brand_id) return null;
    return brandsMap.get(product.brand_id)?.image;
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
            using the Unit POS system.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="animate-spin text-green-600" />
        <p className="text-muted-foreground font-medium animate-pulse">
          Loading unit products...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-4rem)] gap-6 animate-in fade-in duration-500">
      {/* Product Grid - Custom for Unit Products */}
      <div className="flex-1 flex flex-col bg-card rounded-xl border border-green-200 dark:border-green-800 shadow-sm overflow-hidden">
        {/* Header with green branding */}
        <div className="p-4 border-b border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <Factory size={20} />
              <h2 className="font-semibold">Unit Products POS</h2>
              <span className="text-xs bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded-full">
                🏭 Made On-Site
              </span>
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
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-input focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none text-sm transition-all"
                  value={invoiceSearchQuery}
                  onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInvoiceSearch()}
                />
              </div>
              <button
                onClick={handleInvoiceSearch}
                disabled={isSearchingInvoice}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium border border-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isSearchingInvoice ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Search size={14} />
                )}
                <span className="hidden sm:inline">Search Invoice</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <input
              type="text"
              placeholder="Search unit products by name or SKU..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background border border-input focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
                  selectedCategory === cat
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-background text-muted-foreground border-input hover:border-green-500/50 hover:text-foreground",
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="flex flex-col text-left bg-background border border-border rounded-lg p-3 hover:border-green-500/50 hover:shadow-md transition-all group h-fit"
            >
              <div className="aspect-square bg-secondary/50 rounded-md mb-3 flex items-center justify-center text-muted-foreground overflow-hidden relative">
                {(() => {
                  const brandImage = getBrandImage(product);
                  const brandName =
                    typeof product.brand === "object"
                      ? product.brand?.name
                      : product.brand;
                  const brandImageUrl =
                    typeof product.brand === "object"
                      ? product.brand?.image_url
                      : null;
                  if (brandImage) {
                    return (
                      <img
                        src={brandImage}
                        alt={brandName || product.name}
                        className="w-full h-full object-contain p-2"
                      />
                    );
                  }
                  if (brandImageUrl) {
                    return (
                      <img
                        src={brandImageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    );
                  }
                  return (
                    <span className="text-xs font-medium">{product.sku}</span>
                  );
                })()}
                <div className="absolute inset-0 bg-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Plus
                    className="text-green-600 bg-background rounded-full p-1 shadow-sm"
                    size={32}
                  />
                </div>
              </div>
              <h3
                className="font-semibold text-sm truncate w-full"
                title={product.name}
              >
                {product.name}
              </h3>
              {/* Unit Produced Badge - No stock tracking */}
              <div className="mt-1">
                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  🏭 Unit Produced
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-muted-foreground text-xs">
                  {typeof product.brand === "object"
                    ? product.brand?.name
                    : product.brand}
                </span>
                <span className="font-bold text-green-600 text-sm">
                  ₦
                  {(
                    product?.price ??
                    product?.selling_price ??
                    0
                  ).toLocaleString()}
                </span>
              </div>
            </button>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full h-40 flex flex-col items-center justify-center text-muted-foreground">
              <Factory size={32} className="mb-2 opacity-50" />
              <p>No unit products found</p>
              <p className="text-xs mt-1">
                Add products with "Unit Produced" source type
              </p>
            </div>
          )}
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
