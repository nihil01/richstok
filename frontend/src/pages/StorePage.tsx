import {
  fetchBrandImages,
  fetchCatalogCategories,
  fetchCatalogProductsPage,
  searchCatalogProducts
} from "@/api/client";
import ProductCard from "@/components/ProductCard";
import type {DisplayCurrency} from "@/types/currency";
import type {Product, ProductCategorySummary} from "@/types/product";
import type {Language} from "@/types/ui";
import {formatConvertedPrice} from "@/utils/currency";
import {motion} from "framer-motion";
import {
  ArrowRight,
  Boxes,
  Car,
  ChevronLeft,
  ChevronRight,
  Cog,
  Disc3,
  Droplets,
  Filter,
  Search,
  ShieldCheck,
  Snowflake,
  Truck,
  Warehouse,
  Wrench,
  Zap
} from "lucide-react";
import {useEffect, useMemo, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import {Autoplay, FreeMode} from "swiper/modules";
import {Swiper, SwiperSlide} from "swiper/react";
import "swiper/css";
import "swiper/css/free-mode";

const fallbackProducts: Product[] = [
  {
    id: 9001,
    name: "Performance Brake Kit",
    slug: "performance-brake-kit",
    sku: "BRK-9001",
    category: "Brake System",
    oemNumber: "OEM-BRK-001",
    description: "Комплект тормозных дисков и колодок для стабильного торможения.",
    imageUrl: null,
    price: 229.9,
    stockQuantity: 16,
    stockState: "IN_STOCK",
    brand: "Brembo",
    bakuCount: 16,
    bakuCountUnknown: false,
    ganjaCount: 0,
    ganjaCountUnknown: false,
    deliveryDays: 1,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 9002,
    name: "Adaptive LED Headlight",
    slug: "adaptive-led-headlight",
    sku: "LGT-9002",
    category: "Electrical",
    oemNumber: "OEM-LGT-198",
    description: "Передняя LED-оптика с точной светотеневой границей.",
    imageUrl: null,
    price: 189.4,
    stockQuantity: 11,
    stockState: "IN_STOCK",
    brand: "Hella",
    bakuCount: 0,
    bakuCountUnknown: false,
    ganjaCount: 11,
    ganjaCountUnknown: false,
    deliveryDays: 2,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 9003,
    name: "Turbo Intake Module",
    slug: "turbo-intake-module",
    sku: "AIR-9003",
    category: "Engine",
    oemNumber: "OEM-AIR-330",
    description: "Модуль подачи воздуха с усиленным ресурсом крыльчатки.",
    imageUrl: null,
    price: 312,
    stockQuantity: 7,
    stockState: "IN_STOCK",
    brand: "Garrett",
    bakuCount: 7,
    bakuCountUnknown: false,
    ganjaCount: 0,
    ganjaCountUnknown: false,
    deliveryDays: 1,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const storeCopy: Record<
  Language,
  {
    badge: string;
    description: string;
    searchPlaceholder: string;
    searchButton: string;
    searchLoading: string;
    searchEmpty: string;
    quickTitle: string;
    quickDescription: string;
    allCategories: string;
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
    categoryCount: string;
    pagination: {page: string; of: string; prev: string; next: string};
  }
> = {
  az: {
    badge: "Avto ehtiyat hissələri mağazası",
    description:
      "Biz yalnız avtomobil hissələri satırıq: orijinal və keyfiyyətli analoqlar.",
    searchPlaceholder: "Ad, OEM, brand code, model və ya artikul ilə axtarış",
    searchButton: "Məhsulu tap",
    searchLoading: "Axtarılır...",
    searchEmpty: "Uyğun məhsul tapılmadı.",
    quickTitle: "Kateqoriyalar",
    quickDescription: "Kateqoriyalar backend katalogundan real vaxtda formalaşır.",
    allCategories: "Hamısı",
    highlights: [
      {title: "Brand code", value: "12 000+", caption: "stokda məhsul"},
      {title: "Brendlər", value: "95+", caption: "kataloq təchizatçıları"},
      {title: "Yenilənmə", value: "24/7", caption: "stok məlumatları"},
      {title: "Anbar", value: "Live", caption: "aktual qalıqlar"}
    ],
    hitsTag: "Məhsul kataloqu",
    hitsTitle: "Məhsullar",
    allProducts: "Bütün məhsullar",
    loading: "Kataloq yüklənir...",
    error: "Kataloq yüklənmədi. Demo məhsullar göstərilir.",
    brandsTitle: "Stokda olan brendlər",
    brandsDescription: "Orijinal və sınanmış avtomobil hissəsi istehsalçıları.",
    orderSteps: [
      {title: "Məhsul seçimi", description: "Ad, OEM, brand code, model və ya kateqoriya ilə tap."},
      {title: "Stok yoxlaması", description: "Qiymət və qalıq dərhal görünür."},
      {title: "Sifariş", description: "Səbətə əlavə et və sifarişi tamamla."}
    ],
    step: "Addım",
    categoryCount: "məhsul",
    pagination: {page: "Səhifə", of: "/", prev: "Əvvəlki", next: "Növbəti"}
  },
  en: {
    badge: "Automotive parts store",
    description:
      "We sell only automotive parts: genuine and trusted aftermarket components",
    searchPlaceholder: "Search by name, OEM, model, category or brand code",
    searchButton: "Find product",
    searchLoading: "Searching...",
    searchEmpty: "No matching products found.",
    quickTitle: "Categories",
    quickDescription: "Category blocks are grouped directly from backend catalog data.",
    allCategories: "All",
    highlights: [
      {title: "Brand code", value: "12,000+", caption: "items in stock"},
      {title: "Brands", value: "95+", caption: "catalog suppliers"},
      {title: "Updates", value: "24/7", caption: "inventory refresh"},
      {title: "Warehouse", value: "Live", caption: "actual availability"}
    ],
    hitsTag: "Product catalog",
    hitsTitle: "Products",
    allProducts: "All products",
    loading: "Loading catalog...",
    error: "Catalog failed to load. Demo products are shown.",
    brandsTitle: "Brands in stock",
    brandsDescription: "Genuine and proven auto parts manufacturers.",
    orderSteps: [
      {title: "Select product", description: "Find by name, model, OEM, or category."},
      {title: "Check availability", description: "See live price and stock instantly."},
      {title: "Place order", description: "Add items to cart and checkout."}
    ],
    step: "Step",
    categoryCount: "items",
    pagination: {page: "Page", of: "of", prev: "Previous", next: "Next"}
  },
  ru: {
    badge: "Магазин автозапчастей",
    description:
      "Мы продаем только автозапчасти: оригинал и качественные аналоги",
    searchPlaceholder: "Поиск по названию, OEM, brand code, модели или артикулу",
    searchButton: "Найти товар",
    searchLoading: "Поиск...",
    searchEmpty: "Подходящих товаров не найдено.",
    quickTitle: "Категории",
    quickDescription: "Категории сгруппированы по данным каталога с backend.",
    allCategories: "Все",
    highlights: [
      {title: "Brand code", value: "12 000+", caption: "товаров на складе"},
      {title: "Бренды", value: "95+", caption: "поставщиков в каталоге"},
      {title: "Отгрузка", value: "24/7", caption: "обновление остатков"},
      {title: "Склад", value: "Live", caption: "актуальные остатки"}
    ],
    hitsTag: "Каталог товаров",
    hitsTitle: "Товары",
    allProducts: "Все товары",
    loading: "Загрузка каталога...",
    error: "Не удалось загрузить каталог. Показаны демонстрационные товары.",
    brandsTitle: "Бренды в наличии",
    brandsDescription: "Оригинальные и проверенные производители автозапчастей.",
    orderSteps: [
      {title: "Подбор товара", description: "Ищи по названию, OEM, brand code, модели или категории."},
      {title: "Проверка наличия", description: "Сразу видны актуальные остатки и цена."},
      {title: "Оформление заказа", description: "Добавляй товар в корзину и оформляй покупку."}
    ],
    step: "Шаг",
    categoryCount: "товаров",
    pagination: {page: "Страница", of: "из", prev: "Назад", next: "Вперед"}
  }
};

const featuredBrands = ["BOSCH", "MANN-FILTER", "BREMBO", "HELLA", "SACHS", "MAHLE", "VALEO", "NGK", "MOBIL", "TOTAL"];
const highlightIcons = [Boxes, ShieldCheck, Truck, Warehouse];
const categoryFallbackIcons = [Droplets, Zap, Filter, Snowflake, Disc3, Wrench, Cog, Car];

type StorePageProps = {
  language: Language;
  displayCurrency: DisplayCurrency;
  currencyRates: Record<string, number>;
  onAddToCart: (product: Product) => void;
};

export default function StorePage({language, displayCurrency, currencyRates, onAddToCart}: StorePageProps) {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [brandImages, setBrandImages] = useState<string[]>([]);
  const [categories, setCategories] = useState<ProductCategorySummary[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [catalogQuery, setCatalogQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [overallTotalElements, setOverallTotalElements] = useState(0);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const searchRequestRef = useRef(0);
  const copy = storeCopy[language];

  useEffect(() => {
    void loadCatalogPage(0);
  }, [selectedCategory, catalogQuery]);

  useEffect(() => {
    void loadBrandImages();
    void loadCategories();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!searchContainerRef.current?.contains(event.target as Node)) {
        setSearchDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const normalizedQuery = searchQuery.trim();
    if (!normalizedQuery) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    const timer = window.setTimeout(() => {
      void (async () => {
        const requestId = searchRequestRef.current + 1;
        searchRequestRef.current = requestId;
        setSearchLoading(true);
        try {
          const result = await searchCatalogProducts(normalizedQuery);
          if (searchRequestRef.current !== requestId) {
            return;
          }
          setSearchResults(result.slice(0, 10));
          setSearchDropdownOpen(true);
        } catch {
          if (searchRequestRef.current !== requestId) {
            return;
          }
          setSearchResults([]);
        } finally {
          if (searchRequestRef.current === requestId) {
            setSearchLoading(false);
          }
        }
      })();
    }, 220);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  async function loadCatalogPage(page: number) {
    try {
      setLoading(true);
      const data = await fetchCatalogProductsPage({
        page,
        size: 12,
        category: selectedCategory || undefined,
        query: catalogQuery || undefined
      });
      setProducts(data.content);
      setCurrentPage(data.page);
      setTotalPages(Math.max(1, data.totalPages || 1));
      setTotalElements(data.totalElements);
      if (!selectedCategory && !catalogQuery.trim()) {
        setOverallTotalElements(data.totalElements);
      }
      setHasError(false);
    } catch {
      setHasError(true);
      setProducts([]);
      setTotalPages(1);
      setCurrentPage(0);
      setTotalElements(0);
      if (!selectedCategory && !catalogQuery.trim()) {
        setOverallTotalElements(0);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const data = await fetchCatalogCategories();
      setCategories(data);
    } catch {
      setCategories([]);
    }
  }

  async function loadBrandImages() {
    try {
      const data = await fetchBrandImages();
      setBrandImages(data);
    } catch {
      setBrandImages([]);
    }
  }

  function openProduct(productId: number) {
    setSearchDropdownOpen(false);
    setSearchQuery("");
    navigate(`/products/${productId}`);
  }

  function applySearchFilter() {
    setCatalogQuery(searchQuery.trim());
  }

  function changePage(nextPage: number) {
    if (nextPage < 0 || nextPage >= totalPages || nextPage === currentPage) {
      return;
    }
    void loadCatalogPage(nextPage);
  }

  const showcaseProducts = useMemo(() => {
    if (products.length > 0) {
      return products;
    }
    if (hasError) {
      return fallbackProducts;
    }
    return [];
  }, [products, hasError]);

  const mirroredBrandImages = useMemo(() => [...brandImages].reverse(), [brandImages]);
  const allProductsCount = useMemo(() => {
    if (overallTotalElements > 0) {
      return overallTotalElements;
    }
    const categoriesTotal = categories.reduce((sum, category) => sum + (Number.isFinite(category.count) ? Math.max(0, category.count) : 0), 0);
    if (categoriesTotal > 0) {
      return categoriesTotal;
    }
    return totalElements;
  }, [overallTotalElements, categories, totalElements]);

  return (
    <motion.section
      key="store"
      initial={{opacity: 0, y: 14}}
      animate={{opacity: 1, y: 0}}
      exit={{opacity: 0, y: -10}}
      transition={{duration: 0.35}}
      className="space-y-8 pb-10"
    >
      <section id="catalog" className="relative z-20 scroll-mt-28">
        <motion.article initial={{opacity: 0, y: 14}} animate={{opacity: 1, y: 0}} transition={{duration: 0.45}} className="glass-card rounded-2xl border border-brand-500/22 p-6 sm:p-8 lg:p-10">
          <span className="inline-flex items-center rounded-md border border-brand-500/30 bg-brand-500/10 px-2.5 py-1 text-[18px] uppercase tracking-[0.20em] text-brand-200">
            {copy.badge}
          </span>

          <p className="theme-text mt-4 max-w-2xl text-sm leading-relaxed sm:text-base">{copy.description}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr,auto]">
            <div ref={searchContainerRef} className="relative z-50 block">
              <Search className="theme-muted pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0 || searchLoading) {
                    setSearchDropdownOpen(true);
                  }
                }}
                placeholder={copy.searchPlaceholder}
                className="input-surface w-full rounded-xl border py-3 pl-10 pr-3 text-sm outline-none transition focus:border-brand-400/60"
              />

              {searchDropdownOpen && searchQuery.trim().length > 0 && (
                <div className="glass-card absolute left-0 right-0 top-[calc(100%+8px)] z-[70] max-h-[32rem] overflow-y-auto rounded-xl border border-brand-500/30 p-2">
                  {searchLoading && <p className="theme-muted px-2 py-2 text-xs">{copy.searchLoading}</p>}
                  {!searchLoading && searchResults.length === 0 && <p className="theme-muted px-2 py-2 text-xs">{copy.searchEmpty}</p>}
                  {!searchLoading &&
                    searchResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => openProduct(item.id)}
                        className="tile-surface flex w-full items-center justify-between rounded-lg border border-transparent px-2.5 py-2 text-left transition hover:border-brand-400/40"
                      >
                        <span className="min-w-0">
                          <span className="theme-heading block truncate text-sm">{item.name}</span>
                          <span className="theme-muted block truncate text-xs">
                            {item.sku} · {item.brand || "OEM"}
                          </span>
                        </span>
                        <span className="ml-3 flex-shrink-0 text-xs font-medium text-brand-200">
                          {formatConvertedPrice(item.price, displayCurrency, currencyRates, language)}
                        </span>
                      </button>
                    ))}
                </div>
              )}
            </div>
            <motion.button
              whileHover={{y: -1}}
              whileTap={{scale: 0.98}}
              type="button"
              onClick={applySearchFilter}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-3 text-sm font-medium text-white"
            >
              {copy.searchButton}
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </div>
        </motion.article>
      </section>

      <section id="categories" className="relative z-10 scroll-mt-28">
        <motion.div initial={{opacity: 0, y: 14}} whileInView={{opacity: 1, y: 0}} viewport={{once: true, amount: 0.15}} transition={{duration: 0.4}} className="glass-card rounded-2xl border border-brand-500/18 p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="theme-heading text-xl font-semibold">{copy.quickTitle}</h2>
              <p className="theme-text mt-1 text-sm">{copy.quickDescription}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <CategoryCard
              key="all-categories"
              active={!selectedCategory}
              title={copy.allCategories}
              subtitle={`${allProductsCount} ${copy.categoryCount}`}
              icon={Boxes}
              onClick={() => setSelectedCategory("")}
            />
            {categories.map((category, index) => (
              <CategoryCard
                key={category.name}
                active={selectedCategory === category.name}
                title={category.name}
                subtitle={`${category.count} ${copy.categoryCount}`}
                icon={resolveCategoryIcon(category.name, index)}
                onClick={() => setSelectedCategory(category.name)}
              />
            ))}
          </div>
        </motion.div>
      </section>

      <section id="brands" className="glass-card scroll-mt-28 rounded-2xl p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="theme-heading text-lg font-semibold">{copy.brandsTitle}</h3>
            <p className="theme-text mt-1 text-sm">{copy.brandsDescription}</p>
          </div>
        </div>
        {brandImages.length > 0 ? (
          <div className="brand-carousel-shell mt-4 rounded-xl border border-brand-500/18 bg-black/20 p-3">
            <Swiper
              modules={[Autoplay, FreeMode]}
              className="brand-swiper"
              loop={brandImages.length > 4}
              speed={5200}
              freeMode={{enabled: true, momentum: false}}
              autoplay={{delay: 0, disableOnInteraction: false, pauseOnMouseEnter: true}}
              grabCursor
              slidesPerView={2}
              spaceBetween={12}
              breakpoints={{
                640: {slidesPerView: 3, spaceBetween: 14},
                1024: {slidesPerView: 4, spaceBetween: 16},
                1280: {slidesPerView: 5, spaceBetween: 18}
              }}
            >
              {brandImages.map((imageUrl, index) => (
                <SwiperSlide key={`${imageUrl}-${index}`}>
                  <div className="tile-surface brand-slide h-20 rounded-lg border p-2">
                    <img src={imageUrl} alt={`brand-${index + 1}`} className="h-full w-full object-contain" loading="lazy" />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            {mirroredBrandImages.length > 4 && (
              <Swiper
                modules={[Autoplay, FreeMode]}
                className="brand-swiper brand-swiper-secondary mt-3"
                loop
                speed={5600}
                freeMode={{enabled: true, momentum: false}}
                autoplay={{delay: 0, disableOnInteraction: false, pauseOnMouseEnter: true, reverseDirection: true}}
                grabCursor
                slidesPerView={2}
                spaceBetween={12}
                breakpoints={{
                  640: {slidesPerView: 3, spaceBetween: 14},
                  1024: {slidesPerView: 4, spaceBetween: 16},
                  1280: {slidesPerView: 5, spaceBetween: 18}
                }}
              >
                {mirroredBrandImages.map((imageUrl, index) => (
                  <SwiperSlide key={`reverse-${imageUrl}-${index}`}>
                    <div className="tile-surface brand-slide h-16 rounded-lg border p-2">
                      <img src={imageUrl} alt={`brand-mirror-${index + 1}`} className="h-full w-full object-contain" loading="lazy" />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </div>
        ) : (
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
        )}
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
          <span className="rounded-lg border border-brand-500/35 bg-brand-500/10 px-4 py-2 text-sm text-brand-100">
            {copy.allProducts}: {allProductsCount}
          </span>
        </div>

        {loading && <div className="glass-card theme-text rounded-xl p-4">{copy.loading}</div>}
        {!loading && hasError && <div className="rounded-xl border border-brand-500/35 bg-brand-500/10 p-4 text-brand-100">{copy.error}</div>}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {showcaseProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              language={language}
              displayCurrency={displayCurrency}
              currencyRates={currencyRates}
              onOpen={openProduct}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>

        {!hasError && totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage === 0}
              className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-xs theme-text transition hover:border-brand-300 disabled:opacity-45"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {copy.pagination.prev}
            </button>
            <span className="theme-text rounded-lg border border-white/10 px-3 py-1.5 text-xs">
              {copy.pagination.page} {currentPage + 1} {copy.pagination.of} {totalPages}
            </span>
            <button
              type="button"
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage + 1 >= totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-xs theme-text transition hover:border-brand-300 disabled:opacity-45"
            >
              {copy.pagination.next}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
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
    </motion.section>
  );
}

type CategoryCardProps = {
  title: string;
  subtitle: string;
  icon: typeof Boxes;
  onClick: () => void;
  active: boolean;
};

function CategoryCard({title, subtitle, icon: Icon, onClick, active}: CategoryCardProps) {
  return (
    <motion.button
      initial={{opacity: 0, y: 10}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true, amount: 0.2}}
      transition={{duration: 0.3}}
      whileHover={{y: -4, scale: 1.02}}
      whileTap={{scale: 0.985}}
      type="button"
      onClick={onClick}
      className={`tile-surface category-card group rounded-xl border p-4 text-left transition hover:border-brand-400/45 ${active ? "border-brand-400/60 bg-brand-500/12" : ""}`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-brand-500/30 bg-brand-500/10 text-brand-200 transition group-hover:scale-105 group-hover:bg-brand-500/20">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="theme-heading line-clamp-1 text-sm font-medium">{title}</p>
      <p className="theme-muted mt-1 line-clamp-2 text-xs leading-relaxed">{subtitle}</p>
    </motion.button>
  );
}

function resolveCategoryIcon(categoryName: string, fallbackIndex: number) {
  const normalized = categoryName.toLowerCase();
  if (normalized.includes("oil") || normalized.includes("yağ") || normalized.includes("масл")) {
    return Droplets;
  }
  if (normalized.includes("elect") || normalized.includes("элект") || normalized.includes("elektr")) {
    return Zap;
  }
  if (normalized.includes("filter") || normalized.includes("filtr")) {
    return Filter;
  }
  if (normalized.includes("cool") || normalized.includes("охлаж") || normalized.includes("soyut")) {
    return Snowflake;
  }
  if (normalized.includes("brake") || normalized.includes("торм") || normalized.includes("əyləc")) {
    return Disc3;
  }
  if (normalized.includes("susp") || normalized.includes("подвес") || normalized.includes("asqı")) {
    return Wrench;
  }
  if (normalized.includes("trans") || normalized.includes("короб") || normalized.includes("ötürü")) {
    return Cog;
  }
  if (normalized.includes("body") || normalized.includes("кузов") || normalized.includes("kuzov")) {
    return Car;
  }
  return categoryFallbackIcons[fallbackIndex % categoryFallbackIcons.length] ?? Boxes;
}
