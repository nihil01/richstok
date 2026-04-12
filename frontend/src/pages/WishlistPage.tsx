import ProductCard from "@/components/ProductCard";
import {useWishlist} from "@/context/WishlistContext";
import type {Product} from "@/types/product";
import type {DisplayCurrency} from "@/types/currency";
import type {Language} from "@/types/ui";
import {motion} from "framer-motion";
import {Heart, Trash2} from "lucide-react";
import {useNavigate} from "react-router-dom";

type WishlistPageProps = {
  language: Language;
  displayCurrency: DisplayCurrency;
  currencyRates: Record<string, number>;
  onAddToCart: (product: Product) => void;
};

const copy: Record<
  Language,
  {
    title: string;
    subtitle: string;
    empty: string;
    clear: string;
  }
> = {
  az: {
    title: "Seçilmişlər",
    subtitle: "Bəyəndiyin məhsulları burada saxla.",
    empty: "Seçilmişlər siyahısı boşdur.",
    clear: "Hamısını təmizlə"
  },
  en: {
    title: "Wishlist",
    subtitle: "Save parts you plan to buy later.",
    empty: "Your wishlist is empty.",
    clear: "Clear all"
  },
  ru: {
    title: "Избранное",
    subtitle: "Здесь хранятся товары, которые ты отметил.",
    empty: "Список избранного пуст.",
    clear: "Очистить всё"
  }
};

export default function WishlistPage({language, displayCurrency, currencyRates, onAddToCart}: WishlistPageProps) {
  const navigate = useNavigate();
  const ui = copy[language];
  const {items, clearWishlist} = useWishlist();

  return (
    <motion.section
      key="wishlist-page"
      initial={{opacity: 0, y: 12}}
      animate={{opacity: 1, y: 0}}
      exit={{opacity: 0, y: -8}}
      transition={{duration: 0.3}}
      className="space-y-5"
    >
      <header className="glass-card rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="theme-heading text-2xl font-semibold">{ui.title}</h1>
            <p className="theme-text mt-2 text-sm">{ui.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => clearWishlist()}
            className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-xs theme-text transition hover:border-brand-300"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {ui.clear}
          </button>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="glass-card rounded-xl p-5">
          <p className="theme-text inline-flex items-center gap-2 text-sm">
            <Heart className="h-4 w-4 text-brand-300" />
            {ui.empty}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {items.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              language={language}
              displayCurrency={displayCurrency}
              currencyRates={currencyRates}
              onOpen={(productId) => navigate(`/products/${productId}`)}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      )}
    </motion.section>
  );
}
