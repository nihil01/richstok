import {
  fetchBrandImages,
  fetchCatalogCategories,
  fetchCatalogStats,
  fetchCatalogProductsPage,
  searchCatalogProducts
} from "@/api/client";
import ProductCard from "@/components/ProductCard";
import type {DisplayCurrency} from "@/types/currency";
import type {Product, ProductCatalogStats, ProductCategorySummary} from "@/types/product";
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
import {Autoplay, FreeMode, Pagination} from "swiper/modules";
import {Swiper, SwiperSlide} from "swiper/react";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/pagination";

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
    unknownCount: false,
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
    unknownCount: false,
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
    unknownCount: false,
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
    animatedPlaceholders: string[];
    searchButton: string;
    searchLoading: string;
    searchEmpty: string;
    quickTitle: string;
    quickDescription: string;
    allCategories: string;
    promoTag: string;
    promoTitle: string;
    promoSubtitle: string;
    promoSlides: Array<{title: string; description: string; action: string}>;
    highlights: Array<{title: string; caption: string}>;
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
    animatedPlaceholders: [
      "MANN FILTER C 35 154 axtar",
      "OEM kod ilə axtar: 06H115562",
      "Model ilə axtar: Toyota Camry",
      "Kateqoriya ilə axtar: Filtrlər"
    ],
    searchButton: "Məhsulu tap",
    searchLoading: "Axtarılır...",
    searchEmpty: "Uyğun məhsul tapılmadı.",
    quickTitle: "Kateqoriyalar",
    quickDescription: "Kateqoriyalar backend katalogundan real vaxtda formalaşır.",
    allCategories: "Hamısı",
    promoTag: "Real promo",
    promoTitle: "Həftənin aktiv kampaniyaları",
    promoSubtitle: "Məhdud stoklu real təkliflər — qiymətlər anlıq yenilənir.",
    promoSlides: [
      {
        title: "Liqui Moly Top Tec 4200 5W-30 — 15% endirim",
        description: "Mühərrik yağında həftəlik kampaniya. Müəyyən modellər üçün eyni gün təhvil.",
        action: "Yağlara bax"
      },
      {
        title: "MANN FILTER dəsti 3+1",
        description: "Hava + yağ + salon filtr al, 1 filtr hədiyyə. Aksiya stok bitənədək etibarlıdır.",
        action: "Filtrlərə keç"
      },
      {
        title: "Brembo brake kit — pulsuz çatdırılma",
        description: "Disk + kolodka komplektlərində Bakı daxili pulsuz çatdırılma və sürətli göndəriş.",
        action: "Əyləc hissələri"
      }
    ],
    highlights: [
      {title: "Brand code", caption: "anbarda dəqiq qalıq"},
      {title: "Brendlər", caption: "kataloq təchizatçıları"},
      {title: "Kateqoriyalar", caption: "kataloq bölməsi"},
      {title: "Məhsullar", caption: "aktiv məhsul mövqeyi"}
    ],
    hitsTag: "Məhsul kataloqu",
    hitsTitle: "Məhsullar",
    allProducts: "Bütün məhsullar",
    loading: "Kataloq yüklənir...",
    error: "Kataloq yüklənmədi. Demo məhsullar göstərilir.",
    brandsTitle: "Stokda olan markalar",
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
    animatedPlaceholders: [
      "Search MANN FILTER C 35 154",
      "Search by OEM: 06H115562",
      "Search by model: Toyota Camry",
      "Search by category: Filters"
    ],
    searchButton: "Find product",
    searchLoading: "Searching...",
    searchEmpty: "No matching products found.",
    quickTitle: "Categories",
    quickDescription: "Category blocks are grouped directly from backend catalog data.",
    allCategories: "All",
    promoTag: "Real promo",
    promoTitle: "Live weekly deals",
    promoSubtitle: "Limited-stock offers with real pricing from the catalog.",
    promoSlides: [
      {
        title: "Liqui Moly Top Tec 4200 5W-30 — 15% off",
        description: "Weekly engine oil deal with same-day dispatch for selected models.",
        action: "Browse oils"
      },
      {
        title: "MANN FILTER combo 3+1",
        description: "Buy air + oil + cabin filter and get one extra filter for free while stock lasts.",
        action: "See filters"
      },
      {
        title: "Brembo brake kit — free delivery",
        description: "Front disc + pad kits with free city delivery and fast order processing.",
        action: "Browse brakes"
      }
    ],
    highlights: [
      {title: "Brand code", caption: "units with exact stock"},
      {title: "Brands", caption: "catalog suppliers"},
      {title: "Categories", caption: "catalog groups"},
      {title: "Products", caption: "active catalog items"}
    ],
    hitsTag: "Product catalog",
    hitsTitle: "Products",
    allProducts: "All products",
    loading: "Loading catalog...",
    error: "Catalog failed to load. Demo products are shown.",
    brandsTitle: "Companies in stock",
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
    animatedPlaceholders: [
      "Найти MANN FILTER C 35 154",
      "Поиск по OEM: 06H115562",
      "Поиск по модели: Toyota Camry",
      "Поиск по категории: Фильтры"
    ],
    searchButton: "Найти товар",
    searchLoading: "Поиск...",
    searchEmpty: "Подходящих товаров не найдено.",
    quickTitle: "Категории",
    quickDescription: "Категории сгруппированы по данным каталога с backend.",
    allCategories: "Все",
    promoTag: "Реальное промо",
    promoTitle: "Актуальные акции недели",
    promoSubtitle: "Реальные предложения с ограниченным остатком и живой ценой.",
    promoSlides: [
      {
        title: "Liqui Moly Top Tec 4200 5W-30 — скидка 15%",
        description: "Недельная акция на моторное масло. Для части моделей доступна отправка в день заказа.",
        action: "Смотреть масла"
      },
      {
        title: "MANN FILTER набор 3+1",
        description: "Покупаешь воздушный, масляный и салонный фильтр — один фильтр получаешь в подарок.",
        action: "Смотреть фильтры"
      },
      {
        title: "Brembo brake kit — бесплатная доставка",
        description: "Комплекты диск + колодки с бесплатной доставкой по городу и быстрым оформлением.",
        action: "Раздел тормозов"
      }
    ],
    highlights: [
      {title: "Brand code", caption: "точный остаток на складе"},
      {title: "Бренды", caption: "поставщиков в каталоге"},
      {title: "Категории", caption: "разделов каталога"},
      {title: "Товары", caption: "активных позиций"}
    ],
    hitsTag: "Каталог товаров",
    hitsTitle: "Товары",
    allProducts: "Все товары",
    loading: "Загрузка каталога...",
    error: "Не удалось загрузить каталог. Показаны демонстрационные товары.",
    brandsTitle: "Марки в наличии",
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
  const [catalogStats, setCatalogStats] = useState<ProductCatalogStats | null>(null);
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
  const [searchSpotlight, setSearchSpotlight] = useState(true);
  const [typedPlaceholder, setTypedPlaceholder] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isDeletingPlaceholder, setIsDeletingPlaceholder] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const searchRequestRef = useRef(0);
  const copy = storeCopy[language];
  const placeholderPrototypes = useMemo(
    () => buildPlaceholderPrototypes(copy.animatedPlaceholders, language, categories, products),
    [copy.animatedPlaceholders, language, categories, products]
  );
  const isSearchInputEmpty = searchQuery.length === 0;

  useEffect(() => {
    void loadCatalogPage(0);
  }, [selectedCategory, catalogQuery]);

  useEffect(() => {
    void loadBrandImages();
    void loadCategories();
    void loadCatalogStats();

    const spotlightTimer = window.setTimeout(() => setSearchSpotlight(false), 2600);
    return () => window.clearTimeout(spotlightTimer);
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

  useEffect(() => {
    setTypedPlaceholder("");
    setPlaceholderIndex(0);
    setIsDeletingPlaceholder(false);
  }, [language]);

  useEffect(() => {
    if (!placeholderPrototypes.length) {
      return;
    }

    const currentVariant = placeholderPrototypes[placeholderIndex % placeholderPrototypes.length] ?? copy.searchPlaceholder;
    const typeSpeed = language === "ru" ? 48 : 44;
    const deleteSpeed = 24;
    const pauseAtEnd = 1150;

    const timeout = window.setTimeout(() => {
      if (!isDeletingPlaceholder) {
        if (typedPlaceholder.length < currentVariant.length) {
          setTypedPlaceholder(currentVariant.slice(0, typedPlaceholder.length + 1));
          return;
        }
        setIsDeletingPlaceholder(true);
        return;
      }

      if (typedPlaceholder.length > 0) {
        setTypedPlaceholder(currentVariant.slice(0, typedPlaceholder.length - 1));
        return;
      }

      setIsDeletingPlaceholder(false);
      setPlaceholderIndex((prev) => (prev + 1) % placeholderPrototypes.length);
    }, !isDeletingPlaceholder && typedPlaceholder.length === currentVariant.length ? pauseAtEnd : isDeletingPlaceholder ? deleteSpeed : typeSpeed);

    return () => window.clearTimeout(timeout);
  }, [typedPlaceholder, placeholderIndex, isDeletingPlaceholder, placeholderPrototypes, copy.searchPlaceholder, language]);

  async function loadCatalogPage(page: number) {
    try {
      setLoading(true);
      const data = await fetchCatalogProductsPage({
        page,
        size: 12,
        category: selectedCategory || undefined,
        query: catalogQuery || undefined
      });
      const safeProducts = Array.isArray(data?.content) ? data.content : [];
      const safePage = Number.isFinite(data?.page) ? data.page : page;
      const safeTotalPages = Number.isFinite(data?.totalPages) ? Math.max(1, data.totalPages) : 1;
      const safeTotalElements = Number.isFinite(data?.totalElements) ? data.totalElements : safeProducts.length;

      setProducts(safeProducts);
      setCurrentPage(safePage);
      setTotalPages(safeTotalPages);
      setTotalElements(safeTotalElements);
      if (!selectedCategory && !catalogQuery.trim()) {
        setOverallTotalElements(safeTotalElements);
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

  async function loadCatalogStats() {
    try {
      const data = await fetchCatalogStats();
      setCatalogStats(data);
    } catch {
      setCatalogStats(null);
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
    if (catalogStats) {
      return Math.max(0, catalogStats.totalProducts);
    }
    if (overallTotalElements > 0) {
      return overallTotalElements;
    }
    const categoriesTotal = categories.reduce((sum, category) => sum + (Number.isFinite(category.count) ? Math.max(0, category.count) : 0), 0);
    if (categoriesTotal > 0) {
      return categoriesTotal;
    }
    return totalElements;
  }, [catalogStats, overallTotalElements, categories, totalElements]);

  const highlights = useMemo(() => {
    const values = [
      formatCompactCount(catalogStats?.totalStockQuantity ?? 0, language),
      formatCompactCount(catalogStats?.totalBrands ?? 0, language),
      formatCompactCount(catalogStats?.totalCategories ?? 0, language),
      formatCompactCount(catalogStats?.totalProducts ?? 0, language)
    ];

    return copy.highlights.map((item, index) => ({
      ...item,
      value: values[index] ?? "0"
    }));
  }, [catalogStats, copy.highlights, language]);

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
        <motion.article
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="glass-card rounded-2xl border border-brand-500/22 p-6 sm:p-8 lg:p-10"
        >
        <span className="inline-flex items-center rounded-md border border-brand-500/30 bg-brand-500/10 px-2.5 py-1 text-[18px] uppercase tracking-[0.20em] text-brand-200">
          {copy.badge}
        </span>

          <p className="theme-text mt-4 max-w-2xl text-sm leading-relaxed sm:text-base">
            {copy.description}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr,auto]">
            <motion.div
                ref={searchContainerRef}
                className="group relative z-50 block rounded-[22px]"
                initial={{ opacity: 0, y: 24, scale: 0.965, rotateX: 8 }}
                animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -2, scale: 1.005 }}
            >
              <motion.div
                  className="pointer-events-none absolute -inset-[1px] rounded-[24px] bg-gradient-to-r from-brand-500/20 via-white/10 to-brand-400/20 blur-xl"
                  animate={{
                    opacity: [0.35, 0.7, 0.35],
                    scale: [1, 1.015, 1],
                  }}
                  transition={{
                    duration: 3.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
              />

              <motion.div
                  className="pointer-events-none absolute inset-0 rounded-[22px] bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  initial={{ x: "-130%", opacity: 0 }}
                  animate={
                    searchSpotlight
                        ? { x: ["-130%", "130%"], opacity: [0, 0.9, 0] }
                        : { x: "-130%", opacity: 0 }
                  }
                  transition={{
                    duration: 1.35,
                    ease: "easeInOut",
                  }}
              />

              {searchSpotlight && (
                  <>
                    <motion.span
                        className="pointer-events-none absolute -inset-1 rounded-[24px] border border-brand-400/50"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{
                          opacity: [0, 0.8, 0],
                          scale: [0.96, 1.02, 1.045],
                        }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </>
              )}

              <div className="relative overflow-hidden rounded-[22px]">
                <motion.div
                    className="pointer-events-none absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-brand-500/10 via-brand-400/5 to-transparent"
                    animate={{
                      opacity: [0.5, 0.85, 0.5],
                    }}
                    transition={{
                      duration: 2.4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                />

                <motion.div
                    initial={{ opacity: 0, x: -10, scale: 0.85 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ delay: 0.18, duration: 0.45, ease: "easeOut" }}
                    className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2"
                >
                  <motion.div
                      animate={{
                        rotate: [0, -10, 10, 0],
                        scale: [1, 1.12, 1],
                      }}
                      transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        repeatDelay: 4,
                        ease: "easeInOut",
                      }}
                  >
                    <Search className="theme-muted h-[16px] w-[16px]" />
                  </motion.div>
                </motion.div>

                {!searchQuery && (
                    <div className="pointer-events-none absolute inset-y-0 left-11 right-4 z-[2] flex items-center">
                    <span className="theme-muted truncate text-sm">
                      {typedPlaceholder}
                      <motion.span
                          className="ml-0.5 inline-block h-[1em] w-[1px] bg-current align-middle"
                          animate={{ opacity: [1, 0, 1] }}
                          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </span>
                    </div>
                )}

                <motion.input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    onFocus={() => {
                      if (searchResults.length > 0 || searchLoading) {
                        setSearchDropdownOpen(true);
                      }
                    }}
                    placeholder=""
                    initial={{
                      boxShadow: "0 0 0 rgba(0,0,0,0)",
                      backgroundPosition: "0% 50%",
                    }}
                    animate={
                      searchSpotlight
                          ? {
                            boxShadow: [
                              "0 0 0 rgba(0,0,0,0)",
                              "0 0 0 3px rgba(99,102,241,0.14)",
                              "0 0 22px rgba(59,130,246,0.18)",
                              "0 0 0 rgba(0,0,0,0)",
                            ],
                          }
                          : {
                            boxShadow: "0 0 0 rgba(0,0,0,0)",
                          }
                    }
                    transition={{
                      duration: searchSpotlight ? 1.25 : 0.25,
                      ease: "easeInOut",
                    }}
                    className="input-surface relative z-[1] w-full rounded-[22px] border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-4 text-sm  outline-none transition duration-300  focus:border-brand-400/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              {searchDropdownOpen && searchQuery.trim().length > 0 && (
                  <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.96, filter: "blur(8px)" }}
                      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="glass-card absolute left-0 right-0 top-[calc(100%+10px)] z-[70] max-h-[32rem] overflow-y-auto rounded-2xl border border-brand-500/30 p-2 shadow-2xl shadow-brand-950/20"
                  >
                    {searchLoading && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="theme-muted px-3 py-3 text-xs"
                        >
                          {copy.searchLoading}
                        </motion.p>
                    )}

                    {!searchLoading && searchResults.length === 0 && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="theme-muted px-3 py-3 text-xs"
                        >
                          {copy.searchEmpty}
                        </motion.p>
                    )}

                    {!searchLoading &&
                        searchResults.map((item, index) => (
                            <motion.button
                                key={item.id}
                                type="button"
                                onClick={() => openProduct(item.id)}
                                initial={{ opacity: 0, y: 10, scale: 0.985 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{
                                  delay: index * 0.04,
                                  duration: 0.24,
                                  ease: [0.22, 1, 0.36, 1],
                                }}
                                whileHover={{ x: 4, scale: 1.01 }}
                                whileTap={{ scale: 0.985 }}
                                className="tile-surface group/item flex w-full items-center justify-between rounded-xl border border-transparent px-3 py-2.5 text-left transition hover:border-brand-400/40 hover:bg-white/[0.04]"
                            >
                  <span className="min-w-0">
                    <span className="theme-heading block truncate text-sm transition group-hover/item:text-brand-100">
                      {item.name}
                    </span>
                    <span className="theme-muted block truncate text-xs">
                      {item.sku} · {item.brand || "OEM"}
                    </span>
                  </span>

                              <motion.span
                                  className="ml-3 flex-shrink-0 text-xs font-medium text-brand-200"
                                  whileHover={{ scale: 1.06 }}
                              >
                                {formatConvertedPrice(item.price, displayCurrency, currencyRates, language)}
                              </motion.span>
                            </motion.button>
                        ))}
                  </motion.div>
              )}
            </motion.div>

            <motion.button
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.18, duration: 0.45 }}
                type="button"
                onClick={applySearchFilter}
                className="relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-3 text-sm font-medium text-white"
            >
              <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: "-120%" }}
                  whileHover={{ x: "120%" }}
                  transition={{ duration: 0.7, ease: "easeInOut" }}
              />
              <span className="relative z-10">{copy.searchButton}</span>
              <motion.div
                  className="relative z-10"
                  whileHover={{ x: 3 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
              >
                <ArrowRight className="h-4 w-4" />
              </motion.div>
            </motion.button>
          </div>
        </motion.article>
      </section>


      <section id="promo" className="relative z-10 scroll-mt-28">
        <motion.div
          initial={{opacity: 0, y: 12}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true, amount: 0.2}}
          transition={{duration: 0.4}}
          className="glass-card rounded-2xl border border-brand-500/22 p-4 sm:p-6"
        >
          <p className="text-xs uppercase tracking-[0.18em] text-brand-300">{copy.promoTag}</p>
          <h3 className="theme-heading mt-1 text-xl font-semibold sm:text-2xl">{copy.promoTitle}</h3>
          <p className="theme-text mt-1 text-sm">{copy.promoSubtitle}</p>

          <Swiper
            modules={[Autoplay, Pagination]}
            className="promo-swiper mt-4"
            slidesPerView={1}
            spaceBetween={12}
            loop={copy.promoSlides.length > 1}
            autoplay={{delay: 4200, disableOnInteraction: false, pauseOnMouseEnter: true}}
            pagination={{clickable: true}}
          >
            {copy.promoSlides.map((slide, index) => (
              <SwiperSlide key={`${slide.title}-${index}`}>
                <motion.article
                  whileHover={{y: -2}}
                  className="relative overflow-hidden rounded-xl border border-brand-500/35 bg-gradient-to-br from-brand-600/20 via-brand-500/10 to-black/10 p-5 sm:p-7"
                >
                  <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-brand-500/25 blur-2xl" />
                  <div className="pointer-events-none absolute -bottom-14 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-brand-300/20 blur-2xl" />
                  <p className="theme-heading text-lg font-semibold sm:text-2xl">{slide.title}</p>
                  <p className="theme-text mt-2 max-w-2xl text-sm sm:text-base">{slide.description}</p>
                  <button
                    type="button"
                    onClick={() => document.getElementById("categories")?.scrollIntoView({behavior: "smooth", block: "start"})}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-brand-400/45 bg-brand-500/15 px-3 py-2 text-sm font-medium text-brand-100 transition hover:border-brand-300 hover:bg-brand-500/25"
                  >
                    {slide.action}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </motion.article>
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>
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
        {highlights.map((item, index) => {
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
                className="group inline-flex items-center gap-2 rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-2 text-sm font-medium text-brand-100 transition-all duration-200 hover:bg-brand-500/20 hover:border-brand-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              {copy.pagination.prev}
            </button>

            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
              {copy.pagination.page} {currentPage + 1} {copy.pagination.of} {totalPages}
            </div>

            <button
                type="button"
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage + 1 >= totalPages}
                className="group inline-flex items-center gap-2 rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-2 text-sm font-medium text-brand-100 transition-all duration-200 hover:bg-brand-500/20 hover:border-brand-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copy.pagination.next}
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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

function formatCompactCount(value: number, language: Language) {
  return new Intl.NumberFormat(language, {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1
  }).format(Math.max(0, value));
}

function buildPlaceholderPrototypes(
  basePlaceholders: string[],
  language: Language,
  categories: ProductCategorySummary[],
  products: Product[]
) {
  const localizedCategoryPrefix = language === "ru" ? "Категория:" : language === "en" ? "Category:" : "Kateqoriya:";
  const localizedBrandPrefix = language === "ru" ? "Бренд:" : language === "en" ? "Brand:" : "Brend:";
  const localizedSkuPrefix = language === "ru" ? "Brand code:" : language === "en" ? "Brand code:" : "Brand code:";

  const categorySamples = categories
    .slice(0, 2)
    .map((category) => `${localizedCategoryPrefix} ${category.name}`);
  const productSamples = products
    .slice(0, 2)
    .map((product) => {
      const brandLabel = product.brand?.trim() || "OEM";
      return `${localizedBrandPrefix} ${brandLabel} · ${localizedSkuPrefix} ${product.sku}`;
    });

  const merged = [...basePlaceholders, ...categorySamples, ...productSamples]
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  return Array.from(new Set(merged));
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
