import {fetchCatalogProducts} from "@/api/client";
import ProductCard from "@/components/ProductCard";
import type {Product} from "@/types/product";
import type {Language} from "@/types/ui";
import {motion} from "framer-motion";
import {ArrowRight, Boxes, Search, ShieldCheck, Truck, Warehouse, Wrench} from "lucide-react";
import {useEffect, useMemo, useState} from "react";

const fallbackProducts: Product[] = [
  {
    id: 9001,
    name: "Performance Brake Kit",
    slug: "performance-brake-kit",
    description: "Комплект тормозных дисков и колодок для стабильного торможения.",
    price: 229.9,
    stockQuantity: 16,
    brand: "Brembo",
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 9002,
    name: "Adaptive LED Headlight",
    slug: "adaptive-led-headlight",
    description: "Передняя LED-оптика с точной светотеневой границей.",
    price: 189.4,
    stockQuantity: 11,
    brand: "Hella",
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 9003,
    name: "Turbo Intake Module",
    slug: "turbo-intake-module",
    description: "Модуль подачи воздуха с усиленным ресурсом крыльчатки.",
    price: 312,
    stockQuantity: 7,
    brand: "Garrett",
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const storeCopy: Record<
  Language,
  {
    badge: string;
    headlineSuffix: string;
    description: string;
    searchPlaceholder: string;
    searchButton: string;
    quickTitle: string;
    quickDescription: string;
    openCatalog: string;
    highlights: Array<{title: string; value: string; caption: string}>;
    hitsTag: string;
    hitsTitle: string;
    allProducts: string;
    loading: string;
    error: string;
    brandsTitle: string;
    brandsDescription: string;
    orderSteps: Array<{title: string; description: string}>;
    step: string;
    focusNote: string;
    quickCategories: string[];
  }
> = {
  az: {
    badge: "Avto ehtiyat hissələri mağazası",
    headlineSuffix: "— aktual stokla sərt avtomobil hissələri kataloqu",
    description:
      "Biz yalnız avtomobil hissələri satırıq: orijinal və keyfiyyətli analoqlar. Xidmət yoxdur — yalnız məhsul seçimi və sürətli sifariş.",
    searchPlaceholder: "Ad, OEM və ya artikul ilə axtarış",
    searchButton: "Məhsulu tap",
    quickTitle: "Populyar məhsul qrupları",
    quickDescription: "Kataloq bölmələrinə sürətli keçid.",
    openCatalog: "Tam kataloqu aç",
    highlights: [
      {title: "SKU", value: "12 000+", caption: "stokda məhsul"},
      {title: "Brendlər", value: "95+", caption: "kataloq təchizatçıları"},
      {title: "Yenilənmə", value: "24/7", caption: "stok məlumatları"},
      {title: "Anbar", value: "Live", caption: "aktual qalıqlar"}
    ],
    hitsTag: "Məhsul kataloqu",
    hitsTitle: "Satış liderləri",
    allProducts: "Bütün məhsullar",
    loading: "Kataloq yüklənir...",
    error: "Kataloq yüklənmədi. Demo məhsullar göstərilir.",
    brandsTitle: "Stokda olan brendlər",
    brandsDescription: "Orijinal və sınanmış avtomobil hissəsi istehsalçıları.",
    orderSteps: [
      {title: "Məhsul seçimi", description: "Ad, OEM və ya kateqoriya ilə tap."},
      {title: "Stok yoxlaması", description: "Qiymət və qalıq dərhal görünür."},
      {title: "Sifariş", description: "Səbətə əlavə et və sifarişi tamamla."}
    ],
    step: "Addım",
    focusNote: "RICHSTOK fokusunda yalnız avtomobil ehtiyat hissələrinin satışı var.",
    quickCategories: ["Əyləc sistemi", "Asqı", "Filtrlər", "Mühərrik yağları", "Elektrika", "Soyutma", "Transmissiya", "Kuzov hissələri"]
  },
  en: {
    badge: "Automotive parts store",
    headlineSuffix: "— strict auto parts catalog with live stock",
    description:
      "We sell only automotive parts: genuine and trusted aftermarket components. No services — only product selection and fast checkout.",
    searchPlaceholder: "Search by name, OEM, or SKU",
    searchButton: "Find product",
    quickTitle: "Popular product groups",
    quickDescription: "Quick access to catalog sections.",
    openCatalog: "Open full catalog",
    highlights: [
      {title: "SKU", value: "12,000+", caption: "items in stock"},
      {title: "Brands", value: "95+", caption: "catalog suppliers"},
      {title: "Updates", value: "24/7", caption: "inventory refresh"},
      {title: "Warehouse", value: "Live", caption: "actual availability"}
    ],
    hitsTag: "Product catalog",
    hitsTitle: "Top sellers",
    allProducts: "All products",
    loading: "Loading catalog...",
    error: "Catalog failed to load. Demo products are shown.",
    brandsTitle: "Brands in stock",
    brandsDescription: "Genuine and proven auto parts manufacturers.",
    orderSteps: [
      {title: "Select product", description: "Find by name, OEM, or category."},
      {title: "Check availability", description: "See live price and stock instantly."},
      {title: "Place order", description: "Add items to cart and checkout."}
    ],
    step: "Step",
    focusNote: "RICHSTOK focuses only on automotive parts and components sales.",
    quickCategories: ["Brake system", "Suspension", "Filters", "Engine oils", "Electrical", "Cooling", "Transmission", "Body parts"]
  },
  ru: {
    badge: "Магазин автозапчастей",
    headlineSuffix: "— строгий каталог автозапчастей с актуальным наличием",
    description:
      "Мы продаем только автозапчасти: оригинал и качественные аналоги. Без услуг — только выбор товара и быстрый заказ.",
    searchPlaceholder: "Поиск по названию, OEM или артикулу",
    searchButton: "Найти товар",
    quickTitle: "Популярные группы товаров",
    quickDescription: "Быстрый переход в разделы каталога.",
    openCatalog: "Открыть полный каталог",
    highlights: [
      {title: "SKU", value: "12 000+", caption: "товаров на складе"},
      {title: "Бренды", value: "95+", caption: "поставщиков в каталоге"},
      {title: "Отгрузка", value: "24/7", caption: "обновление остатков"},
      {title: "Склад", value: "Live", caption: "актуальные остатки"}
    ],
    hitsTag: "Каталог товаров",
    hitsTitle: "Хиты продаж",
    allProducts: "Все товары",
    loading: "Загрузка каталога...",
    error: "Не удалось загрузить каталог. Показаны демонстрационные товары.",
    brandsTitle: "Бренды в наличии",
    brandsDescription: "Оригинальные и проверенные производители автозапчастей.",
    orderSteps: [
      {title: "Подбор товара", description: "Ищи по названию, OEM или категории."},
      {title: "Проверка наличия", description: "Сразу видны актуальные остатки и цена."},
      {title: "Оформление заказа", description: "Добавляй товар в корзину и оформляй покупку."}
    ],
    step: "Шаг",
    focusNote: "Фокус RICHSTOK: продажа только автозапчастей и комплектующих.",
    quickCategories: ["Тормозная система", "Подвеска", "Фильтры", "Моторные масла", "Электрика", "Охлаждение", "Трансмиссия", "Кузовные детали"]
  }
};

const featuredBrands = ["BOSCH", "MANN-FILTER", "BREMBO", "HELLA", "SACHS", "MAHLE", "VALEO", "NGK", "MOBIL", "TOTAL"];
const highlightIcons = [Boxes, ShieldCheck, Truck, Warehouse];

type StorePageProps = {
  language: Language;
};

export default function StorePage({language}: StorePageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const copy = storeCopy[language];

  useEffect(() => {
    void loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      const data = await fetchCatalogProducts();
      setProducts(data);
      setHasError(false);
    } catch {
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }

  const showcaseProducts = useMemo(() => {
    if (products.length > 0) {
      return products.slice(0, 6);
    }
    return fallbackProducts;
  }, [products]);

  return (
    <motion.section
      key="store"
      initial={{opacity: 0, y: 14}}
      animate={{opacity: 1, y: 0}}
      exit={{opacity: 0, y: -10}}
      transition={{duration: 0.35}}
      className="space-y-8 pb-10"
    >
      <section id="catalog" className="scroll-mt-28 grid gap-4 lg:grid-cols-[1.12fr,0.88fr]">
        <motion.article
          initial={{opacity: 0, x: -18}}
          animate={{opacity: 1, x: 0}}
          transition={{duration: 0.5}}
          className="glass-card rounded-2xl border border-brand-500/22 p-6 sm:p-8"
        >
          <span className="inline-flex items-center rounded-md border border-brand-500/30 bg-brand-500/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.22em] text-brand-200">
            {copy.badge}
          </span>
          <motion.h1
            initial={{opacity: 0, y: 12}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.45, delay: 0.12}}
            className="theme-heading mt-4 text-3xl font-semibold leading-tight sm:text-4xl lg:text-[42px]"
          >
            <motion.span
              initial={{letterSpacing: "0.14em", opacity: 0}}
              animate={{letterSpacing: "0.04em", opacity: 1}}
              transition={{duration: 0.7, delay: 0.2}}
              className="inline-block bg-gradient-to-r from-brand-100 to-brand-300 bg-clip-text text-transparent"
            >
              RICHSTOK
            </motion.span>
            <span> {copy.headlineSuffix}</span>
          </motion.h1>

          <p className="theme-text mt-4 max-w-2xl text-sm leading-relaxed sm:text-base">{copy.description}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr,auto]">
            <label className="relative block">
              <Search className="theme-muted pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <input
                placeholder={copy.searchPlaceholder}
                className="input-surface w-full rounded-xl border py-3 pl-10 pr-3 text-sm outline-none transition focus:border-brand-400/60"
              />
            </label>
            <motion.button
              whileHover={{y: -1}}
              whileTap={{scale: 0.98}}
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-3 text-sm font-medium text-white"
            >
              {copy.searchButton}
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </div>
        </motion.article>

        <motion.aside
          id="categories"
          initial={{opacity: 0, x: 18}}
          animate={{opacity: 1, x: 0}}
          transition={{duration: 0.5, delay: 0.05}}
          className="glass-card scroll-mt-28 rounded-2xl border border-brand-500/18 p-6"
        >
          <h2 className="theme-heading text-lg font-semibold">{copy.quickTitle}</h2>
          <p className="theme-text mt-1 text-sm">{copy.quickDescription}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {copy.quickCategories.map((item, index) => (
              <motion.button
                key={item}
                initial={{opacity: 0, y: 8}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.3, delay: 0.08 + index * 0.03}}
                type="button"
                className="tile-surface rounded-lg border px-3 py-2 text-left text-xs transition hover:border-brand-400/45"
              >
                {item}
              </motion.button>
            ))}
          </div>
          <button type="button" className="mt-4 inline-flex items-center gap-2 text-sm text-brand-200">
            {copy.openCatalog}
            <ArrowRight className="h-4 w-4" />
          </button>
        </motion.aside>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {copy.highlights.map((item, index) => {
          const Icon = highlightIcons[index] ?? Boxes;
          return (
            <motion.article
              key={item.title}
              initial={{opacity: 0, y: 12}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true, amount: 0.3}}
              transition={{duration: 0.35, delay: index * 0.06}}
              className="glass-card rounded-xl p-4"
            >
              <Icon className="h-5 w-5 text-brand-300" />
              <p className="theme-muted mt-3 text-xs uppercase tracking-[0.18em]">{item.title}</p>
              <p className="theme-heading mt-1 text-2xl font-semibold">{item.value}</p>
              <p className="theme-text text-sm">{item.caption}</p>
            </motion.article>
          );
        })}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-200">{copy.hitsTag}</p>
            <h2 className="theme-heading mt-1 text-2xl font-semibold sm:text-3xl">{copy.hitsTitle}</h2>
          </div>
          <button
            type="button"
            className="rounded-lg border border-brand-500/35 bg-brand-500/10 px-4 py-2 text-sm text-brand-100 transition hover:bg-brand-500/20"
          >
            {copy.allProducts}
          </button>
        </div>

        {loading && <div className="glass-card theme-text rounded-xl p-4">{copy.loading}</div>}
        {!loading && hasError && <div className="rounded-xl border border-brand-500/35 bg-brand-500/10 p-4 text-brand-100">{copy.error}</div>}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {showcaseProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} language={language} />
          ))}
        </div>
      </section>

      <section id="brands" className="glass-card scroll-mt-28 rounded-2xl p-6">
        <h3 className="theme-heading text-lg font-semibold">{copy.brandsTitle}</h3>
        <p className="theme-text mt-1 text-sm">{copy.brandsDescription}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {featuredBrands.map((brand, index) => (
            <motion.span
              key={brand}
              initial={{opacity: 0, y: 8}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true, amount: 0.4}}
              transition={{duration: 0.28, delay: index * 0.03}}
              className="tile-surface rounded-md border px-3 py-1.5 text-xs tracking-wide"
            >
              {brand}
            </motion.span>
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {copy.orderSteps.map((item, index) => (
          <motion.article
            key={item.title}
            initial={{opacity: 0, y: 10}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true, amount: 0.4}}
            transition={{duration: 0.35, delay: index * 0.08}}
            className="glass-card rounded-xl p-4"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-brand-200">
              {copy.step} {index + 1}
            </p>
            <h4 className="theme-heading mt-1 text-base font-semibold">{item.title}</h4>
            <p className="theme-text mt-1 text-sm">{item.description}</p>
          </motion.article>
        ))}
      </section>

      <motion.div
        initial={{opacity: 0}}
        whileInView={{opacity: 1}}
        viewport={{once: true}}
        className="tile-surface theme-text rounded-xl border p-4 text-sm"
      >
        <span className="inline-flex items-center gap-2 text-brand-200">
          <Wrench className="h-4 w-4" />
          {copy.focusNote}
        </span>
      </motion.div>
    </motion.section>
  );
}
