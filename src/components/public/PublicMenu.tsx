import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Utensils,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Copy,
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { Product, CartItem } from "../../types";
import { toast } from "sonner";
import { usePlaceGuestOrder } from "../../data/menu";

interface PublicMenuProps {
  products: any[];
  categories: any[];
  cart: CartItem[];
  onUpdateQuantity: (id: string | number, delta: number) => void;
  onRemoveItem: (id: string | number) => void;
  onAddToCart: (product: any) => void;
  onClearCart: () => void;
  initialTableNumber?: string;
}

export function PublicMenu({
  products,
  categories,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onAddToCart,
  onClearCart,
  initialTableNumber = "",
}: PublicMenuProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState<string>(initialTableNumber);

  // Sync initialTableNumber if it changes (e.g. from URL)
  useEffect(() => {
    if (initialTableNumber) {
      setTableNumber(initialTableNumber);
    }
  }, [initialTableNumber]);
  const [orderSuccess, setOrderSuccess] = useState<{
    invoice_number: string;
  } | null>(null);

  const { mutate: placeOrder, isPending: isProcessing } = usePlaceGuestOrder();

  const cartTotal = cart.reduce(
    (sum, item) =>
      sum + (item.price ?? item.selling_price ?? 0) * item.quantity,
    0,
  );

  const displayCategories = ["All", ...categories.map((c: any) => c.name)];

  const filteredProducts = useMemo(() => {
    return products.filter((p: any) => {
      const matchesSearch = p.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" ||
        (typeof p.category === "object"
          ? p.category?.name === selectedCategory
          : p.category === selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [products, selectedCategory, searchQuery]);

  const handlePlaceOrder = () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (!customerName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!tableNumber) {
      toast.error("Please select a table");
      return;
    }

    placeOrder(
      {
        unit_id: 1,
        customer_name: `${customerName} (Table ${tableNumber})`,
        items: cart.map((item) => ({
          product_id: Number(item.id),
          quantity: item.quantity,
        })),
      },
      {
        onSuccess: (data) => {
          toast.success("Order placed successfully!");
          setOrderSuccess(data);
          onClearCart();
          setCustomerName("");
          setTableNumber("");
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || "Failed to place order");
        },
      },
    );
  };

  if (orderSuccess) {
    return (
      <div className="flex h-screen bg-[#0A0A0A] items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#121212] rounded-[40px] p-10 border border-white/5 text-center shadow-2xl animate-in zoom-in duration-500">
          <div className="w-20 h-20 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter">
            Order Placed!
          </h2>
          <p className="text-white/40 mb-8 leading-relaxed">
            Your order is being prepared. Please show this invoice number to the
            staff when paying.
          </p>

          <div className="bg-black/40 rounded-3xl p-6 border border-white/5 mb-8 relative group">
            <span className="text-[10px] font-black uppercase text-white/20 tracking-widest block mb-2">
              Invoice Number
            </span>
            <span className="text-2xl font-black text-blue-500 tracking-wider uppercase">
              {orderSuccess.invoice_number}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(orderSuccess.invoice_number);
                toast.success("Invoice number copied!");
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-white/5 text-white/40 hover:text-white transition-all opacity-0 group-hover:opacity-100"
            >
              <Copy size={18} />
            </button>
          </div>

          <button
            onClick={() => setOrderSuccess(null)}
            className="w-full bg-white text-black font-black py-5 rounded-[28px] uppercase tracking-widest text-sm hover:bg-white/90 transition-all active:scale-95"
          >
            Order More
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-[#E0E0E0] overflow-hidden">
      {/* Left Column: Product Selection */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-white/5 bg-[#121212]">
        {/* Header */}
        <header className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500 overflow-hidden flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="font-black text-white italic text-2xl">NB</span>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter">Naveda</h1>
              <div className="flex items-center gap-2 text-white uppercase font-black text-[9px] tracking-[0.2em] mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                Live Ordering
              </div>
            </div>
          </div>
          <div className="relative w-72">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
              size={18}
            />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
          </div>
        </header>

        {/* Categories */}
        <div className="p-6 pb-2 overflow-x-auto flex gap-2 no-scrollbar bg-black/5">
          {displayCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-6 py-3 rounded-2xl whitespace-nowrap text-xs font-black uppercase tracking-widest transition-all",
                selectedCategory === cat
                  ? "bg-white text-black shadow-2xl scale-105"
                  : "bg-white/5 text-white/40 hover:text-white border border-white/5",
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <main className="flex-1 p-6 overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 xxl:grid-cols-5 gap-4">
            {filteredProducts.map((product: Product) => (
              <button
                key={product.id}
                onClick={() => onAddToCart(product)}
                className="group relative flex flex-col bg-[#1E1E1E] rounded-3xl p-3 border border-white/5 hover:border-blue-500/50 transition-all hover:scale-[1.02] active:scale-95 text-left"
              >
                <div className="aspect-square w-full rounded-2xl bg-[#2A2A2A] overflow-hidden mb-3 border border-white/5">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/5 font-black text-3xl italic">
                      {product.name.charAt(0)}
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-[13px] leading-tight mb-1 group-hover:text-blue-500 transition-colors line-clamp-1 uppercase">
                  {product.name}
                </h3>
                <span className="font-black text-sm text-white/50">
                  ₦
                  {(
                    product.price ||
                    product.selling_price ||
                    0
                  ).toLocaleString()}
                </span>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-black flex items-center justify-center shadow-2xl">
                    <Plus size={18} />
                  </div>
                </div>
              </button>
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-white/5">
              <Utensils size={80} className="mb-4 opacity-10" />
              <p className="text-lg font-bold">No items found</p>
            </div>
          )}
        </main>
      </div>

      {/* Right Column: Order Summary */}
      <div className="w-[400px] flex-shrink-0 flex flex-col bg-black/40 shadow-2xl z-10">
        <div className="p-8 pb-4 border-b border-white/5">
          <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
            Current Order
            {cart.length > 0 && (
              <span className="px-3 py-1 bg-blue-500 text-black text-[10px] rounded-full font-black">
                {cart.length} ITEMS
              </span>
            )}
          </h2>
        </div>

        {/* Order Items */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white/10 text-center px-6">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center mb-4">
                <Plus size={32} />
              </div>
              <p className="font-bold text-sm uppercase tracking-widest">
                Select items to start your order
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="bg-[#121212] rounded-2xl p-4 border border-white/5 flex gap-4 animate-in fade-in slide-in-from-right-4 duration-300"
              >
                <div className="flex-1">
                  <h4 className="font-bold text-xs uppercase tracking-tight mb-2">
                    {item.name}
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-black/50 p-1 rounded-xl border border-white/5">
                      <button
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 text-white/40"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-black text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 text-blue-500"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="text-xs font-black text-white/30">
                      x ₦
                      {(item.price || item.selling_price || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-1 px-2 rounded-lg hover:bg-red-500/10 text-white/10 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                  <span className="font-black text-sm">
                    ₦
                    {(
                      (item.price || item.selling_price || 0) * item.quantity
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Form */}
        <div className="p-8 pt-4 bg-[#121212] border-t border-white/5 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] ml-1">
                Table
              </label>
              <select
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full bg-black border border-white/5 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all appearance-none text-white cursor-pointer"
              >
                <option value="" disabled className="text-white/20">
                  Select
                </option>
                {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num} className="bg-[#121212] py-2">
                    Table {num}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] ml-1">
                Name
              </label>
              <input
                type="text"
                placeholder="Required"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-black border border-white/5 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-white/10"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-end border-t border-white/5 pt-4">
              <span className="text-xs font-bold uppercase tracking-widest text-white/40">
                Total
              </span>
              <span className="text-4xl font-black tracking-tighter text-white">
                ₦{cartTotal.toLocaleString()}
              </span>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={isProcessing || cart.length === 0}
              className="w-full bg-blue-500 text-black font-black py-5 rounded-[28px] uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-blue-400 disabled:opacity-30 disabled:grayscale transition-all shadow-2xl shadow-blue-500/20 active:scale-95 mt-4"
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Place Order
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
