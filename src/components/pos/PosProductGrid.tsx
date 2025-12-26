import { Search, Plus } from "lucide-react";
import type { Product, Brand } from "../../types";
import { cn } from "../../lib/utils";

interface PosProductGridProps {
  products: Product[];
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddToCart: (product: Product) => void;
  brandsMap?: Map<number, Brand>;
}

export function PosProductGrid({
  products,
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onAddToCart,
  brandsMap,
}: PosProductGridProps) {
  // Helper to get brand image for a product
  const getBrandImage = (product: Product): string | null | undefined => {
    if (!brandsMap || !product.brand_id) return null;
    return brandsMap.get(product.brand_id)?.image;
  };
  return (
    <div className="flex-1 flex flex-col bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      {/* Search & Filter Header */}
      <div className="p-4 border-b border-border space-y-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <input
            type="text"
            placeholder="Search products by name or SKU..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-secondary/50 border border-input focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-input hover:border-primary/50 hover:text-foreground"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
        {products.map((product) => (
          <button
            key={product.id}
            onClick={() => onAddToCart(product)}
            className="flex flex-col text-left bg-background border border-border rounded-lg p-3 hover:border-primary/50 hover:shadow-md transition-all group h-fit"
          >
            <div className="aspect-square bg-secondary/50 rounded-md mb-3 flex items-center justify-center text-muted-foreground overflow-hidden relative">
              {(() => {
                const brandImage = getBrandImage(product);
                if (brandImage) {
                  return (
                    <img
                      src={brandImage}
                      alt={product.brand || product.name}
                      className="w-full h-full object-contain p-2"
                    />
                  );
                }
                if (product.image_url) {
                  return (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  );
                }
                return (
                  <span className="text-xs font-medium">{product.sku}</span>
                );
              })()}
              <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Plus
                  className="text-primary bg-background rounded-full p-1 shadow-sm"
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
            <div className="flex items-center justify-between mt-1">
              <span className="text-muted-foreground text-xs">
                {product.brand}
              </span>
              <span className="font-bold text-primary text-sm">
                ₦{product.price.toLocaleString()}
              </span>
            </div>
          </button>
        ))}
        {products.length === 0 && (
          <div className="col-span-full h-40 flex flex-col items-center justify-center text-muted-foreground">
            <Search size={32} className="mb-2 opacity-50" />
            <p>No products found</p>
          </div>
        )}
      </div>
    </div>
  );
}
