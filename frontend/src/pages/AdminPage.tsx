import {createProduct, deleteProduct, fetchAdminProducts, importProductsExcel, updateProduct} from "@/api/client";
import AdminOrdersReportCard from "@/components/AdminOrdersReportCard";
import AdminUsersCard from "@/components/AdminUsersCard";
import type {DisplayCurrency} from "@/types/currency";
import type {Product, ProductBulkImportResponse, ProductPayload, StockState} from "@/types/product";
import type {Language} from "@/types/ui";
import {formatConvertedPrice} from "@/utils/currency";
import {AnimatePresence, motion} from "framer-motion";
import {BarChart3, Boxes, CheckCircle2, ChevronLeft, ChevronRight, CircleDollarSign, FileSpreadsheet, ImagePlus, Pencil, Search, Shield, Trash2, UploadCloud, X} from "lucide-react";
import type {ChangeEvent, ComponentType, FormEvent} from "react";
import {useEffect, useMemo, useState} from "react";

const initialForm: ProductPayload = {
  name: "",
  slug: "",
  sku: "",
  category: "",
  oemNumber: "",
  description: "",
  imageUrl: "",
  price: 0,
  stockQuantity: 0,
  stockState: "IN_STOCK",
  brand: "",
  model: "",
  unknownCount: false,
  deliveryDays: 0,
  active: true
};

const PRODUCTS_PER_PAGE = 20;
type AdminTab = "catalog" | "orders" | "orderManagement" | "users";

const adminCopy: Record<
  Language,
  {
    roomTag: string;
    title: string;
    subtitle: string;
    securityTag: string;
    securitySession: string;
    statCaptions: [string, string, string, string];
    tabs: Record<AdminTab, string>;
    formTitle: string;
    formSubtitle: string;
    fields: {
      name: string;
      slug: string;
      sku: string;
      category: string;
      oemNumber: string;
      model: string;
      brand: string;
      unknownCount: string;
      deliveryDays: string;
      price: string;
      stock: string;
      stockState: string;
      description: string;
      active: string;
    };
    imageUploadLabel: string;
    imageUploadHint: string;
    imageRemove: string;
    editTitle: string;
    editSubtitle: string;
    editButton: string;
    updateButton: string;
    updatingButton: string;
    cancelButton: string;
    clickToEditHint: string;
    stockStateOptions: Record<StockState, string>;
    saveButton: string;
    savingButton: string;
    catalogTitle: string;
    searchPlaceholder: string;
    pagination: {prev: string; next: string; page: string; items: string};
    loading: string;
    empty: string;
    deleteButton: string;
    unitShort: string;
    daysShort: string;
    importTitle: string;
    importSubtitle: string;
    importColumns: string;
    importButton: string;
    importingButton: string;
    importSuccess: string;
    importErrors: string;
    importCreated: string;
    importUpdated: string;
    importSkipped: string;
    errors: {load: string; save: string; update: string; delete: string; import: string; image: string};
  }
> = {
  az: {
    roomTag: "İdarə paneli",
    title: "Anbar idarəetmə paneli",
    subtitle: "Kataloq, qalıq və qiymətləri real vaxt interfeysində idarə et.",
    securityTag: "Təhlükəsizlik",
    securitySession: "Təsdiqlənmiş admin sessiyası",
    statCaptions: ["kataloqda", "ümumi qalıq", "anbar dəyəri", "aşağı stok"],
    tabs: {
      catalog: "Kataloq",
      orders: "Sifariş hesabatı",
      orderManagement: "Sifariş idarəetməsi",
      users: "İstifadəçilər"
    },
    formTitle: "Məhsul əlavə et",
    formSubtitle: "Manual əlavə və bulk import üçün eyni sahələr istifadə olunur.",
    fields: {
      name: "Ad",
      slug: "Slug (opsional)",
      sku: "Brand code / Artikul",
      category: "Kateqoriya",
      oemNumber: "OEM nömrəsi",
      brand: "Brend",
      unknownCount: "Dəqiq say məlum deyil (var / az var)",
      deliveryDays: "Çatdırılma günləri (GUN)",
      price: "Qiymət",
      stock: "Qalıq",
      stockState: "Stok statusu",
      description: "Təsvir",
      active: "Aktiv məhsul",
      model: "Model"
    },
    imageUploadLabel: "Məhsul şəkli",
    imageUploadHint: "JPG, PNG, WEBP və ya SVG yüklə.",
    imageRemove: "Şəkli sil",
    editTitle: "Məhsulu redaktə et",
    editSubtitle: "Ad, şəkil, qiymət və stok məlumatını yenilə.",
    editButton: "Redaktə",
    updateButton: "Yadda saxla",
    updatingButton: "Yenilənir...",
    cancelButton: "Bağla",
    clickToEditHint: "Məhsulu redaktə etmək üçün kartın üzərinə klik et.",
    stockStateOptions: {
      IN_STOCK: "Var",
      LOW_STOCK: "Az var",
      OUT_OF_STOCK: "Yoxdur"
    },
    saveButton: "Əlavə et",
    savingButton: "Yadda saxlanılır...",
    catalogTitle: "Məhsul kataloqu",
    searchPlaceholder: "Ad / slug / brand code üzrə axtarış",
    pagination: {
      prev: "Əvvəlki",
      next: "Növbəti",
      page: "Səhifə",
      items: "məhsul"
    },
    loading: "Yüklənir...",
    empty: "Heç nə tapılmadı.",
    deleteButton: "Sil",
    unitShort: "əd",
    daysShort: "gün",
    importTitle: "Excel ilə kütləvi əlavə",
    importSubtitle: "Yalnız .xlsx və .xls. Mövcud brand code olarsa məhsul yenilənəcək.",
    importColumns: "Sütunlar: MƏHSULUN ADI, BREND KODU, OEM KODU, BAKI, GANCA, GUN, QİYMƏT AZN.",
    importButton: "Excel yüklə",
    importingButton: "İdxal olunur...",
    importSuccess: "İdxal tamamlandı",
    importErrors: "Sətir xətaları",
    importCreated: "yaradıldı",
    importUpdated: "yeniləndi",
    importSkipped: "keçildi",
    errors: {
      load: "Admin panel üçün məhsulları yükləmək olmadı.",
      save: "Məhsul saxlanılmadı. Məlumatları yoxla.",
      update: "Məhsulu yeniləmək olmadı. Məlumatları yoxla.",
      delete: "Məhsulu silmək olmadı.",
      import: "Excel import alınmadı. Fayl strukturu və sütunları yoxla.",
      image: "Şəkil oxunmadı. Fərqli fayl seç."
    }
  },
  en: {
    roomTag: "Control Room",
    title: "Warehouse admin panel",
    subtitle: "Manage catalog, stock, and pricing in a real-time interface.",
    securityTag: "Security",
    securitySession: "Trusted admin session",
    statCaptions: ["in catalog", "total stock", "inventory value", "low stock"],
    tabs: {
      catalog: "Catalog",
      orders: "Orders report",
      orderManagement: "Order management",
      users: "Users"
    },
    formTitle: "Add product",
    formSubtitle: "Manual and bulk import use the same product fields.",
    fields: {
      name: "Name",
      slug: "Slug (optional)",
      sku: "Brand code",
      category: "Category",
      oemNumber: "OEM number",
      brand: "Brand",
      unknownCount: "Exact quantity is unknown (var / az var)",
      deliveryDays: "Delivery days (GUN)",
      price: "Price",
      stock: "Stock",
      stockState: "Stock state",
      description: "Description",
      active: "Active product",
      model: "Model"
    },
    imageUploadLabel: "Product image",
    imageUploadHint: "Upload JPG, PNG, WEBP or SVG.",
    imageRemove: "Remove image",
    editTitle: "Edit product",
    editSubtitle: "Update name, image, price, and stock details.",
    editButton: "Edit",
    updateButton: "Save changes",
    updatingButton: "Updating...",
    cancelButton: "Cancel",
    clickToEditHint: "Click any product card to edit it.",
    stockStateOptions: {
      IN_STOCK: "In stock",
      LOW_STOCK: "Low stock",
      OUT_OF_STOCK: "Out of stock"
    },
    saveButton: "Add product",
    savingButton: "Saving...",
    catalogTitle: "Product catalog",
    searchPlaceholder: "Search by name / slug / brand code",
    pagination: {
      prev: "Previous",
      next: "Next",
      page: "Page",
      items: "items"
    },
    loading: "Loading...",
    empty: "Nothing found.",
    deleteButton: "Delete",
    unitShort: "pcs",
    daysShort: "days",
    importTitle: "Bulk upload from Excel",
    importSubtitle: "Only .xlsx and .xls. Existing brand code will update product.",
    importColumns: "Columns: MƏHSULUN ADI, BREND KODU, OEM KODU, BAKI, GANCA, GUN, QİYMƏT AZN.",
    importButton: "Upload Excel",
    importingButton: "Importing...",
    importSuccess: "Import completed",
    importErrors: "Row errors",
    importCreated: "created",
    importUpdated: "updated",
    importSkipped: "skipped",
    errors: {
      load: "Failed to load products for admin panel.",
      save: "Failed to save product. Check the data.",
      update: "Failed to update product. Check the data.",
      delete: "Failed to delete product.",
      import: "Excel import failed. Check file structure and columns.",
      image: "Image could not be processed. Try another file."
    }
  },
  ru: {
    roomTag: "Control Room",
    title: "Админ панель склада",
    subtitle: "Управляй каталогом, остатками и ценами в realtime интерфейсе.",
    securityTag: "Безопасность",
    securitySession: "Проверенная admin-сессия",
    statCaptions: ["в каталоге", "общий остаток", "оценка склада", "низкий остаток"],
    tabs: {
      catalog: "Каталог",
      orders: "Отчет по заказам",
      orderManagement: "Управление заказами",
      users: "Пользователи"
    },
    formTitle: "Добавить товар",
    formSubtitle: "Ручное добавление и массовый импорт используют одинаковые поля.",
    fields: {
      name: "Название",
      slug: "Slug (опционально)",
      sku: "Brand code / Артикул",
      category: "Категория",
      oemNumber: "OEM номер",
      brand: "Бренд",
      unknownCount: "Точное количество неизвестно (var / az var)",
      deliveryDays: "Срок доставки, дней (GUN)",
      price: "Цена",
      stock: "Остаток",
      model: "Модель",
      stockState: "Статус наличия",
      description: "Описание",
      active: "Активный товар"
    },
    imageUploadLabel: "Фото товара",
    imageUploadHint: "Загрузи JPG, PNG, WEBP или SVG.",
    imageRemove: "Удалить фото",
    editTitle: "Редактирование товара",
    editSubtitle: "Измени название, картинку, цену и остатки.",
    editButton: "Изменить",
    updateButton: "Сохранить",
    updatingButton: "Обновление...",
    cancelButton: "Отмена",
    clickToEditHint: "Кликни по карточке товара, чтобы открыть редактирование.",
    stockStateOptions: {
      IN_STOCK: "В наличии",
      LOW_STOCK: "Мало",
      OUT_OF_STOCK: "Нет в наличии"
    },
    saveButton: "Добавить",
    savingButton: "Сохранение...",
    catalogTitle: "Каталог товаров",
    searchPlaceholder: "Поиск по названию / slug / brand code",
    pagination: {
      prev: "Назад",
      next: "Вперед",
      page: "Страница",
      items: "товаров"
    },
    loading: "Загрузка...",
    empty: "Ничего не найдено.",
    deleteButton: "Удалить",
    unitShort: "шт",
    daysShort: "дн.",
    importTitle: "Массовая загрузка из Excel",
    importSubtitle: "Поддержка .xlsx и .xls. При существующем brand code товар обновляется.",
    importColumns: "Колонки: MƏHSULUN ADI, BREND KODU, OEM KODU, BAKI, GANCA, GUN, QİYMƏT AZN.",
    importButton: "Загрузить Excel",
    importingButton: "Импорт...",
    importSuccess: "Импорт завершен",
    importErrors: "Ошибки по строкам",
    importCreated: "создано",
    importUpdated: "обновлено",
    importSkipped: "пропущено",
    errors: {
      load: "Не удалось загрузить товары для админ панели.",
      save: "Не удалось сохранить товар. Проверьте данные.",
      update: "Не удалось обновить товар. Проверьте данные.",
      delete: "Не удалось удалить товар.",
      import: "Не удалось выполнить импорт Excel. Проверьте структуру файла и колонки.",
      image: "Не удалось обработать изображение. Выбери другой файл."
    }
  }
};

const adminTabs: Array<{id: AdminTab; icon: typeof Boxes}> = [
  {id: "catalog", icon: Boxes},
  {id: "orders", icon: BarChart3},
  {id: "orderManagement", icon: CheckCircle2},
  {id: "users", icon: Shield}
];

type AdminPageProps = {
  language: Language;
  displayCurrency: DisplayCurrency;
  currencyRates: Record<string, number>;
};

export default function AdminPage({language, displayCurrency, currencyRates}: AdminPageProps) {
  const copy = adminCopy[language];
  const [activeTab, setActiveTab] = useState<AdminTab>("catalog");
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductPayload>(initialForm);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ProductBulkImportResponse | null>(null);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ProductPayload | null>(null);

  useEffect(() => {
    void loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      const data = await fetchAdminProducts();
      setProducts(data);
      setError(null);
    } catch {
      setError(copy.errors.load);
    } finally {
      setLoading(false);
    }
  }

  function openEditProduct(product: Product) {
    setEditingProductId(product.id);
    setEditForm(toEditablePayload(product));
  }

  function closeEditProduct() {
    setEditingProductId(null);
    setEditForm(null);
  }

  async function handleImageSelected(event: ChangeEvent<HTMLInputElement>, mode: "create" | "edit" = "create") {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    try {
      const optimizedImage = await createOptimizedImageDataUrl(file);
      if (mode === "edit") {
        setEditForm((prev) => (prev ? {...prev, imageUrl: optimizedImage} : prev));
      } else {
        setForm((prev) => ({...prev, imageUrl: optimizedImage}));
      }
      setError(null);
    } catch {
      setError(copy.errors.image);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      setSaving(true);
      await createProduct(prepareProductPayload(form));
      setForm(initialForm);
      await loadProducts();
    } catch {
      setError(copy.errors.save);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateSubmit(event: FormEvent) {
    event.preventDefault();
    if (!editForm || editingProductId == null) {
      return;
    }
    try {
      setUpdating(true);
      await updateProduct(editingProductId, prepareProductPayload(editForm));
      closeEditProduct();
      await loadProducts();
    } catch {
      setError(copy.errors.update);
    } finally {
      setUpdating(false);
    }
  }

  async function handleExcelImport() {
    if (!excelFile) {
      return;
    }
    try {
      setImporting(true);
      const result = await importProductsExcel(excelFile);
      setImportResult(result);
      await loadProducts();
    } catch {
      setError(copy.errors.import);
    } finally {
      setImporting(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteProduct(id);
      await loadProducts();
    } catch {
      setError(copy.errors.delete);
    }
  }

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return products;
    }
    return products.filter((product) => {
      return [
        product.name,
        product.slug,
        product.sku,
        product.category,
        product.unknownCount ? "unknown var az var" : "",
        String(product.deliveryDays ?? "")
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [products, query]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const currentPageStart = filteredProducts.length === 0 ? 0 : (currentPage - 1) * PRODUCTS_PER_PAGE + 1;
  const currentPageEnd = Math.min(currentPage * PRODUCTS_PER_PAGE, filteredProducts.length);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalUnits = products.reduce((sum, product) => sum + product.stockQuantity, 0);
    const inventoryValue = products.reduce((sum, product) => sum + product.stockQuantity * product.price, 0);
    const lowStock = products.filter((product) => product.stockState === "LOW_STOCK").length;
    return {totalProducts, totalUnits, inventoryValue, lowStock};
  }, [products]);

  return (
    <motion.section
      key="admin"
      initial={{opacity: 0, y: 18}}
      animate={{opacity: 1, y: 0}}
      exit={{opacity: 0, y: -10}}
      transition={{duration: 0.35}}
      className="space-y-6"
    >
      <div className="glass-card flex flex-wrap items-center justify-between gap-4 rounded-3xl p-6">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-brand-200">{copy.roomTag}</p>
          <h1 className="theme-heading mt-1 text-3xl font-semibold">{copy.title}</h1>
          <p className="theme-text mt-2 text-sm">{copy.subtitle}</p>
        </div>
        {/*<div className="rounded-2xl border border-brand-300/30 bg-brand-500/15 px-4 py-3 text-right">*/}
        {/*  <p className="text-xs uppercase text-brand-200">{copy.securityTag}</p>*/}
        {/*  <p className="theme-heading mt-1 inline-flex items-center gap-2 text-sm">*/}
        {/*    <Shield className="h-4 w-4" />*/}
        {/*    {copy.securitySession}*/}
        {/*  </p>*/}
        {/*</div>*/}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Brand code" value={String(stats.totalProducts)} caption={copy.statCaptions[0]} icon={Boxes} />
        <StatCard title="Units" value={String(stats.totalUnits)} caption={copy.statCaptions[1]} icon={BarChart3} />
        <StatCard title="Value" value={formatConvertedPrice(stats.inventoryValue, displayCurrency, currencyRates, language)} caption={copy.statCaptions[2]} icon={CircleDollarSign} />
        <StatCard title="Low" value={String(stats.lowStock)} caption={copy.statCaptions[3]} icon={Shield} />
      </div>

      <section className="glass-card rounded-2xl p-3">
        <div className="grid gap-2 sm:grid-cols-4">
          {adminTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-gradient-to-r from-brand-600 to-pulse-500 text-white"
                    : "theme-text border border-white/12 hover:border-brand-400/40"
                }`}
              >
                <Icon className="h-4 w-4" />
                {copy.tabs[tab.id]}
              </button>
            );
          })}
        </div>
      </section>

      <AnimatePresence mode="wait">
        {activeTab === "catalog" && (
          <motion.section
            key="admin-tab-catalog"
            initial={{opacity: 0, y: 8}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -8}}
            transition={{duration: 0.25}}
            className="grid gap-6 xl:grid-cols-[390px,1fr]"
          >
            <motion.form initial={{opacity: 0, x: -14}} animate={{opacity: 1, x: 0}} transition={{duration: 0.4}} onSubmit={handleSubmit} className="glass-card rounded-3xl p-5 sm:p-6">
              <h2 className="theme-heading text-xl font-semibold">{copy.formTitle}</h2>
              <p className="theme-text mb-4 mt-1 text-sm">{copy.formSubtitle}</p>

              <div className="space-y-3">
                <Input label={copy.fields.name} value={form.name} onChange={(value) => setForm((prev) => ({...prev, name: value}))} />
                <Input label={copy.fields.slug} value={form.slug} onChange={(value) => setForm((prev) => ({...prev, slug: value}))} />
                <Input label={copy.fields.sku} value={form.sku} onChange={(value) => setForm((prev) => ({...prev, sku: value}))} />
                <Input label={copy.fields.category} value={form.category} onChange={(value) => setForm((prev) => ({...prev, category: value}))} />
                <Input label={copy.fields.oemNumber} value={form.oemNumber} onChange={(value) => setForm((prev) => ({...prev, oemNumber: value}))} />
                <Input label={copy.fields.brand} value={form.brand} onChange={(value) => setForm((prev) => ({...prev, brand: value}))} />
                <Input label={copy.fields.model} value={form.model} onChange={(value) => setForm((prev) => ({...prev, model: value}))} />
                <label className="theme-text flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(form.unknownCount)}
                    onChange={(event) => setForm((prev) => ({...prev, unknownCount: event.target.checked}))}
                    className="accent-brand-500"
                  />
                  {copy.fields.unknownCount}
                </label>
                <Input
                  label={copy.fields.deliveryDays}
                  type="number"
                  value={String(form.deliveryDays)}
                  onChange={(value) => setForm((prev) => ({...prev, deliveryDays: Number(value || 0)}))}
                />
                <label className="block text-sm">
                  <span className="theme-text mb-1 block">{copy.imageUploadLabel}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="input-surface inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm">
                      <ImagePlus className="h-4 w-4 text-brand-300" />
                      <span className="theme-text">{copy.imageUploadHint}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={(event) => {
                          void handleImageSelected(event);
                        }}
                      />
                    </label>
                    {form.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({...prev, imageUrl: ""}))}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs theme-text transition hover:border-brand-300"
                      >
                        <X className="h-3.5 w-3.5" />
                        {copy.imageRemove}
                      </button>
                    )}
                  </div>
                  {form.imageUrl && (
                    <div className="mt-2 h-24 w-24 overflow-hidden rounded-lg border border-white/10 bg-black/25 p-1">
                      <img src={form.imageUrl} alt={form.name || "product preview"} className="h-full w-full rounded object-contain" />
                    </div>
                  )}
                </label>

                <Input
                  label={copy.fields.price}
                  type="number"
                  value={String(form.price)}
                  onChange={(value) => setForm((prev) => ({...prev, price: Number(value)}))}
                />
                <Input
                  label={copy.fields.stock}
                  type="number"
                  value={String(form.stockQuantity)}
                  onChange={(value) => setForm((prev) => ({...prev, stockQuantity: Number(value)}))}
                />
                <label className="block text-sm">
                  <span className="theme-text mb-1 block">{copy.fields.stockState}</span>
                  <select
                    value={form.stockState}
                    onChange={(event) => setForm((prev) => ({...prev, stockState: event.target.value as StockState}))}
                    className="input-surface w-full rounded-xl border px-3 py-2 outline-none transition focus:border-brand-300"
                  >
                    <option value="IN_STOCK">{copy.stockStateOptions.IN_STOCK}</option>
                    <option value="LOW_STOCK">{copy.stockStateOptions.LOW_STOCK}</option>
                    <option value="OUT_OF_STOCK">{copy.stockStateOptions.OUT_OF_STOCK}</option>
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="theme-text mb-1 block">{copy.fields.description}</span>
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm((prev) => ({...prev, description: event.target.value}))}
                    className="input-surface w-full rounded-xl border px-3 py-2 outline-none transition focus:border-brand-300"
                    rows={3}
                  />
                </label>
                <label className="theme-text flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) => setForm((prev) => ({...prev, active: event.target.checked}))}
                    className="accent-brand-500"
                  />
                  {copy.fields.active}
                </label>
                <motion.button
                  whileTap={{scale: 0.98}}
                  disabled={saving}
                  className="w-full rounded-xl bg-gradient-to-r from-brand-500 to-pulse-500 px-4 py-2.5 font-medium text-white shadow-glow transition-opacity hover:opacity-90 disabled:opacity-70"
                  type="submit"
                >
                  {saving ? copy.savingButton : copy.saveButton}
                </motion.button>
              </div>
            </motion.form>

            <div className="space-y-4">
              <motion.article initial={{opacity: 0, y: 12}} animate={{opacity: 1, y: 0}} transition={{duration: 0.35}} className="glass-card rounded-3xl p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="theme-heading text-xl font-semibold">{copy.importTitle}</h3>
                    <p className="theme-text mt-1 text-sm">{copy.importSubtitle}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.12em] text-brand-200">{copy.importColumns}</p>
                  </div>
                  <FileSpreadsheet className="h-7 w-7 text-brand-300" />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <label className="input-surface inline-flex max-w-full cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm">
                    <UploadCloud className="h-4 w-4 text-brand-300" />
                    <span className="theme-text truncate">{excelFile ? excelFile.name : ".xlsx / .xls"}</span>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(event) => setExcelFile(event.target.files?.[0] ?? null)}
                    />
                  </label>
                  <button
                    type="button"
                    disabled={!excelFile || importing}
                    onClick={() => void handleExcelImport()}
                    className="rounded-xl bg-gradient-to-r from-brand-600 to-pulse-500 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                  >
                    {importing ? copy.importingButton : copy.importButton}
                  </button>
                </div>

                {importResult && (
                  <div className="mt-4 space-y-2">
                    <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                      {copy.importSuccess}: {copy.importCreated} {importResult.created}, {copy.importUpdated} {importResult.updated}, {copy.importSkipped} {importResult.skipped}
                    </p>
                    {importResult.errors.length > 0 && (
                      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                        <p className="mb-2 text-sm font-medium text-amber-100">{copy.importErrors}</p>
                        <ul className="theme-text max-h-28 space-y-1 overflow-auto text-xs">
                          {importResult.errors.map((item) => (
                            <li key={item}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </motion.article>

              <motion.div initial={{opacity: 0, x: 14}} animate={{opacity: 1, x: 0}} transition={{duration: 0.4, delay: 0.05}} className="glass-card rounded-3xl p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="theme-heading text-xl font-semibold">{copy.catalogTitle}</h2>
                  <div className="relative w-full max-w-xs">
                    <Search className="theme-muted pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                    <input
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder={copy.searchPlaceholder}
                      className="input-surface w-full rounded-xl border py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand-300"
                    />
                  </div>
                </div>

                {loading && <p className="theme-text mt-4">{copy.loading}</p>}
                {!loading && error && <p className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-100">{error}</p>}
                {!loading && !error && filteredProducts.length === 0 && <p className="theme-text mt-4">{copy.empty}</p>}
                {!loading && !error && filteredProducts.length > 0 && <p className="theme-muted mt-3 text-xs">{copy.clickToEditHint}</p>}

                {!loading && !error && filteredProducts.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <AnimatePresence initial={false}>
                      {paginatedProducts.map((product) => (
                        <motion.div
                          key={product.id}
                          initial={{opacity: 0, y: 14}}
                          animate={{opacity: 1, y: 0}}
                          exit={{opacity: 0, x: 12}}
                          transition={{duration: 0.25}}
                          className="tile-surface cursor-pointer rounded-2xl p-4"
                          onClick={() => openEditProduct(product)}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/30 p-1">
                                {product.imageUrl ? (
                                  <img src={product.imageUrl} alt={product.name} className="h-full w-full rounded object-contain" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center rounded bg-black/20">
                                    <ImagePlus className="h-4 w-4 text-brand-300/70" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="theme-heading truncate font-medium">{product.name}</p>
                                <p className="theme-muted truncate text-xs">
                                  slug: {product.slug} · brand code: {product.sku}
                                </p>
                                <p className="theme-text mt-1 text-sm">
                                  {product.category} · {product.oemNumber || "OEM"} · {formatConvertedPrice(product.price, displayCurrency, currencyRates, language)} · {product.stockQuantity} {copy.unitShort} · {copy.stockStateOptions[product.stockState]} · {product.brand || "OEM"} · {product.deliveryDays ?? "—"} {copy.daysShort} {product.unknownCount ? "· var / az var" : ""}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileTap={{scale: 0.96}}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openEditProduct(product);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-400/35 bg-brand-500/12 px-3 py-1.5 text-sm text-brand-100 transition hover:bg-brand-500/20"
                                type="button"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                {copy.editButton}
                              </motion.button>
                              <motion.button
                                whileTap={{scale: 0.96}}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handleDelete(product.id);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/35 bg-rose-500/10 px-3 py-1.5 text-sm text-rose-100 transition hover:bg-rose-500/20"
                                type="button"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                {copy.deleteButton}
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
                      <p className="theme-muted text-xs">
                        {currentPageStart}-{currentPageEnd} / {filteredProducts.length} {copy.pagination.items}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                          disabled={currentPage <= 1}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-brand-500/35 bg-brand-500/12 px-3.5 py-2 text-sm font-semibold text-brand-100 shadow-[0_8px_20px_rgba(0,0,0,0.25)] transition hover:border-brand-400 hover:bg-brand-500/22 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          {copy.pagination.prev}
                        </button>
                        <p className="rounded-xl border border-white/12 bg-brand-500/8 px-3 py-2 text-xs font-medium theme-text">
                          {copy.pagination.page} {currentPage} / {totalPages}
                        </p>
                        <button
                          type="button"
                          onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                          disabled={currentPage >= totalPages}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-brand-500/35 bg-brand-500/12 px-3.5 py-2 text-sm font-semibold text-brand-100 shadow-[0_8px_20px_rgba(0,0,0,0.25)] transition hover:border-brand-400 hover:bg-brand-500/22 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          {copy.pagination.next}
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.section>
        )}

        {activeTab === "orders" && (
          <motion.section
            key="admin-tab-orders"
            initial={{opacity: 0, y: 8}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -8}}
            transition={{duration: 0.25}}
          >
            <AdminOrdersReportCard language={language} displayCurrency={displayCurrency} currencyRates={currencyRates} mode="report" />
          </motion.section>
        )}

        {activeTab === "orderManagement" && (
          <motion.section
            key="admin-tab-orders-management"
            initial={{opacity: 0, y: 8}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -8}}
            transition={{duration: 0.25}}
          >
            <AdminOrdersReportCard language={language} displayCurrency={displayCurrency} currencyRates={currencyRates} mode="management" />
          </motion.section>
        )}

        {activeTab === "users" && (
          <motion.section
            key="admin-tab-users"
            initial={{opacity: 0, y: 8}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -8}}
            transition={{duration: 0.25}}
          >
            <AdminUsersCard language={language} />
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editForm && editingProductId !== null && (
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 py-6"
            onClick={closeEditProduct}
          >
            <motion.form
              initial={{opacity: 0, y: 20, scale: 0.98}}
              animate={{opacity: 1, y: 0, scale: 1}}
              exit={{opacity: 0, y: 10, scale: 0.98}}
              transition={{duration: 0.2}}
              onSubmit={handleUpdateSubmit}
              onClick={(event) => event.stopPropagation()}
              className="glass-card max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-3xl p-5 sm:p-6"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="theme-heading text-xl font-semibold">{copy.editTitle}</h3>
                  <p className="theme-text mt-1 text-sm">{copy.editSubtitle}</p>
                  <p className="theme-muted mt-1 text-xs">
                    Brand code: {editForm.sku} · {editForm.category}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeEditProduct}
                  className="rounded-lg border border-white/15 p-2 theme-text transition hover:border-brand-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <Input label={copy.fields.name} value={editForm.name} onChange={(value) => setEditForm((prev) => (prev ? {...prev, name: value} : prev))} />
                <Input
                  label={copy.fields.price}
                  type="number"
                  value={String(editForm.price)}
                  onChange={(value) => setEditForm((prev) => (prev ? {...prev, price: Number(value || 0)} : prev))}
                />
                <Input
                  label={copy.fields.stock}
                  type="number"
                  value={String(editForm.stockQuantity)}
                  onChange={(value) => setEditForm((prev) => (prev ? {...prev, stockQuantity: Number(value || 0)} : prev))}
                />
                <label className="theme-text flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(editForm.unknownCount)}
                    onChange={(event) => setEditForm((prev) => (prev ? {...prev, unknownCount: event.target.checked} : prev))}
                    className="accent-brand-500"
                  />
                  {copy.fields.unknownCount}
                </label>
                <Input
                  label={copy.fields.deliveryDays}
                  type="number"
                  value={String(editForm.deliveryDays)}
                  onChange={(value) => setEditForm((prev) => (prev ? {...prev, deliveryDays: Number(value || 0)} : prev))}
                />
                <label className="block text-sm">
                  <span className="theme-text mb-1 block">{copy.fields.stockState}</span>
                  <select
                    value={editForm.stockState}
                    onChange={(event) => setEditForm((prev) => (prev ? {...prev, stockState: event.target.value as StockState} : prev))}
                    className="input-surface w-full rounded-xl border px-3 py-2 outline-none transition focus:border-brand-300"
                  >
                    <option value="IN_STOCK">{copy.stockStateOptions.IN_STOCK}</option>
                    <option value="LOW_STOCK">{copy.stockStateOptions.LOW_STOCK}</option>
                    <option value="OUT_OF_STOCK">{copy.stockStateOptions.OUT_OF_STOCK}</option>
                  </select>
                </label>

                <label className="block text-sm">
                  <span className="theme-text mb-1 block">{copy.imageUploadLabel}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="input-surface inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm">
                      <ImagePlus className="h-4 w-4 text-brand-300" />
                      <span className="theme-text">{copy.imageUploadHint}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={(event) => {
                          void handleImageSelected(event, "edit");
                        }}
                      />
                    </label>
                    {editForm.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setEditForm((prev) => (prev ? {...prev, imageUrl: ""} : prev))}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs theme-text transition hover:border-brand-300"
                      >
                        <X className="h-3.5 w-3.5" />
                        {copy.imageRemove}
                      </button>
                    )}
                  </div>
                  {editForm.imageUrl && (
                    <div className="mt-2 h-24 w-24 overflow-hidden rounded-lg border border-white/10 bg-black/25 p-1">
                      <img src={editForm.imageUrl} alt={editForm.name || "product preview"} className="h-full w-full rounded object-contain" />
                    </div>
                  )}
                </label>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEditProduct}
                  className="rounded-xl border border-white/20 px-4 py-2 text-sm theme-text transition hover:border-brand-300"
                >
                  {copy.cancelButton}
                </button>
                <motion.button
                  whileTap={{scale: 0.98}}
                  disabled={updating}
                  className="rounded-xl bg-gradient-to-r from-brand-500 to-pulse-500 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-70"
                  type="submit"
                >
                  {updating ? copy.updatingButton : copy.updateButton}
                </motion.button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

async function createOptimizedImageDataUrl(file: File) {
  const source = await readFileAsDataUrl(file);

  if (file.type === "image/svg+xml") {
    return source;
  }

  const image = await loadImageFromDataUrl(source);
  const maxSide = 960;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext("2d");
  if (!context) {
    return source;
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
  return canvas.toDataURL(outputType, outputType === "image/png" ? undefined : 0.86);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function loadImageFromDataUrl(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = dataUrl;
  });
}

function prepareProductPayload(payload: ProductPayload): ProductPayload {
  const normalizedStock = Math.max(0, Number.isFinite(payload.stockQuantity) ? payload.stockQuantity : 0);

  return {
    ...payload,
    stockQuantity: normalizedStock,
    unknownCount: Boolean(payload.unknownCount)
  };
}

function toEditablePayload(product: Product): ProductPayload {
  return {
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    category: product.category,
    oemNumber: product.oemNumber ?? "",
    description: product.description ?? "",
    imageUrl: product.imageUrl ?? "",
    price: product.price,
    stockQuantity: product.stockQuantity,
    stockState: product.stockState,
    brand: product.brand ?? "",
    model: product.model ?? "",
    unknownCount: Boolean(product.unknownCount),
    deliveryDays: product.deliveryDays ?? 0,
    active: product.active
  };
}

type InputProps = {
  label: string;
  type?: "text" | "number";
  value: string;
  onChange: (value: string) => void;
};

function Input({label, type = "text", value, onChange}: InputProps) {
  return (
    <label className="block text-sm">
      <span className="theme-text mb-1 block">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="input-surface w-full rounded-xl border px-3 py-2 outline-none transition focus:border-brand-300" />
    </label>
  );
}

type StatCardProps = {
  title: string;
  value: string;
  caption: string;
  icon: ComponentType<{className?: string}>;
};

function StatCard({title, value, caption, icon: Icon}: StatCardProps) {
  return (
    <motion.article initial={{opacity: 0, y: 12}} animate={{opacity: 1, y: 0}} transition={{duration: 0.35}} className="glass-card rounded-2xl p-4">
      <Icon className="h-5 w-5 text-brand-200" />
      <p className="theme-muted mt-3 text-xs uppercase tracking-[0.17em]">{title}</p>
      <p className="theme-heading mt-1 text-2xl font-semibold">{value}</p>
      <p className="theme-text text-xs">{caption}</p>
    </motion.article>
  );
}
