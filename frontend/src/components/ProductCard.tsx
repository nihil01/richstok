import {motion} from "framer-motion";
import {Gauge, PackageCheck, ShieldCheck, ShoppingCart} from "lucide-react";
import type {Product} from "@/types/product";
import type {Language} from "@/types/ui";

type ProductCardProps = {
  product: Product;
  index?: number;
  language: Language;
};

const cardCopy: Record<Language, {defaultDescription: string; verified: string; stock: string; addToCart: string}> = {
  az: {
    defaultDescription: "Avtomobilin sabit və təhlükəsiz işi üçün premium detal.",
    verified: "Yoxlanılıb",
    stock: "Mövcud:",
    addToCart: "Səbətə at"
  },
  en: {
    defaultDescription: "Premium component for stable and safe vehicle performance.",
    verified: "Verified",
    stock: "Stock:",
    addToCart: "Add to cart"
  },
  ru: {
    defaultDescription: "Премиальная деталь для стабильной и безопасной работы авто.",
    verified: "Проверено",
    stock: "Наличие:",
    addToCart: "В корзину"
  }
};

export default function ProductCard({product, index = 0, language}: ProductCardProps) {
  const stockProgress = Math.min(100, Math.round((product.stockQuantity / 120) * 100));
  const copy = cardCopy[language];

  return (
    <motion.article
      initial={{opacity: 0, y: 20}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true, amount: 0.2}}
      transition={{duration: 0.45, delay: index * 0.07}}
      whileHover={{y: -6}}
      className="product-card-surface relative overflow-hidden rounded-xl border border-brand-500/20 shadow-card"
    >
      <div className="relative p-5 sm:p-6">
        <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-brand-500/18 blur-2xl" />
        <div className="relative mb-4 flex items-center justify-between gap-2">
          <h3 className="theme-heading line-clamp-1 text-xl font-semibold">{product.name}</h3>
          <span className="rounded-md border border-brand-400/30 bg-brand-500/12 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-brand-100">
            {product.brand || "OEM"}
          </span>
        </div>

        <p className="theme-text min-h-12 text-sm">{product.description || copy.defaultDescription}</p>

        <div className="theme-text mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="badge-surface inline-flex items-center gap-1.5 rounded-md px-2 py-1.5">
            <Gauge className="h-3.5 w-3.5 text-brand-200" />
            SKU: {product.slug}
          </span>
          <span className="badge-surface inline-flex items-center gap-1.5 rounded-md px-2 py-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-300" />
            {copy.verified}
          </span>
        </div>

        <div className="mt-4">
          <div className="theme-muted mb-1 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1">
              <PackageCheck className="h-3.5 w-3.5 text-brand-200" />
              {copy.stock} {product.stockQuantity}
            </span>
            <span>{stockProgress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{width: 0}}
              whileInView={{width: `${stockProgress}%`}}
              viewport={{once: true}}
              transition={{duration: 0.8, delay: 0.12 + index * 0.04}}
              className="h-full rounded-full bg-gradient-to-r from-brand-400 to-pulse-500"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <strong className="text-2xl font-semibold text-brand-200">${product.price.toFixed(2)}</strong>
          <motion.button
            whileTap={{scale: 0.97}}
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-600 to-pulse-500 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <ShoppingCart className="h-4 w-4" />
            {copy.addToCart}
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
