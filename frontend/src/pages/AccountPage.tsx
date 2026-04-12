import {changePassword, fetchAccountProfile, fetchMyOrderDetails, fetchMyOrders, updateAccountProfile} from "@/api/client";
import {useWishlist} from "@/context/WishlistContext";
import type {AccountProfilePayload, AuthUser} from "@/types/auth";
import type {UserOrderDetails, UserOrderPage} from "@/types/order";
import type {Language} from "@/types/ui";
import {AnimatePresence, motion} from "framer-motion";
import {ChevronLeft, ChevronRight, Eye, Heart, ListOrdered, LockKeyhole, MapPinHouse, Trash2} from "lucide-react";
import type {FormEvent} from "react";
import {useEffect, useMemo, useState} from "react";
import {Link} from "react-router-dom";

type AccountPageProps = {
  language: Language;
  user: AuthUser | null;
};

type AccountTab = "orders" | "wishlist" | "address" | "password";

const emptyProfile: AccountProfilePayload = {
  fullName: "",
  phone: "",
  phoneAlt: "",
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
    roleLabel: string;
    tabs: Record<AccountTab, string>;
    orders: {
      title: string;
      subtitle: string;
      loading: string;
      empty: string;
      details: string;
      hideDetails: string;
      detailsLoading: string;
      items: string;
      total: string;
      status: string;
      createdAt: string;
      warehouseCity: string;
      customer: string;
      phone: string;
      address: string;
      comment: string;
      noComment: string;
      page: string;
      prev: string;
      next: string;
      errors: {load: string; details: string};
    };
    wishlist: {
      title: string;
      subtitle: string;
      empty: string;
      toProduct: string;
      remove: string;
      clear: string;
    };
    address: {
      title: string;
      subtitle: string;
      save: string;
      saving: string;
      success: string;
      loadError: string;
      saveError: string;
      fields: {
        fullName: string;
        phone: string;
        phoneAlt: string;
        addressLine1: string;
        addressLine2: string;
        city: string;
        postalCode: string;
        country: string;
      };
    };
    password: {
      title: string;
      subtitle: string;
      currentPassword: string;
      newPassword: string;
      repeatPassword: string;
      submit: string;
      submitting: string;
      success: string;
      mismatch: string;
      error: string;
    };
  }
> = {
  az: {
    title: "İstifadəçi kabineti",
    subtitle: "Sifarişləri, seçilmişləri və hesab məlumatlarını idarə et.",
    roleLabel: "Rol",
    tabs: {
      orders: "Sifarişlər",
      wishlist: "Seçilmişlər",
      address: "Ünvan məlumatları",
      password: "Parol"
    },
    orders: {
      title: "Sifarişlərim",
      subtitle: "Son checkout tarixçəsi və sifariş detalları.",
      loading: "Sifarişlər yüklənir...",
      empty: "Hələ sifariş yoxdur.",
      details: "Detalları aç",
      hideDetails: "Detalları gizlət",
      detailsLoading: "Detallar yüklənir...",
      items: "Məhsul sayı",
      total: "Cəm",
      status: "Status",
      createdAt: "Tarix",
      warehouseCity: "Anbar şəhəri",
      customer: "Alıcı",
      phone: "Telefon",
      address: "Ünvan",
      comment: "Qeyd",
      noComment: "Qeyd yoxdur",
      page: "Səhifə",
      prev: "Əvvəlki",
      next: "Növbəti",
      errors: {
        load: "Sifarişləri yükləmək mümkün olmadı.",
        details: "Sifariş detalları yüklənmədi."
      }
    },
    wishlist: {
      title: "Seçilmiş məhsullar",
      subtitle: "Sonra almaq üçün saxladığın məhsullar.",
      empty: "Seçilmiş məhsul yoxdur.",
      toProduct: "Məhsula keç",
      remove: "Sil",
      clear: "Hamısını təmizlə"
    },
    address: {
      title: "Ünvan və əlaqə məlumatları",
      subtitle: "Checkout zamanı məhz bu məlumatlardan istifadə olunur.",
      save: "Məlumatları yenilə",
      saving: "Yenilənir...",
      success: "Məlumatlar yeniləndi.",
      loadError: "Profil məlumatlarını yükləmək mümkün olmadı.",
      saveError: "Məlumatlar yenilənmədi.",
      fields: {
        fullName: "Ad Soyad",
        phone: "Telefon",
        phoneAlt: "Əlavə telefon",
        addressLine1: "Ünvan",
        addressLine2: "Əlavə ünvan",
        city: "Şəhər",
        postalCode: "Poçt kodu",
        country: "Ölkə"
      }
    },
    password: {
      title: "Parolun dəyişdirilməsi",
      subtitle: "Hesab təhlükəsizliyi üçün parolu yenilə.",
      currentPassword: "Cari parol",
      newPassword: "Yeni parol",
      repeatPassword: "Yeni parolu təkrar et",
      submit: "Parolu yenilə",
      submitting: "Yenilənir...",
      success: "Parol uğurla dəyişdirildi.",
      mismatch: "Yeni parollar eyni deyil.",
      error: "Parolu dəyişmək alınmadı. Cari parolu yoxla."
    }
  },
  en: {
    title: "Account dashboard",
    subtitle: "Manage your orders, saved items, and account settings.",
    roleLabel: "Role",
    tabs: {
      orders: "Orders",
      wishlist: "Wishlist",
      address: "Address details",
      password: "Password"
    },
    orders: {
      title: "My orders",
      subtitle: "Your recent checkout history and order details.",
      loading: "Loading orders...",
      empty: "You have no orders yet.",
      details: "Show details",
      hideDetails: "Hide details",
      detailsLoading: "Loading details...",
      items: "Items",
      total: "Total",
      status: "Status",
      createdAt: "Created",
      warehouseCity: "Warehouse city",
      customer: "Customer",
      phone: "Phone",
      address: "Address",
      comment: "Comment",
      noComment: "No comment",
      page: "Page",
      prev: "Previous",
      next: "Next",
      errors: {
        load: "Failed to load orders.",
        details: "Failed to load order details."
      }
    },
    wishlist: {
      title: "Saved items",
      subtitle: "Products you saved for later.",
      empty: "Your wishlist is empty.",
      toProduct: "Open product",
      remove: "Remove",
      clear: "Clear all"
    },
    address: {
      title: "Address and contact details",
      subtitle: "Checkout uses this profile data.",
      save: "Update details",
      saving: "Updating...",
      success: "Profile details updated.",
      loadError: "Failed to load profile details.",
      saveError: "Failed to update profile details.",
      fields: {
        fullName: "Full name",
        phone: "Phone",
        phoneAlt: "Alternative phone",
        addressLine1: "Address",
        addressLine2: "Address line 2",
        city: "City",
        postalCode: "Postal code",
        country: "Country"
      }
    },
    password: {
      title: "Change password",
      subtitle: "Update your password to keep your account secure.",
      currentPassword: "Current password",
      newPassword: "New password",
      repeatPassword: "Repeat new password",
      submit: "Update password",
      submitting: "Updating...",
      success: "Password changed successfully.",
      mismatch: "New passwords do not match.",
      error: "Failed to change password. Check your current password."
    }
  },
  ru: {
    title: "Личный кабинет",
    subtitle: "Управляй заказами, избранным и настройками аккаунта.",
    roleLabel: "Роль",
    tabs: {
      orders: "Заказы",
      wishlist: "Избранное",
      address: "Адрес",
      password: "Пароль"
    },
    orders: {
      title: "Мои заказы",
      subtitle: "История оформлений и подробности по заказам.",
      loading: "Загрузка заказов...",
      empty: "Пока нет заказов.",
      details: "Открыть детали",
      hideDetails: "Скрыть детали",
      detailsLoading: "Загрузка деталей...",
      items: "Товаров",
      total: "Итого",
      status: "Статус",
      createdAt: "Дата",
      warehouseCity: "Город склада",
      customer: "Покупатель",
      phone: "Телефон",
      address: "Адрес",
      comment: "Комментарий",
      noComment: "Комментария нет",
      page: "Страница",
      prev: "Назад",
      next: "Вперед",
      errors: {
        load: "Не удалось загрузить заказы.",
        details: "Не удалось загрузить детали заказа."
      }
    },
    wishlist: {
      title: "Избранные товары",
      subtitle: "Товары, которые ты сохранил на потом.",
      empty: "В избранном пока пусто.",
      toProduct: "К товару",
      remove: "Удалить",
      clear: "Очистить всё"
    },
    address: {
      title: "Адрес и контакты",
      subtitle: "Эти данные используются при оформлении.",
      save: "Обновить данные",
      saving: "Обновление...",
      success: "Данные профиля обновлены.",
      loadError: "Не удалось загрузить данные профиля.",
      saveError: "Не удалось обновить данные профиля.",
      fields: {
        fullName: "Имя и фамилия",
        phone: "Телефон",
        phoneAlt: "Доп. телефон",
        addressLine1: "Адрес",
        addressLine2: "Доп. адрес",
        city: "Город",
        postalCode: "Почтовый индекс",
        country: "Страна"
      }
    },
    password: {
      title: "Смена пароля",
      subtitle: "Обнови пароль для безопасности аккаунта.",
      currentPassword: "Текущий пароль",
      newPassword: "Новый пароль",
      repeatPassword: "Повторите новый пароль",
      submit: "Обновить пароль",
      submitting: "Обновление...",
      success: "Пароль успешно изменён.",
      mismatch: "Новые пароли не совпадают.",
      error: "Не удалось сменить пароль. Проверь текущий пароль."
    }
  }
};

const tabs: Array<{id: AccountTab; icon: typeof ListOrdered}> = [
  {id: "orders", icon: ListOrdered},
  {id: "wishlist", icon: Heart},
  {id: "address", icon: MapPinHouse},
  {id: "password", icon: LockKeyhole}
];

export default function AccountPage({language, user}: AccountPageProps) {
  const ui = copy[language];
  const {items: wishlistItems, removeWishlistItem, clearWishlist} = useWishlist();
  const [activeTab, setActiveTab] = useState<AccountTab>("orders");

  const [profile, setProfile] = useState<AccountProfilePayload>(emptyProfile);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const [ordersPage, setOrdersPage] = useState<UserOrderPage | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [ordersPageIndex, setOrdersPageIndex] = useState(0);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [detailsLoadingId, setDetailsLoadingId] = useState<number | null>(null);
  const [orderDetailsById, setOrderDetailsById] = useState<Record<number, UserOrderDetails>>({});

  useEffect(() => {
    void loadProfile();
  }, [language]);

  useEffect(() => {
    if (activeTab !== "orders") {
      return;
    }
    void loadOrders(ordersPageIndex);
  }, [activeTab, ordersPageIndex, language]);

  async function loadProfile() {
    try {
      setProfileLoading(true);
      const data = await fetchAccountProfile();
      setProfile({
        fullName: data.fullName ?? "",
        phone: data.phone ?? "",
        phoneAlt: data.phoneAlt ?? "",
        addressLine1: data.addressLine1 ?? "",
        addressLine2: data.addressLine2 ?? "",
        city: data.city ?? "",
        postalCode: data.postalCode ?? "",
        country: data.country ?? ""
      });
      setProfileError(null);
    } catch {
      setProfileError(ui.address.loadError);
    } finally {
      setProfileLoading(false);
    }
  }

  async function loadOrders(pageIndex: number) {
    try {
      setOrdersLoading(true);
      const data = await fetchMyOrders({page: pageIndex, size: 10});
      setOrdersPage(data);
      setOrdersError(null);
    } catch {
      setOrdersError(ui.orders.errors.load);
    } finally {
      setOrdersLoading(false);
    }
  }

  async function toggleOrderDetails(orderId: number) {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(orderId);
    if (orderDetailsById[orderId]) {
      return;
    }
    try {
      setDetailsLoadingId(orderId);
      const data = await fetchMyOrderDetails(orderId);
      setOrderDetailsById((prev) => ({...prev, [orderId]: data}));
    } catch {
      setOrdersError(ui.orders.errors.details);
    } finally {
      setDetailsLoadingId(null);
    }
  }

  async function handleSaveProfile(event: FormEvent) {
    event.preventDefault();
    try {
      setProfileSaving(true);
      setProfileError(null);
      setProfileSuccess(null);
      const updated = await updateAccountProfile(profile);
      setProfile({
        fullName: updated.fullName ?? "",
        phone: updated.phone ?? "",
        phoneAlt: updated.phoneAlt ?? "",
        addressLine1: updated.addressLine1 ?? "",
        addressLine2: updated.addressLine2 ?? "",
        city: updated.city ?? "",
        postalCode: updated.postalCode ?? "",
        country: updated.country ?? ""
      });
      setProfileSuccess(ui.address.success);
    } catch (error) {
      setProfileError(getApiErrorMessage(error) ?? ui.address.saveError);
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== repeatPassword) {
      setPasswordError(ui.password.mismatch);
      return;
    }

    try {
      setPasswordLoading(true);
      await changePassword({currentPassword, newPassword});
      setCurrentPassword("");
      setNewPassword("");
      setRepeatPassword("");
      setPasswordSuccess(ui.password.success);
    } catch (error) {
      setPasswordError(getApiErrorMessage(error) ?? ui.password.error);
    } finally {
      setPasswordLoading(false);
    }
  }

  const pageNumberLabel = useMemo(() => (ordersPage?.page ?? 0) + 1, [ordersPage?.page]);
  const totalPages = useMemo(() => ordersPage?.totalPages ?? 1, [ordersPage?.totalPages]);

  return (
    <motion.section initial={{opacity: 0, y: 14}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}} transition={{duration: 0.3}} className="space-y-5">
      <header className="glass-card rounded-2xl p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-200">Richstok</p>
        <h1 className="theme-heading mt-2 text-3xl font-semibold">{ui.title}</h1>
        <p className="theme-text mt-2 text-sm">{ui.subtitle}</p>
        {user && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-brand-500/30 bg-brand-500/10 px-3 py-1.5 text-sm text-brand-100">
            <span>{user.fullName}</span>
            <span className="text-brand-300">•</span>
            <span>
              {ui.roleLabel}: {user.role}
            </span>
          </div>
        )}
      </header>

      <section className="glass-card rounded-2xl p-3">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {tabs.map((tab) => {
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
                {ui.tabs[tab.id]}
              </button>
            );
          })}
        </div>
      </section>

      <AnimatePresence mode="wait">
        {activeTab === "orders" && (
          <motion.section
            key="tab-orders"
            initial={{opacity: 0, y: 8}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -8}}
            className="glass-card rounded-2xl p-5 sm:p-6"
          >
            <h2 className="theme-heading text-lg font-semibold">{ui.orders.title}</h2>
            <p className="theme-text mt-1 text-sm">{ui.orders.subtitle}</p>

            {ordersLoading && <p className="theme-muted mt-4 text-sm">{ui.orders.loading}</p>}
            {ordersError && <p className="mt-4 rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{ordersError}</p>}

            {!ordersLoading && (ordersPage?.content.length ?? 0) === 0 && (
              <p className="theme-muted mt-4 text-sm">{ui.orders.empty}</p>
            )}

            <div className="mt-4 space-y-3">
              {ordersPage?.content.map((order) => (
                <article key={order.id} className="tile-surface rounded-xl border px-3 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="theme-heading text-sm font-semibold">{order.invoiceNumber}</p>
                      <p className="theme-muted mt-1 text-xs">
                        {ui.orders.status}: {order.status} · {ui.orders.createdAt}: {new Date(order.createdAt).toLocaleString()}
                      </p>
                      <p className="theme-muted mt-1 text-xs">
                        {ui.orders.warehouseCity}: {formatFulfillmentCity(order.fulfillmentCity, language)}
                      </p>
                      <p className="theme-text mt-1 text-sm">
                        {ui.orders.total}: <span className="font-semibold text-brand-200">{Number(order.totalAmount).toFixed(2)} {order.currencyCode}</span> · {ui.orders.items}: {order.itemCount}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void toggleOrderDetails(order.id)}
                      className="inline-flex items-center gap-2 rounded-lg border border-brand-500/35 bg-brand-500/10 px-3 py-1.5 text-xs text-brand-100 transition hover:bg-brand-500/20"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {expandedOrderId === order.id ? ui.orders.hideDetails : ui.orders.details}
                    </button>
                  </div>

                  {expandedOrderId === order.id && (
                    <div className="mt-3 border-t border-white/10 pt-3">
                      {detailsLoadingId === order.id ? (
                        <p className="theme-muted text-sm">{ui.orders.detailsLoading}</p>
                      ) : (
                        orderDetailsById[order.id] && (
                          <OrderDetailsBlock details={orderDetailsById[order.id]} ui={ui.orders} language={language} />
                        )
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOrdersPageIndex((prev) => Math.max(prev - 1, 0))}
                disabled={ordersPageIndex === 0 || ordersLoading}
                className="inline-flex items-center gap-1 rounded-lg border border-white/12 px-2.5 py-1.5 text-xs theme-text transition hover:border-brand-300 disabled:opacity-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                {ui.orders.prev}
              </button>
              <span className="theme-muted text-xs">
                {ui.orders.page} {pageNumberLabel} / {Math.max(totalPages, 1)}
              </span>
              <button
                type="button"
                onClick={() => setOrdersPageIndex((prev) => prev + 1)}
                disabled={Boolean(ordersPage?.last) || ordersLoading}
                className="inline-flex items-center gap-1 rounded-lg border border-white/12 px-2.5 py-1.5 text-xs theme-text transition hover:border-brand-300 disabled:opacity-50"
              >
                {ui.orders.next}
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.section>
        )}

        {activeTab === "wishlist" && (
          <motion.section
            key="tab-wishlist"
            initial={{opacity: 0, y: 8}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -8}}
            className="glass-card rounded-2xl p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="theme-heading text-lg font-semibold">{ui.wishlist.title}</h2>
                <p className="theme-text mt-1 text-sm">{ui.wishlist.subtitle}</p>
              </div>
              {wishlistItems.length > 0 && (
                <button
                  type="button"
                  onClick={clearWishlist}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-100 transition hover:bg-rose-500/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {ui.wishlist.clear}
                </button>
              )}
            </div>

            {wishlistItems.length === 0 ? (
              <p className="theme-muted mt-4 text-sm">{ui.wishlist.empty}</p>
            ) : (
              <div className="mt-4 space-y-2">
                {wishlistItems.map((item) => (
                  <article key={item.id} className="tile-surface flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="theme-heading truncate text-sm font-medium">{item.name}</p>
                      <p className="theme-muted truncate text-xs">Brand code: {item.sku} · {item.category}</p>
                      <p className="text-sm font-semibold text-brand-200">{Number(item.price).toFixed(2)} AZN</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/products/${item.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-brand-500/35 bg-brand-500/10 px-3 py-1.5 text-xs text-brand-100 transition hover:bg-brand-500/20"
                      >
                        {ui.wishlist.toProduct}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeWishlistItem(item.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-100 transition hover:bg-rose-500/20"
                      >
                        {ui.wishlist.remove}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </motion.section>
        )}

        {activeTab === "address" && (
          <motion.section
            key="tab-address"
            initial={{opacity: 0, y: 8}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -8}}
            className="glass-card rounded-2xl p-5 sm:p-6"
          >
            <h2 className="theme-heading text-lg font-semibold">{ui.address.title}</h2>
            <p className="theme-text mt-1 text-sm">{ui.address.subtitle}</p>

            <form onSubmit={handleSaveProfile} className="mt-4 grid gap-3 sm:grid-cols-2">
              {(Object.keys(profile) as Array<keyof AccountProfilePayload>).map((field) => (
                <label key={field} className={`block text-sm ${field === "addressLine1" || field === "addressLine2" ? "sm:col-span-2" : ""}`}>
                  <span className="theme-text mb-1 block">{ui.address.fields[field]}</span>
                  <input
                    required={["fullName", "phone", "addressLine1", "city", "country"].includes(field)}
                    type="text"
                    value={profile[field]}
                    onChange={(event) => setProfile((prev) => ({...prev, [field]: event.target.value}))}
                    className="input-surface w-full rounded-xl border px-3 py-2 outline-none transition focus:border-brand-300"
                  />
                </label>
              ))}

              <button
                type="submit"
                disabled={profileSaving || profileLoading}
                className="rounded-xl bg-gradient-to-r from-brand-500 to-pulse-500 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-70 sm:col-span-2 sm:justify-self-end"
              >
                {profileSaving ? ui.address.saving : ui.address.save}
              </button>
            </form>

            {profileError && <p className="mt-3 rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{profileError}</p>}
            {profileSuccess && <p className="mt-3 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">{profileSuccess}</p>}
          </motion.section>
        )}

        {activeTab === "password" && (
          <motion.section
            key="tab-password"
            initial={{opacity: 0, y: 8}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -8}}
            className="glass-card rounded-2xl p-5 sm:p-6"
          >
            <h2 className="theme-heading text-lg font-semibold">{ui.password.title}</h2>
            <p className="theme-text mt-1 text-sm">{ui.password.subtitle}</p>

            <form onSubmit={handleChangePassword} className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm sm:col-span-2">
                <span className="theme-text mb-1 block">{ui.password.currentPassword}</span>
                <input
                  required
                  minLength={8}
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="input-surface w-full rounded-xl border px-3 py-2 outline-none transition focus:border-brand-300"
                />
              </label>

              <label className="block text-sm">
                <span className="theme-text mb-1 block">{ui.password.newPassword}</span>
                <input
                  required
                  minLength={8}
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="input-surface w-full rounded-xl border px-3 py-2 outline-none transition focus:border-brand-300"
                />
              </label>

              <label className="block text-sm">
                <span className="theme-text mb-1 block">{ui.password.repeatPassword}</span>
                <input
                  required
                  minLength={8}
                  type="password"
                  value={repeatPassword}
                  onChange={(event) => setRepeatPassword(event.target.value)}
                  className="input-surface w-full rounded-xl border px-3 py-2 outline-none transition focus:border-brand-300"
                />
              </label>

              <button
                type="submit"
                disabled={passwordLoading}
                className="rounded-xl bg-gradient-to-r from-brand-500 to-pulse-500 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-70 sm:col-span-2 sm:justify-self-end"
              >
                {passwordLoading ? ui.password.submitting : ui.password.submit}
              </button>
            </form>

            {passwordError && <p className="mt-3 rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{passwordError}</p>}
            {passwordSuccess && <p className="mt-3 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">{passwordSuccess}</p>}
          </motion.section>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

function OrderDetailsBlock({
  details,
  ui,
  language
}: {
  details: UserOrderDetails;
  language: Language;
  ui: {
    warehouseCity: string;
    customer: string;
    phone: string;
    address: string;
    comment: string;
    noComment: string;
  };
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <p className="theme-text text-sm">
          <span className="theme-muted">{ui.warehouseCity}: </span>
          {formatFulfillmentCity(details.fulfillmentCity, language)}
        </p>
        <p className="theme-text text-sm">
          <span className="theme-muted">{ui.customer}: </span>
          {details.customerFullName}
        </p>
        <p className="theme-text text-sm">
          <span className="theme-muted">{ui.phone}: </span>
          {details.customerPhone}
        </p>
      </div>

      <p className="theme-text text-sm">
        <span className="theme-muted">{ui.address}: </span>
        {details.addressLine1}
        {details.addressLine2 ? `, ${details.addressLine2}` : ""}
        {`, ${details.city}${details.postalCode ? ` ${details.postalCode}` : ""}, ${details.country}`}
      </p>

      <p className="theme-text text-sm">
        <span className="theme-muted">{ui.comment}: </span>
        {details.comment || ui.noComment}
      </p>

      <div className="space-y-2">
        {details.items.map((item, index) => (
          <div key={`${item.productId ?? "no"}-${index}`} className="rounded-lg border border-white/10 px-3 py-2">
            <p className="theme-heading text-sm">{item.productName}</p>
            <p className="theme-muted text-xs">
              Brand code: {item.productSku} · {item.quantity} × {Number(item.unitPrice).toFixed(2)} {details.currencyCode}
            </p>
            <p className="text-sm font-semibold text-brand-200">{Number(item.lineTotal).toFixed(2)} {details.currencyCode}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatFulfillmentCity(city: "BAKI" | "GANCA" | null | undefined, language: Language): string {
  if (city === "GANCA") {
    return language === "ru" ? "Гянджа" : language === "az" ? "Gəncə" : "Gence";
  }
  if (city === "BAKI") {
    return language === "ru" ? "Баку" : language === "az" ? "Bakı" : "Baki";
  }
  return "—";
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
