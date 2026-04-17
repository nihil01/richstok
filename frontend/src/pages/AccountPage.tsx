import {changePassword, fetchAccountProfile, fetchMyOrderDetails, fetchMyOrders, requestOrderItemReturn, updateAccountProfile} from "@/api/client";
import type {AccountProfilePayload, AuthUser} from "@/types/auth";
import type {UserOrderDetails, UserOrderPage} from "@/types/order";
import type {Language} from "@/types/ui";
import {AnimatePresence, motion} from "framer-motion";
import {Camera, ChevronLeft, ChevronRight, Eye, ListOrdered, LockKeyhole, Search, UserRound} from "lucide-react";
import type {ChangeEvent, FormEvent} from "react";
import {useEffect, useMemo, useState} from "react";

type AccountPageProps = {
  language: Language;
  user: AuthUser | null;
};

type AccountTab = "orders" | "profile" | "password";

const emptyProfile: AccountProfilePayload = {
  fullName: "",
  avatarUrl: "",
  phone: "",
  phoneAlt: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  postalCode: "",
  country: ""
};

const editableProfileFields: Array<Exclude<keyof AccountProfilePayload, "avatarUrl">> = [
  "fullName",
  "phone",
  "phoneAlt",
  "addressLine1",
  "addressLine2",
  "city",
  "postalCode",
  "country"
];

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
      searchPlaceholder: string;
      loading: string;
      empty: string;
      invoice: string;
      actions: string;
      details: string;
      hideDetails: string;
      detailsLoading: string;
      items: string;
      total: string;
      status: string;
      createdAt: string;
      customer: string;
      phone: string;
      address: string;
      comment: string;
      noComment: string;
      returnItemAction: string;
      returningItemAction: string;
      returnedDone: string;
      returnQty: string;
      returnReason: string;
      returnReasonPlaceholder: string;
      returnedLabel: string;
      page: string;
      prev: string;
      next: string;
      errors: {load: string; details: string; returnItem: string};
    };
    profile: {
      title: string;
      subtitle: string;
      save: string;
      saving: string;
      success: string;
      loadError: string;
      saveError: string;
      avatarHint: string;
      avatarPick: string;
      avatarUploading: string;
      avatarUploadError: string;
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
    subtitle: "Sifarişləri və hesab məlumatlarını idarə et.",
    roleLabel: "Rol",
    tabs: {
      orders: "Sifarişlər",
      profile: "Profil",
      password: "Parol"
    },
    orders: {
      title: "Sifarişlərim",
      subtitle: "Son checkout tarixçəsi və sifariş detalları.",
      searchPlaceholder: "Invoice, brand code, ad və ya OEM ilə axtarış",
      loading: "Sifarişlər yüklənir...",
      empty: "Hələ sifariş yoxdur.",
      invoice: "Invoice",
      actions: "Əməliyyat",
      details: "Detalları aç",
      hideDetails: "Detalları gizlət",
      detailsLoading: "Detallar yüklənir...",
      items: "Məhsul sayı",
      total: "Cəm",
      status: "Status",
      createdAt: "Tarix",
      customer: "Alıcı",
      phone: "Telefon",
      address: "Ünvan",
      comment: "Qeyd",
      noComment: "Qeyd yoxdur",
      returnItemAction: "Məhsulu geri qaytar",
      returningItemAction: "Qaytarılır...",
      returnedDone: "Qaytarma qeydə alındı.",
      returnQty: "Qaytarılacaq say",
      returnReason: "Səbəb",
      returnReasonPlaceholder: "İstəyə bağlı səbəb",
      returnedLabel: "Qaytarılıb",
      page: "Səhifə",
      prev: "Əvvəlki",
      next: "Növbəti",
      errors: {
        load: "Sifarişləri yükləmək mümkün olmadı.",
        details: "Sifariş detalları yüklənmədi.",
        returnItem: "Məhsulu geri qaytarmaq mümkün olmadı."
      }
    },
    profile: {
      title: "Ünvan və əlaqə məlumatları",
      subtitle: "Checkout zamanı məhz bu məlumatlardan istifadə olunur.",
      save: "Məlumatları yenilə",
      saving: "Yenilənir...",
      success: "Məlumatlar yeniləndi.",
      loadError: "Profil məlumatlarını yükləmək mümkün olmadı.",
      saveError: "Məlumatlar yenilənmədi.",
      avatarHint: "Profil şəkli yüklə (max 2MB).",
      avatarPick: "Avatar seç",
      avatarUploading: "Yüklənir...",
      avatarUploadError: "Avatar yüklənmədi.",
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
    subtitle: "Manage your orders and account settings.",
    roleLabel: "Role",
    tabs: {
      orders: "Orders",
      profile: "Profile",
      password: "Password"
    },
    orders: {
      title: "My orders",
      subtitle: "Your recent checkout history and order details.",
      searchPlaceholder: "Search by invoice, brand code, product or OEM",
      loading: "Loading orders...",
      empty: "You have no orders yet.",
      invoice: "Invoice",
      actions: "Actions",
      details: "Show details",
      hideDetails: "Hide details",
      detailsLoading: "Loading details...",
      items: "Items",
      total: "Total",
      status: "Status",
      createdAt: "Created",
      customer: "Customer",
      phone: "Phone",
      address: "Address",
      comment: "Comment",
      noComment: "No comment",
      returnItemAction: "Return item",
      returningItemAction: "Returning...",
      returnedDone: "Return has been submitted.",
      returnQty: "Return quantity",
      returnReason: "Reason",
      returnReasonPlaceholder: "Optional reason",
      returnedLabel: "Returned",
      page: "Page",
      prev: "Previous",
      next: "Next",
      errors: {
        load: "Failed to load orders.",
        details: "Failed to load order details.",
        returnItem: "Failed to return item."
      }
    },
    profile: {
      title: "Address and contact details",
      subtitle: "Checkout uses this profile data.",
      save: "Update details",
      saving: "Updating...",
      success: "Profile details updated.",
      loadError: "Failed to load profile details.",
      saveError: "Failed to update profile details.",
      avatarHint: "Upload profile image (max 2MB).",
      avatarPick: "Choose avatar",
      avatarUploading: "Uploading...",
      avatarUploadError: "Failed to upload avatar.",
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
    subtitle: "Управляй заказами и настройками аккаунта.",
    roleLabel: "Роль",
    tabs: {
      orders: "Заказы",
      profile: "Профиль",
      password: "Пароль"
    },
    orders: {
      title: "Мои заказы",
      subtitle: "История оформлений и подробности по заказам.",
      searchPlaceholder: "Поиск по invoice, brand code, товару или OEM",
      loading: "Загрузка заказов...",
      empty: "Пока нет заказов.",
      invoice: "Invoice",
      actions: "Действие",
      details: "Открыть детали",
      hideDetails: "Скрыть детали",
      detailsLoading: "Загрузка деталей...",
      items: "Товаров",
      total: "Итого",
      status: "Статус",
      createdAt: "Дата",
      customer: "Покупатель",
      phone: "Телефон",
      address: "Адрес",
      comment: "Комментарий",
      noComment: "Комментария нет",
      returnItemAction: "Вернуть товар",
      returningItemAction: "Возврат...",
      returnedDone: "Возврат оформлен.",
      returnQty: "Кол-во к возврату",
      returnReason: "Причина",
      returnReasonPlaceholder: "Причина (необязательно)",
      returnedLabel: "Возвращено",
      page: "Страница",
      prev: "Назад",
      next: "Вперед",
      errors: {
        load: "Не удалось загрузить заказы.",
        details: "Не удалось загрузить детали заказа.",
        returnItem: "Не удалось оформить возврат товара."
      }
    },
    profile: {
      title: "Адрес и контакты",
      subtitle: "Эти данные используются при оформлении.",
      save: "Обновить данные",
      saving: "Обновление...",
      success: "Данные профиля обновлены.",
      loadError: "Не удалось загрузить данные профиля.",
      saveError: "Не удалось обновить данные профиля.",
      avatarHint: "Загрузи аватар (до 2MB).",
      avatarPick: "Выбрать аватар",
      avatarUploading: "Загрузка...",
      avatarUploadError: "Не удалось загрузить аватар.",
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
  {id: "profile", icon: UserRound},
  {id: "password", icon: LockKeyhole}
];

export default function AccountPage({language, user}: AccountPageProps) {
  const ui = copy[language];
  const [activeTab, setActiveTab] = useState<AccountTab>("orders");

  const [profile, setProfile] = useState<AccountProfilePayload>(emptyProfile);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileAvatarUploading, setProfileAvatarUploading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const [ordersPage, setOrdersPage] = useState<UserOrderPage | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [ordersSuccess, setOrdersSuccess] = useState<string | null>(null);
  const [returningItemKey, setReturningItemKey] = useState<string | null>(null);
  const [ordersPageIndex, setOrdersPageIndex] = useState(0);
  const [ordersQueryInput, setOrdersQueryInput] = useState("");
  const [ordersQuery, setOrdersQuery] = useState("");
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
    void loadOrders(ordersPageIndex, ordersQuery);
  }, [activeTab, ordersPageIndex, ordersQuery, language]);

  useEffect(() => {
    if (activeTab !== "orders") {
      return;
    }
    const timer = window.setTimeout(() => {
      setOrdersQuery(ordersQueryInput.trim());
      setOrdersPageIndex(0);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [activeTab, ordersQueryInput]);

  async function loadProfile() {
    try {
      setProfileLoading(true);
      const data = await fetchAccountProfile();
      setProfile({
        fullName: data.fullName ?? "",
        avatarUrl: data.avatarUrl ?? "",
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
      setProfileError(ui.profile.loadError);
    } finally {
      setProfileLoading(false);
    }
  }

  async function loadOrders(pageIndex: number, query: string) {
    try {
      setOrdersLoading(true);
      const data = await fetchMyOrders({page: pageIndex, size: 10, query});
      setOrdersPage(data);
      setOrdersError(null);
      setOrdersSuccess(null);
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

  async function handleReturnOrderItem(orderId: number, itemId: number, quantity: number, reason: string) {
    const itemKey = `${orderId}:${itemId}`;
    try {
      setReturningItemKey(itemKey);
      setOrdersError(null);
      const updated = await requestOrderItemReturn(orderId, itemId, {
        quantity,
        reason: reason.trim().length > 0 ? reason.trim() : undefined
      });
      setOrderDetailsById((prev) => ({...prev, [orderId]: updated}));
      setOrdersPage((prev) =>
        prev
          ? {
            ...prev,
            content: prev.content.map((order) => (order.id === orderId ? {...order, status: updated.status} : order))
          }
          : prev
      );
      setOrdersSuccess(ui.orders.returnedDone);
    } catch (requestError) {
      setOrdersError(getApiErrorMessage(requestError) ?? ui.orders.errors.returnItem);
    } finally {
      setReturningItemKey(null);
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
        avatarUrl: updated.avatarUrl ?? "",
        phone: updated.phone ?? "",
        phoneAlt: updated.phoneAlt ?? "",
        addressLine1: updated.addressLine1 ?? "",
        addressLine2: updated.addressLine2 ?? "",
        city: updated.city ?? "",
        postalCode: updated.postalCode ?? "",
        country: updated.country ?? ""
      });
      setProfileSuccess(ui.profile.success);
    } catch (error) {
      setProfileError(getApiErrorMessage(error) ?? ui.profile.saveError);
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      setProfileError(ui.profile.avatarUploadError);
      setProfileSuccess(null);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setProfileError(ui.profile.avatarUploadError);
      setProfileSuccess(null);
      return;
    }

    try {
      setProfileAvatarUploading(true);
      setProfileError(null);
      setProfileSuccess(null);
      const avatarUrl = await fileToDataUrl(file);
      const updated = await updateAccountProfile({...profile, avatarUrl});
      setProfile({
        fullName: updated.fullName ?? "",
        avatarUrl: updated.avatarUrl ?? "",
        phone: updated.phone ?? "",
        phoneAlt: updated.phoneAlt ?? "",
        addressLine1: updated.addressLine1 ?? "",
        addressLine2: updated.addressLine2 ?? "",
        city: updated.city ?? "",
        postalCode: updated.postalCode ?? "",
        country: updated.country ?? ""
      });
      setProfileSuccess(ui.profile.success);
    } catch (error) {
      setProfileError(getApiErrorMessage(error) ?? ui.profile.avatarUploadError);
    } finally {
      setProfileAvatarUploading(false);
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
            <label className="relative mt-3 block">
              <Search className="theme-muted pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <input
                value={ordersQueryInput}
                onChange={(event) => setOrdersQueryInput(event.target.value)}
                placeholder={ui.orders.searchPlaceholder}
                className="input-surface w-full rounded-xl border py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand-300"
              />
            </label>

            {ordersLoading && <p className="theme-muted mt-4 text-sm">{ui.orders.loading}</p>}
            {ordersError && <p className="mt-4 rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{ordersError}</p>}
            {ordersSuccess && <p className="mt-4 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">{ordersSuccess}</p>}

            {!ordersLoading && (ordersPage?.content.length ?? 0) === 0 && (
              <p className="theme-muted mt-4 text-sm">{ui.orders.empty}</p>
            )}

            {ordersPage && ordersPage.content.length > 0 && (
              <div className="mt-4 overflow-x-auto rounded-xl border border-white/12">
                <table className="min-w-[760px] w-full border-collapse text-sm">
                  <thead className="bg-brand-500/10">
                    <tr className="border-b border-white/12">
                      <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wide theme-muted">{ui.orders.invoice}</th>
                      <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wide theme-muted">{ui.orders.status}</th>
                      <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wide theme-muted">{ui.orders.items}</th>
                      <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wide theme-muted">{ui.orders.total}</th>
                      <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wide theme-muted">{ui.orders.createdAt}</th>
                      <th className="px-3 py-2 text-right text-[11px] uppercase tracking-wide theme-muted">{ui.orders.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersPage.content.flatMap((order) => {
                      const rows = [
                        <tr key={`order-${order.id}`} className="border-t border-white/10 align-top">
                          <td className="px-3 py-2.5">
                            <p className="theme-heading font-semibold">{order.invoiceNumber}</p>
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="theme-text">{order.status}</p>
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="theme-text">{order.itemCount}</p>
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="font-semibold text-brand-200">{Number(order.totalAmount).toFixed(2)} {order.currencyCode}</p>
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="theme-text whitespace-nowrap">{new Date(order.createdAt).toLocaleString()}</p>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => void toggleOrderDetails(order.id)}
                              className="inline-flex items-center gap-2 rounded-lg border border-brand-500/35 bg-brand-500/10 px-3 py-1.5 text-xs text-brand-100 transition hover:bg-brand-500/20"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              {expandedOrderId === order.id ? ui.orders.hideDetails : ui.orders.details}
                            </button>
                          </td>
                        </tr>
                      ];

                      if (expandedOrderId === order.id) {
                        rows.push(
                          <tr key={`order-details-${order.id}`} className="border-t border-white/10">
                            <td colSpan={6} className="px-3 py-3">
                              {detailsLoadingId === order.id ? (
                                <p className="theme-muted text-sm">{ui.orders.detailsLoading}</p>
                              ) : (
                                orderDetailsById[order.id] && (
                                  <OrderDetailsBlock
                                    details={orderDetailsById[order.id]}
                                    ui={ui.orders}
                                    canReturn={canReturnOrder(orderDetailsById[order.id].status)}
                                    returningItemKey={returningItemKey}
                                    onReturnItem={(itemId, quantity, reason) => void handleReturnOrderItem(order.id, itemId, quantity, reason)}
                                  />
                                )
                              )}
                            </td>
                          </tr>
                        );
                      }

                      return rows;
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOrdersPageIndex((prev) => Math.max(prev - 1, 0))}
                disabled={ordersPageIndex === 0 || ordersLoading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-brand-500/35 bg-brand-500/12 px-3.5 py-2 text-sm font-semibold text-brand-100 shadow-[0_8px_20px_rgba(0,0,0,0.25)] transition hover:border-brand-400 hover:bg-brand-500/22 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                {ui.orders.prev}
              </button>
              <span className="rounded-xl border border-white/12 bg-brand-500/8 px-3 py-2 text-xs font-medium theme-text">
                {ui.orders.page} {pageNumberLabel} / {Math.max(totalPages, 1)}
              </span>
              <button
                type="button"
                onClick={() => setOrdersPageIndex((prev) => prev + 1)}
                disabled={Boolean(ordersPage?.last) || ordersLoading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-brand-500/35 bg-brand-500/12 px-3.5 py-2 text-sm font-semibold text-brand-100 shadow-[0_8px_20px_rgba(0,0,0,0.25)] transition hover:border-brand-400 hover:bg-brand-500/22 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
              >
                {ui.orders.next}
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.section>
        )}

        {activeTab === "profile" && (
          <motion.section
            key="tab-profile"
            initial={{opacity: 0, y: 8}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -8}}
            className="glass-card rounded-2xl p-5 sm:p-6"
          >
            <h2 className="theme-heading text-lg font-semibold">{ui.profile.title}</h2>
            <p className="theme-text mt-1 text-sm">{ui.profile.subtitle}</p>

            <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-brand-500/20 bg-brand-500/8 px-4 py-3">
              <div className="relative h-16 w-16 overflow-hidden rounded-full border border-brand-500/35 bg-black/25">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.fullName || "User avatar"} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-brand-200">
                    <Camera className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="min-w-[220px] flex-1">
                <p className="theme-text text-sm">{ui.profile.avatarHint}</p>
                <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-brand-500/35 bg-brand-500/10 px-3 py-1.5 text-xs text-brand-100 transition hover:bg-brand-500/20">
                  <input type="file" accept="image/*" onChange={(event) => void handleAvatarUpload(event)} className="sr-only" />
                  <Camera className="h-3.5 w-3.5" />
                  {profileAvatarUploading ? ui.profile.avatarUploading : ui.profile.avatarPick}
                </label>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-4 grid gap-3 sm:grid-cols-2">
              {editableProfileFields.map((field) => (
                <label key={field} className={`block text-sm ${field === "addressLine1" || field === "addressLine2" ? "sm:col-span-2" : ""}`}>
                  <span className="theme-text mb-1 block">{ui.profile.fields[field]}</span>
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
                {profileSaving ? ui.profile.saving : ui.profile.save}
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
  canReturn,
  returningItemKey,
  onReturnItem
}: {
  details: UserOrderDetails;
  ui: {
    customer: string;
    phone: string;
    address: string;
    comment: string;
    noComment: string;
    returnItemAction: string;
    returningItemAction: string;
    returnQty: string;
    returnReason: string;
    returnReasonPlaceholder: string;
    returnedLabel: string;
  };
  canReturn: boolean;
  returningItemKey: string | null;
  onReturnItem: (itemId: number, quantity: number, reason: string) => void;
}) {
  const [returnQtyByItem, setReturnQtyByItem] = useState<Record<number, number>>({});
  const [returnReasonByItem, setReturnReasonByItem] = useState<Record<number, string>>({});

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
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
          <div key={`${item.id}-${item.productId ?? "no"}-${index}`} className="rounded-lg border border-white/10 px-3 py-2">
            <p className="theme-heading text-sm">{item.productName}</p>
            <p className="theme-muted text-xs">
              Brand code: {item.productSku} · {item.quantity} × {Number(item.unitPrice).toFixed(2)} {details.currencyCode}
            </p>
            {item.returnedQuantity > 0 && (
              <p className="theme-muted mt-1 text-xs">
                {ui.returnedLabel}: {item.returnedQuantity}
              </p>
            )}
            {item.returnReason && <p className="theme-muted mt-1 whitespace-pre-line text-xs">{item.returnReason}</p>}
            <p className="text-sm font-semibold text-brand-200">{Number(item.lineTotal).toFixed(2)} {details.currencyCode}</p>

            {canReturn && item.quantity - item.returnedQuantity > 0 && (
              <div className="mt-2 grid gap-2 sm:grid-cols-[120px,1fr,auto]">
                <label className="text-xs theme-text">
                  <span className="mb-1 block">{ui.returnQty}</span>
                  <input
                    type="number"
                    min={1}
                    max={Math.max(item.quantity - item.returnedQuantity, 1)}
                    value={returnQtyByItem[item.id] ?? 1}
                    onChange={(event) => {
                      const parsed = Number(event.target.value);
                      const safeValue = Number.isFinite(parsed) ? Math.max(1, Math.min(Math.trunc(parsed), item.quantity - item.returnedQuantity)) : 1;
                      setReturnQtyByItem((previous) => ({...previous, [item.id]: safeValue}));
                    }}
                    className="input-surface w-full rounded-lg border px-2 py-1.5 text-sm outline-none"
                  />
                </label>
                <label className="text-xs theme-text">
                  <span className="mb-1 block">{ui.returnReason}</span>
                  <input
                    type="text"
                    value={returnReasonByItem[item.id] ?? ""}
                    onChange={(event) => setReturnReasonByItem((previous) => ({...previous, [item.id]: event.target.value}))}
                    placeholder={ui.returnReasonPlaceholder}
                    className="input-surface w-full rounded-lg border px-2 py-1.5 text-sm outline-none"
                  />
                </label>
                <button
                  type="button"
                  disabled={returningItemKey === `${details.id}:${item.id}`}
                  onClick={() => {
                    const quantity = returnQtyByItem[item.id] ?? 1;
                    const reason = returnReasonByItem[item.id] ?? "";
                    onReturnItem(item.id, quantity, reason);
                  }}
                  className="self-end rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-100 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {returningItemKey === `${details.id}:${item.id}` ? ui.returningItemAction : ui.returnItemAction}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function canReturnOrder(status: UserOrderDetails["status"]): boolean {
  return status === "COMPLETED" || status === "SHIPPED" || status === "PARTIALLY_RETURNED";
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

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read avatar file."));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string" && result.length > 0) {
        resolve(result);
        return;
      }
      reject(new Error("Invalid avatar file."));
    };
    reader.readAsDataURL(file);
  });
}

function getInitials(fullName: string): string {
  const normalized = fullName.trim();
  if (!normalized) {
    return "RS";
  }
  const parts = normalized.split(/\s+/).slice(0, 2);
  const initials = parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
  return initials || "RS";
}
