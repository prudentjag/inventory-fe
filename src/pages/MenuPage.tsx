import { useState } from "react";
import { PublicMenu } from "../components/public/PublicMenu";
import { useMenu } from "../data/menu";
import { Loader2 } from "lucide-react";
import type { Product, CartItem } from "../types";
import { toast } from "sonner";

export default function MenuPage() {
  const unitId = 1; // Default unit
  const { data, isLoading } = useMenu(unitId);
  const products = data?.menu || [];
  const categories = Array.from(new Set(products.map((p) => p.category))).map(
    (name) => ({ id: name, name }),
  );

  const [cart, setCart] = useState<CartItem[]>([]);

  const handleAddToCart = (product: Product | any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          ...product,
          quantity: 1,
          price: product.price || product.selling_price,
        },
      ];
    });
    toast.success(`Added ${product.name} to bag`);
  };

  const handleUpdateQuantity = (id: string | number, delta: number) => {
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

  const handleRemoveItem = (id: string | number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => setCart([]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-amber-500" size={40} />
        <p className="text-white/40 font-medium">
          Loading delicious options...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      <PublicMenu
        products={products as any}
        categories={categories as any}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onAddToCart={handleAddToCart}
        onClearCart={handleClearCart}
      />
    </div>
  );
}
