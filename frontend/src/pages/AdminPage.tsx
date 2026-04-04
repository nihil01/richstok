import {createProduct, deleteProduct, fetchAdminProducts} from "@/api/client";
import type {Product, ProductPayload} from "@/types/product";
import type {Language} from "@/types/ui";
import {AnimatePresence, motion} from "framer-motion";
import {BarChart3, Boxes, CircleDollarSign, Search, Shield, Trash2} from "lucide-react";
import type {ComponentType, FormEvent} from "react";
import {useEffect, useMemo, useState} from "react";

const initialForm: ProductPayload = {
  name: "",
  slug: "",
  description: "",
  price: 0,
  stockQuantity: 0,
  brand: "",
  active: true
};

const adminCopy: Record<
  Language,
  {
    roomTag: string;
    title: string;
    subtitle: string;
    securityTag: string;
    securitySession: string;
    statCaptions: [string, string, string, string];
    formTitle: string;
    formSubtitle: string;
    fields: {name: string; slug: string; brand: string; price: string; stock: string; description: string; active: string};
    saveButton: string;
    savingButton: string;
    catalogTitle: string;
    searchPlaceholder: string;
    loading: string;
    empty: string;
    deleteButton: string;
    unitShort: string;
    errors: {load: string; save: string; delete: string};
  }
> = {
  az: {
    roomTag: "İdarə paneli",
    title: "Anbar idarəetmə paneli",
    subtitle: "Kataloq, qalıq və qiymətləri real vaxt interfeysində idarə et.",
    securityTag: "Təhlükəsizlik",
    securitySession: "Təsdiqlənmiş admin sessiyası",
    statCaptions: ["kataloqda", "ümumi qalıq", "anbar dəyəri", "aşağı stok"],
    formTitle: "Məhsul əlavə et",
    formSubtitle: "Sahələri doldur — kart dərhal siyahıda görünəcək.",
    fields: {
      name: "Ad",
      slug: "Slug",
      brand: "Brend",
      price: "Qiymət",
      stock: "Qalıq",
      description: "Təsvir",
      active: "Aktiv məhsul"
    },
    saveButton: "Əlavə et",
    savingButton: "Yadda saxlanılır...",
    catalogTitle: "Məhsul kataloqu",
    searchPlaceholder: "Ad/slug üzrə axtarış",
    loading: "Yüklənir...",
    empty: "Heç nə tapılmadı.",
    deleteButton: "Sil",
    unitShort: "əd",
    errors: {
      load: "Admin panel üçün məhsulları yükləmək olmadı.",
      save: "Məhsul saxlanılmadı. Məlumatları yoxla.",
      delete: "Məhsulu silmək olmadı."
    }
  },
  en: {
    roomTag: "Control Room",
    title: "Warehouse admin panel",
    subtitle: "Manage catalog, stock, and pricing in a real-time interface.",
    securityTag: "Security",
    securitySession: "Trusted admin session",
    statCaptions: ["in catalog", "total stock", "inventory value", "low stock"],
    formTitle: "Add product",
    formSubtitle: "Fill in fields — card appears in the list instantly.",
    fields: {
      name: "Name",
      slug: "Slug",
      brand: "Brand",
      price: "Price",
      stock: "Stock",
      description: "Description",
      active: "Active product"
    },
    saveButton: "Add product",
    savingButton: "Saving...",
    catalogTitle: "Product catalog",
    searchPlaceholder: "Search by name/slug",
    loading: "Loading...",
    empty: "Nothing found.",
    deleteButton: "Delete",
    unitShort: "pcs",
    errors: {
      load: "Failed to load products for admin panel.",
      save: "Failed to save product. Check the data.",
      delete: "Failed to delete product."
    }
  },
  ru: {
    roomTag: "Control Room",
    title: "Админ панель склада",
    subtitle: "Управляй каталогом, остатками и ценами в realtime интерфейсе.",
    securityTag: "Безопасность",
    securitySession: "Проверенная admin-сессия",
    statCaptions: ["в каталоге", "общий остаток", "оценка склада", "низкий остаток"],
    formTitle: "Добавить товар",
    formSubtitle: "Заполни поля — карточка сразу появится в списке.",
    fields: {
      name: "Название",
      slug: "Slug",
      brand: "Бренд",
      price: "Цена",
      stock: "Остаток",
      description: "Описание",
      active: "Активный товар"
    },
    saveButton: "Добавить",
    savingButton: "Сохранение...",
    catalogTitle: "Каталог товаров",
    searchPlaceholder: "Поиск по названию/slug",
    loading: "Загрузка...",
    empty: "Ничего не найдено.",
    deleteButton: "Удалить",
    unitShort: "шт",
    errors: {
      load: "Не удалось загрузить товары для админ панели.",
      save: "Не удалось сохранить товар. Проверьте данные.",
      delete: "Не удалось удалить товар."
    }
  }
};

type AdminPageProps = {
  language: Language;
};

export default function AdminPage({language}: AdminPageProps) {
  const copy = adminCopy[language];
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductPayload>(initialForm);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      setSaving(true);
      await createProduct(form);
      setForm(initialForm);
      await loadProducts();
    } catch {
      setError(copy.errors.save);
    } finally {
      setSaving(false);
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
      return product.name.toLowerCase().includes(normalizedQuery) || product.slug.toLowerCase().includes(normalizedQuery);
    });
  }, [products, query]);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalUnits = products.reduce((sum, product) => sum + product.stockQuantity, 0);
    const inventoryValue = products.reduce((sum, product) => sum + product.stockQuantity * product.price, 0);
    const lowStock = products.filter((product) => product.stockQuantity <= 10).length;
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
        <div className="rounded-2xl border border-brand-300/30 bg-brand-500/15 px-4 py-3 text-right">
          <p className="text-xs uppercase text-brand-200">{copy.securityTag}</p>
          <p className="theme-heading mt-1 inline-flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4" />
            {copy.securitySession}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="SKU" value={String(stats.totalProducts)} caption={copy.statCaptions[0]} icon={Boxes} />
        <StatCard title="Units" value={String(stats.totalUnits)} caption={copy.statCaptions[1]} icon={BarChart3} />
        <StatCard title="Value" value={`$${Math.round(stats.inventoryValue).toLocaleString()}`} caption={copy.statCaptions[2]} icon={CircleDollarSign} />
        <StatCard title="Low" value={String(stats.lowStock)} caption={copy.statCaptions[3]} icon={Shield} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
        <motion.form
          initial={{opacity: 0, x: -14}}
          animate={{opacity: 1, x: 0}}
          transition={{duration: 0.4}}
          onSubmit={handleSubmit}
          className="glass-card rounded-3xl p-5 sm:p-6"
        >
          <h2 className="theme-heading text-xl font-semibold">{copy.formTitle}</h2>
          <p className="theme-text mb-4 mt-1 text-sm">{copy.formSubtitle}</p>

          <div className="space-y-3">
            <Input label={copy.fields.name} value={form.name} onChange={(value) => setForm((prev) => ({...prev, name: value}))} />
            <Input label={copy.fields.slug} value={form.slug} onChange={(value) => setForm((prev) => ({...prev, slug: value}))} />
            <Input label={copy.fields.brand} value={form.brand} onChange={(value) => setForm((prev) => ({...prev, brand: value}))} />
            <Input label={copy.fields.price} type="number" value={String(form.price)} onChange={(value) => setForm((prev) => ({...prev, price: Number(value)}))} />
            <Input
              label={copy.fields.stock}
              type="number"
              value={String(form.stockQuantity)}
              onChange={(value) => setForm((prev) => ({...prev, stockQuantity: Number(value)}))}
            />
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

        <motion.div initial={{opacity: 0, x: 14}} animate={{opacity: 1, x: 0}} transition={{duration: 0.4, delay: 0.05}} className="glass-card rounded-3xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="theme-heading text-xl font-semibold">{copy.catalogTitle}</h2>
            <div className="relative w-full max-w-xs">
              <Search className="theme-muted pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy.searchPlaceholder}
                className="input-surface w-full rounded-xl border py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand-300"
              />
            </div>
          </div>

          {loading && <p className="theme-text mt-4">{copy.loading}</p>}
          {!loading && error && <p className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-100">{error}</p>}
          {!loading && !error && filteredProducts.length === 0 && <p className="theme-text mt-4">{copy.empty}</p>}

          {!loading && !error && filteredProducts.length > 0 && (
            <div className="mt-4 space-y-2">
              <AnimatePresence initial={false}>
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{opacity: 0, y: 14}}
                    animate={{opacity: 1, y: 0}}
                    exit={{opacity: 0, x: 12}}
                    transition={{duration: 0.25}}
                    className="tile-surface rounded-2xl p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="theme-heading font-medium">{product.name}</p>
                        <p className="theme-muted text-xs">slug: {product.slug}</p>
                        <p className="theme-text mt-1 text-sm">
                          ${product.price.toFixed(2)} · {product.stockQuantity} {copy.unitShort} · {product.brand || "OEM"}
                        </p>
                      </div>
                      <motion.button
                        whileTap={{scale: 0.96}}
                        onClick={() => void handleDelete(product.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/35 bg-rose-500/10 px-3 py-1.5 text-sm text-rose-100 transition hover:bg-rose-500/20"
                        type="button"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {copy.deleteButton}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
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
