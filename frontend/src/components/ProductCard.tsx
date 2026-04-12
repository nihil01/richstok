import {AnimatePresence, motion} from "framer-motion";
import {Gauge, ImageOff, PackageCheck, ShieldCheck, ShoppingCart} from "lucide-react";
import type {DisplayCurrency} from "@/types/currency";
import type {Product} from "@/types/product";
import type {Language} from "@/types/ui";
import {formatConvertedPrice} from "@/utils/currency";
import {useState} from "react";

type ProductCardProps = {
  product: Product;
  index?: number;
  language: Language;
  displayCurrency: DisplayCurrency;
  currencyRates: Record<string, number>;
  onOpen?: (productId: number) => void;
  onAddToCart?: (product: Product) => void;
};

const cardCopy: Record<
  Language,
  {
    defaultDescription: string;
    verified: string;
    stock: string;
    addToCart: string;
    outOfStockAction: string;
    clarifyAction: string;
    baku: string;
    ganja: string;
    delivery: string;
    days: string;
    stockUnknownHint: string;
    unknownCount: string;
  }
> = {
  az: {
    defaultDescription: "Avtomobilin sabit və təhlükəsiz işi üçün premium detal.",
    verified: "Yoxlanılıb",
    stock: "Mövcud:",
    addToCart: "Səbətə at",
    outOfStockAction: "Yoxdur",
    clarifyAction: "Dəqiqləşdir",
    baku: "Bakı",
    ganja: "Gəncə",
    delivery: "Çatdırılma",
    days: "gün",
    stockUnknownHint: "Dəqiq say məlum deyil. Dəqiq stok üçün dəstək xidməti ilə əlaqə saxla.",
    unknownCount: "dəqiqləşdir"
  },
  en: {
    defaultDescription: "Premium component for stable and safe vehicle performance.",
    verified: "Verified",
    stock: "Stock:",
    addToCart: "Add to cart",
    outOfStockAction: "Out of stock",
    clarifyAction: "Clarify",
    baku: "Baku",
    ganja: "Ganja",
    delivery: "Delivery",
    days: "days",
    stockUnknownHint: "Exact quantity is unknown. Please contact support to confirm stock.",
    unknownCount: "check"
  },
  ru: {
    defaultDescription: "Премиальная деталь для стабильной и безопасной работы авто.",
    verified: "Проверено",
    stock: "Наличие:",
    addToCart: "В корзину",
    outOfStockAction: "Нет в наличии",
    clarifyAction: "Уточнить",
    baku: "Баку",
    ganja: "Гянджа",
    delivery: "Доставка",
    days: "дн.",
    stockUnknownHint: "Точное количество неизвестно. Уточните наличие в службе поддержки.",
    unknownCount: "уточнить"
  }
};

export default function ProductCard({product, index = 0, language, displayCurrency, currencyRates, onOpen, onAddToCart}: ProductCardProps) {
  const stockProgress = Math.min(100, Math.round((product.stockQuantity / 120) * 100));
  const copy = cardCopy[language];
  const [addedPulse, setAddedPulse] = useState(false);
  const hasUnknownStock = product.bakuCountUnknown || product.ganjaCountUnknown;
  const outOfStock = product.stockQuantity <= 0;
  const addDisabled = hasUnknownStock || outOfStock;
  const addButtonLabel = hasUnknownStock
    ? copy.clarifyAction
    : outOfStock
      ? copy.outOfStockAction
      : copy.addToCart;
  const bakuLabel = product.bakuCountUnknown ? copy.unknownCount : String(product.bakuCount ?? 0);
  const ganjaLabel = product.ganjaCountUnknown ? copy.unknownCount : String(product.ganjaCount ?? 0);

  return (
    <motion.article
      initial={{opacity: 0, y: 20}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true, amount: 0.2}}
      transition={{duration: 0.45, delay: index * 0.07}}
      whileHover={{y: -6}}
      onClick={() => onOpen?.(product.id)}
      className={`product-card-surface relative overflow-hidden rounded-xl border border-brand-500/20 shadow-card ${onOpen ? "cursor-pointer" : ""}`}
    >
      <div className="relative p-5 sm:p-6">
        <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-brand-500/18 blur-2xl" />
        <div className="relative mb-4 h-40 overflow-hidden rounded-xl border border-brand-500/20 bg-black/30">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-contain p-3" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-brand-300/60">
              <ImageOff className="h-8 w-8" />
            </div>
          )}
        </div>
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
            Brand code: {product.sku}
          </span>

          <span className="badge-surface inline-flex items-center gap-1.5 rounded-md px-2 py-1.5">
            <Gauge className="h-3.5 w-3.5 text-brand-200" />
            OEM: {product.oemNumber}
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
          <p className="theme-muted mt-2 text-xs">
            {copy.baku}: {bakuLabel} · {copy.ganja}: {ganjaLabel}
          </p>
          {hasUnknownStock && (
            <p className="mt-2 rounded-md border border-amber-500/35 bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-100">
              {copy.stockUnknownHint}
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <strong className="text-2xl font-semibold text-brand-200">
            {formatConvertedPrice(product.price, displayCurrency, currencyRates, language)}
          </strong>
          <motion.button
            animate={!addDisabled && addedPulse
              ? {
                scale: [1, 1.06, 1],
                boxShadow: [
                  "0 0 0 rgba(239,68,68,0)",
                  "0 0 34px rgba(239,68,68,0.52)",
                  "0 0 0 rgba(239,68,68,0)"
                ]
              }
              : {
                scale: 1,
                boxShadow: "0 0 0 rgba(239,68,68,0)"
              }}
            transition={{duration: 0.48, ease: "easeOut"}}
            whileTap={addDisabled ? undefined : {scale: 0.97}}
            type="button"
            disabled={addDisabled}
            onClick={(event) => {
              event.stopPropagation();
              if (addDisabled) {
                return;
              }
              onAddToCart?.(product);
              setAddedPulse(true);
              window.setTimeout(() => setAddedPulse(false), 520);
            }}
            className={`relative inline-flex items-center gap-2 overflow-hidden rounded-lg px-4 py-2.5 text-sm font-medium ${
              addDisabled
                ? "cursor-not-allowed border border-white/15 bg-white/8 text-white/55"
                : "bg-gradient-to-r from-brand-600 to-pulse-500 text-white transition-opacity hover:opacity-90"
            }`}
          >
            <AnimatePresence>
              {!addDisabled && addedPulse && (
                <motion.span
                  initial={{x: "-120%", opacity: 0.25}}
                  animate={{x: "130%", opacity: 0.5}}
                  exit={{opacity: 0}}
                  transition={{duration: 0.44, ease: "easeOut"}}
                  className="pointer-events-none absolute inset-y-0 w-14 -skew-x-12 bg-white/55"
                />
              )}
            </AnimatePresence>
            <motion.span
              animate={addedPulse ? {y: [0, -2, 0], rotate: [0, -12, 0]} : {y: 0, rotate: 0}}
              transition={{duration: 0.42, ease: "easeOut"}}
              className="relative z-10 inline-flex"
                >
                  <ShoppingCart className="h-4 w-4" />
                </motion.span>
            {addButtonLabel}
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
