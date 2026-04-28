import {
  fetchBrandImages,
  fetchCatalogProducts,
  fetchCatalogCategories,
  fetchCatalogStats,
  fetchCatalogProductsPage,
  fetchHeroSlides,
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
import {Autoplay, FreeMode} from "swiper/modules";
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
    promoEmpty: string;
    promoOpenProduct: string;
    heroCta: string;
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
    promoEmpty: "Hazırda aktiv endirimli məhsul yoxdur.",
    promoOpenProduct: "Məhsula bax",
    heroCta: "Kataloqa keç",
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
    promoEmpty: "There are no active discounted products right now.",
    promoOpenProduct: "View product",
    heroCta: "Open catalog",
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
    promoEmpty: "Сейчас нет активных товаров со скидкой.",
    promoOpenProduct: "Открыть товар",
    heroCta: "Перейти в каталог",
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
  const [catalogStats, setCatalogStats] = useState<ProductCatalogStats | null>(null);
  const [brandImages, setBrandImages] = useState<string[]>([]);
  const [heroSlides, setHeroSlides] = useState<string[]>([]);
  const [discountedProducts, setDiscountedProducts] = useState<Product[]>([]);
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
    void loadHeroSlides();
    void loadDiscountedProducts();
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

  async function loadHeroSlides() {
    try {
      const data = await fetchHeroSlides();
      setHeroSlides(data);
    } catch {
      setHeroSlides([]);
    }
  }

  async function loadDiscountedProducts() {
    try {
      const data = await fetchCatalogProducts();
      const items = (Array.isArray(data) ? data : [])
        .filter((item) => Boolean(item.hasDiscount) || (item.discountPercent ?? 0) > 0)
        .slice(0, 24);
      setDiscountedProducts(items);
    } catch {
      setDiscountedProducts([]);
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
  const promoProducts = useMemo(
    () => discountedProducts.filter((item) => item.active !== false),
    [discountedProducts]
  );
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
      <section id="hero-main" className="relative z-20 scroll-mt-28">
        <motion.div
          initial={{opacity: 0, y: 16}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.45}}
          className="glass-card overflow-hidden rounded-2xl border border-brand-500/25 p-0"
        >
          <Swiper
            modules={[Autoplay]}
            className="hero-main-swiper"
            slidesPerView={1}
            spaceBetween={0}
            loop={heroSlides.length > 1}
            autoplay={{delay: 3800, disableOnInteraction: false, pauseOnMouseEnter: true}}
          >
            {(heroSlides.length > 0 ? heroSlides : [null]).map((imageUrl, index) => (
              <SwiperSlide key={imageUrl ?? `hero-fallback-${index}`}>
                <article className="relative min-h-[21rem] overflow-hidden sm:min-h-[26rem] lg:min-h-[30rem]">
                  {imageUrl ? (
                    <img src={imageUrl} alt={`hero-slide-${index + 1}`} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-700/35 via-brand-600/20 to-black/20" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/25 dark:from-black/75 dark:via-black/55 dark:to-black/30" />
                  <div className="relative z-10 flex h-full max-w-2xl flex-col justify-end gap-3 p-6 sm:p-8 lg:p-10">
                    <span className="inline-flex w-fit items-center rounded-md border border-white/35 bg-black/30 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white">
                      {copy.badge}
                    </span>
                    <h2 className="text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">RICHSTOK</h2>
                    <p className="text-sm leading-relaxed text-zinc-100 sm:text-base">{copy.description}</p>
                    <button
                      type="button"
                      onClick={() => document.getElementById("catalog")?.scrollIntoView({behavior: "smooth", block: "start"})}
                      className="mt-1 inline-flex w-fit items-center gap-2 rounded-lg border border-brand-300/60 bg-brand-600/40 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600/55"
                    >
                      {copy.heroCta}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>
      </section>

      <section id="catalog" className="relative z-20 scroll-mt-28">
        <motion.article initial={{opacity: 0, y: 14}} animate={{opacity: 1, y: 0}} transition={{duration: 0.45}} className="glass-card rounded-2xl border border-brand-500/22 p-6 sm:p-8 lg:p-10">
          <span className="inline-flex items-center rounded-md border border-brand-500/30 bg-brand-500/10 px-2.5 py-1 text-[18px] uppercase tracking-[0.20em] text-brand-200">
            {copy.badge}
          </span>

          <p className="theme-text mt-4 max-w-2xl text-sm leading-relaxed sm:text-base">{copy.description}</p>

          <motion.div
            className="relative mt-6 grid gap-3 sm:grid-cols-[1fr,auto]"
            initial={{opacity: 0, y: 8}}
            animate={
              searchSpotlight
                ? {
                    opacity: 1,
                    y: 0,
                    boxShadow: [
                      "0 0 0 0 rgba(220, 38, 38, 0)",
                      "0 0 0 10px rgba(220, 38, 38, 0.2)",
                      "0 0 0 0 rgba(220, 38, 38, 0)"
                    ]
                  }
                : {opacity: 1, y: 0, boxShadow: "0 0 0 0 rgba(220, 38, 38, 0)"}
            }
            transition={searchSpotlight ? {duration: 1.1, repeat: 1, ease: "easeInOut"} : {duration: 0.2}}
          >
            {searchSpotlight && (
              <motion.span
                className="pointer-events-none absolute inset-0 -z-10 rounded-2xl border border-brand-400/50"
                initial={{opacity: 0}}
                animate={{opacity: [0.15, 0.55, 0.15]}}
                transition={{duration: 0.9, repeat: 2, ease: "easeInOut"}}
              />
            )}
            <div ref={searchContainerRef} className="relative z-50 block">
              <Search className="theme-muted pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                autoComplete="off"
                onFocus={() => {
                  if (searchResults.length > 0 || searchLoading) {
                    setSearchDropdownOpen(true);
                  }
                }}
                placeholder={typedPlaceholder || copy.searchPlaceholder}
                className={`input-surface w-full rounded-xl border py-3 pl-10 pr-3 text-sm outline-none transition focus:border-brand-400/60 ${
                  searchSpotlight ? "border-brand-400/75 shadow-[0_0_0_2px_rgba(220,38,38,0.2)]" : ""
                } relative z-10 placeholder:text-red-700/95 placeholder:opacity-100 dark:placeholder:text-red-300/95`}
              />
              {isSearchInputEmpty && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-10 right-3 top-1/2 z-[30] inline-flex -translate-y-1/2 items-center overflow-hidden text-sm font-medium text-[#991b1b] dark:text-[#fca5a5]"
                >
                  <span className="truncate">{typedPlaceholder || copy.searchPlaceholder}</span>
                  <span className="ml-0.5 inline-block h-4 w-px flex-shrink-0 animate-pulse bg-[#dc2626] dark:bg-[#fca5a5]" />
                </span>
              )}

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
                          {formatConvertedPrice(item.hasDiscount ? (item.discountedPrice ?? item.price) : item.price, displayCurrency, currencyRates, language)}
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
          </motion.div>
        </motion.article>
      </section>

      <section id="promo" className="relative z-10 scroll-mt-28">
        <motion.div
          initial={{opacity: 0, y: 12}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true, amount: 0.2}}
          transition={{duration: 0.4}}
          className="glass-card overflow-hidden rounded-2xl border border-brand-500/22 p-4 sm:p-6"
        >
          <p className="text-xs uppercase tracking-[0.18em] text-brand-300">{copy.promoTag}</p>
          <h3 className="theme-heading mt-1 text-xl font-semibold sm:text-2xl">{copy.promoTitle}</h3>
          <p className="theme-text mt-1 text-sm">{copy.promoSubtitle}</p>

          {promoProducts.length === 0 ? (
            <div className="mt-4 rounded-xl border border-brand-500/25 bg-brand-500/8 px-4 py-3 text-sm theme-text">
              {copy.promoEmpty}
            </div>
          ) : (
            <Swiper
              modules={[Autoplay, FreeMode]}
              className="promo-swiper mt-4"
              slidesPerView={1.02}
              spaceBetween={12}
              loop={promoProducts.length > 1}
              speed={7000}
              freeMode={{enabled: true, momentum: false}}
              autoplay={{delay: 0, disableOnInteraction: false, pauseOnMouseEnter: true}}
              breakpoints={{
                768: {slidesPerView: 2, spaceBetween: 14},
                1024: {slidesPerView: 2.4, spaceBetween: 16},
                1280: {slidesPerView: 3, spaceBetween: 18}
              }}
            >
              {promoProducts.map((item) => {
                const hasDiscount = Boolean(item.hasDiscount) || (item.discountPercent ?? 0) > 0;
                const discountPercent = Math.max(0, Math.min(100, item.discountPercent ?? 0));
                const effectivePrice = hasDiscount ? (item.discountedPrice ?? item.price) : item.price;
                return (
                  <SwiperSlide key={`promo-product-${item.id}`}>
                    <motion.article whileHover={{y: -2}} className="tile-surface flex h-full flex-col overflow-hidden rounded-xl border border-brand-500/30">
                      <div className="relative h-44 overflow-hidden border-b border-brand-500/20 bg-black/25">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-brand-200/75">RICHSTOK</div>
                        )}
                        {hasDiscount && (
                          <span className="absolute left-3 top-3 rounded-md border border-rose-400/40 bg-rose-500/25 px-2 py-1 text-[11px] font-semibold text-white">
                            -{discountPercent}%
                          </span>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col p-4">
                        <p className="theme-heading line-clamp-2 text-sm font-semibold">{item.name}</p>
                        <p className="theme-muted mt-1 text-xs">Brand code: {item.sku}</p>
                        <div className="mt-3 flex items-end gap-2">
                          {hasDiscount && (
                            <span className="theme-muted text-xs line-through">
                              {formatConvertedPrice(item.price, displayCurrency, currencyRates, language)}
                            </span>
                          )}
                          <span className="text-lg font-semibold text-brand-200">
                            {formatConvertedPrice(effectivePrice, displayCurrency, currencyRates, language)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => openProduct(item.id)}
                          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-brand-400/45 bg-brand-500/15 px-3 py-2 text-sm font-medium text-brand-100 transition hover:border-brand-300 hover:bg-brand-500/25"
                        >
                          {copy.promoOpenProduct}
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.article>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          )}
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
