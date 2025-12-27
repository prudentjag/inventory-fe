import { useState, useMemo } from "react";
import { toast } from "sonner";
import type { Product, CartItem, Brand } from "../types";
import { useCategories } from "../data/categories";
import { useProducts } from "../data/products";
import { useBrands } from "../data/brands";
import { PosProductGrid } from "../components/pos/PosProductGrid";
import { PosCart } from "../components/pos/PosCart";
import { PaymentModal } from "../components/pos/PaymentModal";
import { InvoiceModal } from "../components/pos/InvoiceModal";

export default function PosPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "transfer" | "pos"
  >("cash");

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<{
    items: CartItem[];
    total: number;
    orderId: string;
  } | null>(null);

  // API Data
  const { data: categoriesData } = useCategories();
  const { data: productsData } = useProducts();
  const { data: brandsData } = useBrands();

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

  // Products from API, with mapped category names
  const products = useMemo(() => {
    return (productsData ?? []).map((product) => {
      // Map category_id to category name
      const categoryObj = categoriesData?.find(
        (c) => c.id === product.category_id
      );
      return {
        ...product,
        category: categoryObj?.name ?? product.category,
      };
    });
  }, [productsData, categoriesData]);

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

  const handleSelectPaymentMethod = (method: "cash" | "transfer" | "pos") => {
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
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-4rem)] gap-6">
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
