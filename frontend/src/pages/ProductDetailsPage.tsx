import {fetchCatalogProductById} from "@/api/client";
import type {DisplayCurrency} from "@/types/currency";
import type {Product} from "@/types/product";
import type {Language} from "@/types/ui";
import {formatConvertedPrice} from "@/utils/currency";
import {AnimatePresence, motion} from "framer-motion";
import {ArrowLeft, Clock3, ImageOff, PackageCheck, Search, ShieldCheck, ShoppingCart, Tag, Truck} from "lucide-react";
import {useEffect, useMemo, useState} from "react";
import {Link, useParams} from "react-router-dom";

type ProductDetailsPageProps = {
  language: Language;
  displayCurrency: DisplayCurrency;
  currencyRates: Record<string, number>;
  onAddToCart?: (product: Product) => void;
};

const detailsCopy: Record<
  Language,
  {
    back: string;
    loading: string;
    notFound: string;
    retry: string;
    sku: string;
    category: string;
    brand: string;
    model: string;
    oem: string;
    deliveryDays: string;
    daysShort: string;
    stock: string;
    stockState: string;
    active: string;
    createdAt: string;
    updatedAt: string;
    addToCart: string;
    oemSearch: string;
    outOfStockAction: string;
    clarifyAction: string;
    delivery: string;
    quality: string;
    defaultDescription: string;
    stockUnknownHint: string;
    yes: string;
    no: string;
  }
> = {
  az: {
    back: "Mağazaya qayıt",
    loading: "Məhsul yüklənir...",
    notFound: "Məhsul tapılmadı və ya silinib.",
    retry: "Yenidən yoxla",
    sku: "Brand code",
    category: "Kateqoriya",
    brand: "Brend",
    model: "Model",
    oem: "OEM nömrəsi",
    deliveryDays: "Çatdırılma",
    daysShort: "gün",
    stock: "Qalıq",
    stockState: "Stok statusu",
    active: "Aktivlik",
    createdAt: "Yaradılıb",
    updatedAt: "Yenilənib",
    addToCart: "Səbətə at",
    oemSearch: "OEM ilə axtar",
    outOfStockAction: "Yoxdur",
    clarifyAction: "Dəqiqləşdir",
    delivery: "Anbardan sürətli göndəriş",
    quality: "Orijinal və test edilmiş ehtiyat hissə",
    defaultDescription: "Bu məhsul üçün təsvir əlavə edilməyib.",
    stockUnknownHint: "Dəqiq stok məlum deyil. Dəqiq say üçün dəstək xidməti ilə əlaqə saxlayın.",
    yes: "Bəli",
    no: "Xeyr"
  },
  en: {
    back: "Back to store",
    loading: "Loading product...",
    notFound: "Product not found or removed.",
    retry: "Try again",
    sku: "Brand code",
    category: "Category",
    brand: "Brand",
    model: "Model",
    oem: "OEM number",
    deliveryDays: "Delivery",
    daysShort: "days",
    stock: "Stock",
    stockState: "Stock state",
    active: "Active",
    createdAt: "Created",
    updatedAt: "Updated",
    addToCart: "Add to cart",
    oemSearch: "Search by OEM",
    outOfStockAction: "Out of stock",
    clarifyAction: "Clarify",
    delivery: "Fast dispatch from warehouse",
    quality: "Genuine and quality-tested auto part",
    defaultDescription: "No description has been added for this product.",
    stockUnknownHint: "Exact stock quantity is unknown. Please contact support to confirm availability.",
    yes: "Yes",
    no: "No"
  },
  ru: {
    back: "Вернуться в магазин",
    loading: "Загрузка товара...",
    notFound: "Товар не найден или удален.",
    retry: "Повторить",
    sku: "Brand code",
    category: "Категория",
    brand: "Бренд",
    model: "Модель",
    oem: "OEM номер",
    deliveryDays: "Доставка",
    daysShort: "дн.",
    stock: "Остаток",
    stockState: "Статус наличия",
    active: "Активность",
    createdAt: "Создан",
    updatedAt: "Обновлен",
    addToCart: "В корзину",
    oemSearch: "Поиск по OEM",
    outOfStockAction: "Нет в наличии",
    clarifyAction: "Уточнить",
    delivery: "Быстрая отгрузка со склада",
    quality: "Оригинальная и проверенная автозапчасть",
    defaultDescription: "Для этого товара пока нет описания.",
    stockUnknownHint: "Точное количество неизвестно. Уточните наличие в службе поддержки.",
    yes: "Да",
    no: "Нет"
  }
};

const stockStateLabelMap: Record<Language, Record<string, string>> = {
  az: {
    IN_STOCK: "Var",
    LOW_STOCK: "Az var",
    OUT_OF_STOCK: "Yoxdur"
  },
  en: {
    IN_STOCK: "In stock",
    LOW_STOCK: "Low stock",
    OUT_OF_STOCK: "Out of stock"
  },
  ru: {
    IN_STOCK: "В наличии",
    LOW_STOCK: "Мало",
    OUT_OF_STOCK: "Нет в наличии"
  }
};

export default function ProductDetailsPage({
  language,
  displayCurrency,
  currencyRates,
  onAddToCart
}: ProductDetailsPageProps) {
  const {id} = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [addPulse, setAddPulse] = useState(false);
  const copy = detailsCopy[language];

  useEffect(() => {
    if (!id) {
      setError(true);
      setLoading(false);
      return;
    }

    const numericId = Number(id);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      setError(true);
      setLoading(false);
      return;
    }

    void (async () => {
      try {
        setLoading(true);
        const data = await fetchCatalogProductById(numericId);
        setProduct(data);
        setError(false);
      } catch {
        setProduct(null);
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const locale = language === "ru" ? "ru-RU" : language === "en" ? "en-GB" : "az-Latn-AZ";
  const stockState = product ? stockStateLabelMap[language][product.stockState] ?? product.stockState : "—";
  const hasUnknownStock = product ? product.unknownCount : false;
  const outOfStock = product ? product.stockQuantity <= 0 : true;
  const addDisabled = hasUnknownStock || outOfStock;
  const addButtonLabel = hasUnknownStock
    ? copy.clarifyAction
    : outOfStock
      ? copy.outOfStockAction
      : copy.addToCart;
  const oemSearchQuery = product ? product.oemNumber?.trim() || product.sku.trim() : "";
  const oemSearchUrl = buildOemImageSearchUrl(oemSearchQuery);

  const createdAt = useMemo(() => {
    if (!product?.createdAt) {
      return "—";
    }
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(product.createdAt));
  }, [product?.createdAt, locale]);

  const updatedAt = useMemo(() => {
    if (!product?.updatedAt) {
      return "—";
    }
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(product.updatedAt));
  }, [product?.updatedAt, locale]);

  if (loading) {
    return (
      <section className="glass-card rounded-2xl p-6">
        <p className="theme-text">{copy.loading}</p>
      </section>
    );
  }

  if (error || !product) {
    return (
      <section className="glass-card rounded-2xl p-6 text-center">
        <p className="theme-heading text-lg">{copy.notFound}</p>
        <Link to="/" className="mt-4 inline-flex rounded-lg bg-gradient-to-r from-brand-600 to-pulse-500 px-4 py-2 text-sm font-medium text-white">
          {copy.back}
        </Link>
      </section>
    );
  }

  return (
    <motion.section
      key={`product-${product.id}`}
      initial={{opacity: 0, y: 14}}
      animate={{opacity: 1, y: 0}}
      exit={{opacity: 0, y: -10}}
      transition={{duration: 0.3}}
      className="space-y-5"
    >
      <Link to="/" className="inline-flex items-center gap-2 rounded-lg border border-brand-500/30 bg-brand-500/10 px-3 py-1.5 text-sm text-brand-100">
        <ArrowLeft className="h-4 w-4" />
        {copy.back}
      </Link>

      <article className="glass-card rounded-3xl p-5 sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[1.05fr,1fr]">
          <div className="rounded-2xl border border-brand-500/22 bg-black/25 p-4">
            <div className="flex h-[320px] items-center justify-center overflow-hidden rounded-xl border border-brand-500/16 bg-black/30">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="h-full w-full object-contain p-4" />
              ) : (
                <ImageOff className="h-10 w-10 text-brand-300/70" />
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-brand-200">{copy.category}: {product.category}</p>
              <h1 className="theme-heading mt-2 text-2xl font-semibold sm:text-3xl">{product.name}</h1>
              <p className="theme-text mt-2 text-sm">{product.description || copy.defaultDescription}</p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <InfoRow icon={Tag} label={copy.sku} value={product.sku} />
              <InfoRow icon={ShieldCheck} label={copy.brand} value={product.brand || "OEM"} />
              <InfoRow icon={PackageCheck} label={copy.stock} value={String(product.stockQuantity)} />
              <InfoRow icon={Truck} label={copy.stockState} value={stockState} />
              <InfoRow icon={Clock3} label={copy.createdAt} value={createdAt} />
              <InfoRow icon={Clock3} label={copy.updatedAt} value={updatedAt} />
              <InfoRow icon={Tag} label={copy.oem} value={product.oemNumber || "—"} />
              <InfoRow icon={Tag} label={copy.model} value={product.model || "—"} />
              <InfoRow icon={Clock3} label={copy.deliveryDays} value={product.deliveryDays != null ? `${product.deliveryDays} ${copy.daysShort}` : "—"} />
              <InfoRow icon={ShieldCheck} label={copy.active} value={product.active ? copy.yes : copy.no} />
            </div>

            {hasUnknownStock && (
              <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                {copy.stockUnknownHint}
              </div>
            )}

            <div className="rounded-xl border border-brand-500/24 bg-brand-500/8 p-4">
              <p className="theme-heading text-3xl font-semibold text-brand-200">{formatConvertedPrice(product.price, displayCurrency, currencyRates, language)}</p>
              <p className="theme-muted mt-1 text-xs">AZN base · {copy.delivery}</p>
              <p className="theme-muted text-xs">{copy.quality}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <motion.button
                animate={!addDisabled && addPulse
                  ? {
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      "0 0 0 rgba(239,68,68,0)",
                      "0 0 34px rgba(239,68,68,0.5)",
                      "0 0 0 rgba(239,68,68,0)"
                    ]
                  }
                  : {
                    scale: 1,
                    boxShadow: "0 0 0 rgba(239,68,68,0)"
                  }}
                transition={{duration: 0.48, ease: "easeOut"}}
                type="button"
                disabled={addDisabled}
                onClick={() => {
                  if (addDisabled) {
                    return;
                  }
                  onAddToCart?.(product);
                  setAddPulse(true);
                  window.setTimeout(() => setAddPulse(false), 520);
                }}
                className={`relative inline-flex items-center gap-2 overflow-hidden rounded-lg px-4 py-2.5 text-sm font-medium ${
                  addDisabled
                    ? "cursor-not-allowed border border-white/15 bg-white/8 text-white/55"
                    : "bg-gradient-to-r from-brand-600 to-pulse-500 text-white"
                }`}
              >
                <AnimatePresence>
                  {!addDisabled && addPulse && (
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
                  animate={addPulse ? {y: [0, -2, 0], rotate: [0, -12, 0]} : {y: 0, rotate: 0}}
                  transition={{duration: 0.42, ease: "easeOut"}}
                  className="relative z-10 inline-flex"
                >
                  <ShoppingCart className="h-4 w-4" />
                </motion.span>
                {addButtonLabel}
              </motion.button>
              <a
                href={oemSearchUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 rounded-lg border border-brand-500/35 bg-brand-500/10 px-4 py-2.5 text-sm text-brand-100 transition hover:bg-brand-500/18"
              >
                <Search className="h-4 w-4" />
                {copy.oemSearch}
              </a>
            </div>
          </div>
        </div>
      </article>
    </motion.section>
  );
}

type InfoRowProps = {
  icon: typeof Tag;
  label: string;
  value: string;
};

function InfoRow({icon: Icon, label, value}: InfoRowProps) {
  return (
    <div className="tile-surface rounded-lg border px-3 py-2 text-sm">
      <p className="theme-muted inline-flex items-center gap-1.5 text-xs">
        <Icon className="h-3.5 w-3.5 text-brand-200" />
        {label}
      </p>
      <p className="theme-heading mt-1 line-clamp-1">{value}</p>
    </div>
  );
}

function buildOemImageSearchUrl(query: string): string {
  const normalizedQuery = query.trim();
  const encodedQuery = encodeURIComponent(normalizedQuery);
  return `https://www.google.com/search?q=${encodedQuery}&tbm=isch`;
}
