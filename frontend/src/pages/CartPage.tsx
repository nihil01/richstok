import {checkoutOrder, fetchAccountProfile} from "@/api/client";
import {useCart} from "@/context/CartContext";
import type {AuthUser} from "@/types/auth";
import type {CartItem} from "@/types/cart";
import type {DisplayCurrency} from "@/types/currency";
import type {Language} from "@/types/ui";
import {formatConvertedPrice} from "@/utils/currency";
import {motion} from "framer-motion";
import {AlertCircle, Minus, Plus, ShoppingCart, Trash2} from "lucide-react";
import {useEffect, useMemo, useState} from "react";
import {Link} from "react-router-dom";

type CartPageProps = {
  language: Language;
  displayCurrency: DisplayCurrency;
  currencyRates: Record<string, number>;
  authUser: AuthUser | null;
};

type CheckoutProfileState = {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  country: string;
};

type RequiredProfileField = "fullName" | "email" | "phone" | "addressLine1" | "city" | "country";
type FulfillmentCity = "BAKI" | "GANCA";

const requiredProfileFields: RequiredProfileField[] = ["fullName", "email", "phone", "addressLine1", "city", "country"];

const emptyProfile: CheckoutProfileState = {
  fullName: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  postalCode: "",
  country: ""
};

const copy: Record<
  Language,
  {
    title: string;
    subtitle: string;
    empty: string;
    clear: string;
    checkout: string;
    checkingOut: string;
    invoiceSuccess: string;
    quantity: string;
    remove: string;
    subtotal: string;
    stockInCity: string;
    customerTitle: string;
    customerSubtitle: string;
    fulfillmentCityLabel: string;
    fulfillmentCityHint: string;
    fulfillmentCityOptions: Record<FulfillmentCity, string>;
    profileLoading: string;
    goToProfile: string;
    profileFields: Record<keyof CheckoutProfileState, string>;
    errors: {
      submit: string;
      loadProfile: string;
      missingPrefix: string;
      stockCityPrefix: string;
    };
  }
> = {
  az: {
    title: "Səbət",
    subtitle: "Seçilmiş ehtiyat hissələri və checkout.",
    empty: "Səbət boşdur.",
    clear: "Səbəti təmizlə",
    checkout: "Sifarişi tamamla",
    checkingOut: "Göndərilir...",
    invoiceSuccess: "İnvoice emailə göndərildi.",
    quantity: "Miqdar",
    remove: "Sil",
    subtotal: "Ara cəm",
    stockInCity: "Seçilmiş şəhərdə qalıq",
    customerTitle: "Çatdırılma məlumatları",
    customerSubtitle: "Checkout zamanı məlumatlar profilindən avtomatik götürülür.",
    fulfillmentCityLabel: "Anbar şəhəri",
    fulfillmentCityHint: "Sifariş üçün istifadə olunan şəhər stokuna görə rezerv ediləcək.",
    fulfillmentCityOptions: {
      BAKI: "Bakı",
      GANCA: "Gəncə"
    },
    profileLoading: "Profil məlumatları yüklənir...",
    goToProfile: "Profili tamamla",
    profileFields: {
      fullName: "Ad Soyad",
      email: "Email",
      phone: "Telefon",
      addressLine1: "Ünvan",
      addressLine2: "Əlavə ünvan",
      city: "Şəhər",
      postalCode: "Poçt kodu",
      country: "Ölkə"
    },
    errors: {
      submit: "Checkout alınmadı. Yenidən cəhd et.",
      loadProfile: "Profil məlumatlarını yükləmək alınmadı.",
      missingPrefix: "Profildə çatışmayan məcburi sahələr:",
      stockCityPrefix: "Seçilmiş şəhərdə kifayət qədər stok yoxdur:"
    }
  },
  en: {
    title: "Cart",
    subtitle: "Selected auto parts and checkout.",
    empty: "Your cart is empty.",
    clear: "Clear cart",
    checkout: "Complete checkout",
    checkingOut: "Submitting...",
    invoiceSuccess: "Invoice has been sent to email.",
    quantity: "Quantity",
    remove: "Remove",
    subtotal: "Subtotal",
    stockInCity: "Available in selected city",
    customerTitle: "Delivery details",
    customerSubtitle: "Checkout uses your account profile details automatically.",
    fulfillmentCityLabel: "Warehouse city",
    fulfillmentCityHint: "Stock reservation and deduction are applied to this city.",
    fulfillmentCityOptions: {
      BAKI: "Baki",
      GANCA: "Gence"
    },
    profileLoading: "Loading profile details...",
    goToProfile: "Complete profile",
    profileFields: {
      fullName: "Full name",
      email: "Email",
      phone: "Phone",
      addressLine1: "Address",
      addressLine2: "Address line 2",
      city: "City",
      postalCode: "Postal code",
      country: "Country"
    },
    errors: {
      submit: "Checkout failed. Please try again.",
      loadProfile: "Failed to load profile details.",
      missingPrefix: "Missing required profile fields:",
      stockCityPrefix: "Insufficient stock in selected city:"
    }
  },
  ru: {
    title: "Корзина",
    subtitle: "Выбранные товары и оформление.",
    empty: "Корзина пуста.",
    clear: "Очистить корзину",
    checkout: "Оформить заказ",
    checkingOut: "Отправка...",
    invoiceSuccess: "Инвойс отправлен на email.",
    quantity: "Количество",
    remove: "Удалить",
    subtotal: "Итого",
    stockInCity: "Остаток в выбранном городе",
    customerTitle: "Данные доставки",
    customerSubtitle: "При оформлении данные автоматически берутся из профиля.",
    fulfillmentCityLabel: "Город склада",
    fulfillmentCityHint: "Резерв и списание выполняются по этому городу.",
    fulfillmentCityOptions: {
      BAKI: "Баку",
      GANCA: "Гянджа"
    },
    profileLoading: "Загрузка данных профиля...",
    goToProfile: "Заполнить профиль",
    profileFields: {
      fullName: "Имя и фамилия",
      email: "Email",
      phone: "Телефон",
      addressLine1: "Адрес",
      addressLine2: "Доп. адрес",
      city: "Город",
      postalCode: "Почтовый индекс",
      country: "Страна"
    },
    errors: {
      submit: "Не удалось оформить заказ. Попробуй снова.",
      loadProfile: "Не удалось загрузить данные профиля.",
      missingPrefix: "В профиле не заполнены обязательные поля:",
      stockCityPrefix: "Недостаточно остатка в выбранном городе:"
    }
  }
};

const profileFieldOrder: Array<keyof CheckoutProfileState> = [
  "fullName",
  "email",
  "phone",
  "addressLine1",
  "addressLine2",
  "city",
  "postalCode",
  "country"
];

export default function CartPage({language, displayCurrency, currencyRates, authUser}: CartPageProps) {
  const ui = copy[language];
  const {items, totalItems, subtotal, loading, setItemQuantity, removeItem, clearCart} = useCart();
  const [profile, setProfile] = useState<CheckoutProfileState>(emptyProfile);
  const [fulfillmentCity, setFulfillmentCity] = useState<FulfillmentCity>("BAKI");
  const [profileLoading, setProfileLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!authUser) {
      setProfile(emptyProfile);
      setProfileLoading(false);
      return;
    }
    void (async () => {
      try {
        setProfileLoading(true);
        const data = await fetchAccountProfile();
        setProfile({
          fullName: data.fullName ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          addressLine1: data.addressLine1 ?? "",
          addressLine2: data.addressLine2 ?? "",
          city: data.city ?? "",
          postalCode: data.postalCode ?? "",
          country: data.country ?? ""
        });
        setFulfillmentCity(resolveFulfillmentCityByAddress(data.city ?? ""));
      } catch {
        setError(ui.errors.loadProfile);
      } finally {
        setProfileLoading(false);
      }
    })();
  }, [authUser?.id, language]);

  const missingRequiredFields = useMemo(
    () => requiredProfileFields.filter((field) => profile[field].trim().length === 0),
    [profile]
  );

  const cityStockIssues = useMemo(() => {
    return items
      .map((item) => ({
        item,
        availableInCity: resolveCityStock(item, fulfillmentCity)
      }))
      .filter(({item, availableInCity}) => item.quantity > availableInCity);
  }, [items, fulfillmentCity]);

  const canCheckout = useMemo(
    () =>
      Boolean(authUser)
      && items.length > 0
      && !submitting
      && !profileLoading
      && missingRequiredFields.length === 0
      && cityStockIssues.length === 0,
    [authUser, items.length, submitting, profileLoading, missingRequiredFields.length, cityStockIssues.length]
  );

  async function handleCheckout() {
    if (!authUser) {
      return;
    }
    if (missingRequiredFields.length > 0) {
      const missingLabels = missingRequiredFields.map((field) => ui.profileFields[field]).join(", ");
      setError(`${ui.errors.missingPrefix} ${missingLabels}`);
      return;
    }
    if (cityStockIssues.length > 0) {
      const details = cityStockIssues
        .slice(0, 4)
        .map(({item, availableInCity}) => `${item.name} (${item.quantity}/${availableInCity})`)
        .join(", ");
      setError(`${ui.errors.stockCityPrefix} ${details}`);
      return;
    }
    if (!canCheckout) {
      return;
    }

    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await checkoutOrder({
        ...profile,
        fulfillmentCity
      });
      setSuccess(ui.invoiceSuccess);
      await clearCart();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError) ?? ui.errors.submit);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.section
      key="cart-page"
      initial={{opacity: 0, y: 12}}
      animate={{opacity: 1, y: 0}}
      exit={{opacity: 0, y: -8}}
      transition={{duration: 0.3}}
      className="space-y-5"
    >
      <header className="glass-card rounded-2xl p-5 sm:p-6">
        <h1 className="theme-heading text-2xl font-semibold">{ui.title}</h1>
        <p className="theme-text mt-2 text-sm">{ui.subtitle}</p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.2fr,1fr]">
        <article className="glass-card rounded-2xl p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="theme-text text-sm">{ui.quantity}: {totalItems}</span>
            <button
              type="button"
              onClick={() => void clearCart()}
              className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs theme-text transition hover:border-brand-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {ui.clear}
            </button>
          </div>

          {loading && <p className="theme-muted text-sm">...</p>}
          {!loading && items.length === 0 && (
            <div className="tile-surface flex items-center gap-2 rounded-xl border p-3 text-sm">
              <ShoppingCart className="h-4 w-4 text-brand-300" />
              {ui.empty}
            </div>
          )}

          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.productId} className="tile-surface flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2.5">
                <div className="min-w-0">
                  <p className="theme-heading truncate text-sm font-medium">{item.name}</p>
                  <p className="theme-muted truncate text-xs">{item.sku} · {item.brand || "OEM"}</p>
                </div>

                <div className="flex items-center gap-2">
                  {(() => {
                    const availableInCity = resolveCityStock(item, fulfillmentCity);
                    const increaseDisabled = availableInCity <= item.quantity;
                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => void setItemQuantity(item.productId, item.quantity - 1)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/15 theme-text transition hover:border-brand-300"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="theme-heading w-7 text-center text-sm">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (increaseDisabled) {
                              return;
                            }
                            void setItemQuantity(item.productId, item.quantity + 1);
                          }}
                          disabled={increaseDisabled}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/15 theme-text transition hover:border-brand-300 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </>
                    );
                  })()}
                  <button
                    type="button"
                    onClick={() => void removeItem(item.productId)}
                    className="inline-flex items-center gap-1 rounded-md border border-rose-500/35 bg-rose-500/10 px-2 py-1 text-xs text-rose-100 transition hover:bg-rose-500/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {ui.remove}
                  </button>
                </div>

                <div className="ml-auto text-right">
                  {(() => {
                    const availableInCity = resolveCityStock(item, fulfillmentCity);
                    const insufficient = item.quantity > availableInCity;
                    return (
                      <p className={`text-xs ${insufficient ? "text-rose-300" : "theme-muted"}`}>
                        {ui.stockInCity}: {availableInCity}
                      </p>
                    );
                  })()}
                  <p className="theme-muted text-xs">{formatConvertedPrice(item.unitPrice, displayCurrency, currencyRates, language)}</p>
                  <p className="text-sm font-semibold text-brand-200">{formatConvertedPrice(item.lineTotal, displayCurrency, currencyRates, language)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-brand-500/28 bg-brand-500/8 px-3 py-2 text-sm">
            <span className="theme-text">{ui.subtotal}: </span>
            <strong className="text-brand-200">{formatConvertedPrice(subtotal, displayCurrency, currencyRates, language)}</strong>
          </div>
        </article>

        <article className="glass-card rounded-2xl p-4 sm:p-5">
          <h2 className="theme-heading text-lg font-semibold">{ui.customerTitle}</h2>
          <p className="theme-text mt-1 text-sm">{ui.customerSubtitle}</p>

          <div className="mt-4 space-y-2">
            {profileLoading ? (
              <p className="theme-muted text-sm">{ui.profileLoading}</p>
            ) : (
              <>
                <div className="grid gap-2 sm:grid-cols-2">
                  {profileFieldOrder.map((field) => (
                    <div key={field} className="input-surface rounded-xl border px-3 py-2">
                      <p className="theme-muted text-[11px] uppercase tracking-wide">{ui.profileFields[field]}</p>
                      <p className="theme-heading mt-1 text-sm">{profile[field] || "—"}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-xl border border-white/12 bg-black/10 p-3">
                  <label className="block text-sm">
                    <span className="theme-text">{ui.fulfillmentCityLabel}</span>
                    <select
                      value={fulfillmentCity}
                      onChange={(event) => {
                        setFulfillmentCity(event.target.value as FulfillmentCity);
                        setError(null);
                      }}
                      className="input-surface mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-brand-300"
                    >
                      {(["BAKI", "GANCA"] as FulfillmentCity[]).map((cityOption) => (
                        <option key={cityOption} value={cityOption}>
                          {ui.fulfillmentCityOptions[cityOption]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="theme-muted mt-2 text-xs">{ui.fulfillmentCityHint}</p>
                </div>
              </>
            )}
          </div>

          {missingRequiredFields.length > 0 && !profileLoading && (
            <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p>{ui.errors.missingPrefix} {missingRequiredFields.map((field) => ui.profileFields[field]).join(", ")}</p>
                  <Link to="/account" className="mt-1 inline-block text-xs font-medium text-brand-100 underline underline-offset-4 transition hover:text-brand-50">
                    {ui.goToProfile}
                  </Link>
                </div>
              </div>
            </div>
          )}

          {cityStockIssues.length > 0 && (
            <div className="mt-3 rounded-xl border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
              <p className="font-medium">{ui.errors.stockCityPrefix}</p>
              <p className="mt-1 text-xs">
                {cityStockIssues
                  .slice(0, 4)
                  .map(({item, availableInCity}) => `${item.name} (${item.quantity}/${availableInCity})`)
                  .join(", ")}
              </p>
            </div>
          )}

          {error && <p className="mt-3 rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</p>}
          {success && <p className="mt-3 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">{success}</p>}

          <button
            type="button"
            onClick={() => void handleCheckout()}
            disabled={!canCheckout}
            className="mt-4 w-full rounded-xl bg-gradient-to-r from-brand-600 to-pulse-500 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? ui.checkingOut : ui.checkout}
          </button>
        </article>
      </section>
    </motion.section>
  );
}

function getApiErrorMessage(error: unknown): string | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const response = (error as {response?: {data?: {message?: unknown}}}).response;
  const message = response?.data?.message;
  if (typeof message !== "string") {
    return null;
  }
  const normalized = message.trim();
  return normalized.length > 0 ? normalized : null;
}

function resolveFulfillmentCityByAddress(city: string): FulfillmentCity {
  const normalized = normalizeCityValue(city);
  if (normalized.includes("gence") || normalized.includes("gance") || normalized.includes("ganja") || normalized.includes("ganca")) {
    return "GANCA";
  }
  return "BAKI";
}

function normalizeCityValue(value: string): string {
  return value
    .toLowerCase()
    .replace(/ə/g, "e")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ç/g, "c")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function resolveCityStock(item: CartItem, city: FulfillmentCity): number {
  const fallback = Math.max(0, item.availableStock ?? 0);
  if (city === "GANCA") {
    if (item.ganjaCountUnknown) {
      return 0;
    }
    return item.ganjaCount == null ? fallback : Math.max(0, item.ganjaCount);
  }
  if (item.bakuCountUnknown) {
    return 0;
  }
  return item.bakuCount == null ? fallback : Math.max(0, item.bakuCount);
}
