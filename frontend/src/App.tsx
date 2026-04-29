import {
  changePassword,
  fetchAccountProfile,
  fetchCurrencyRate,
  fetchCurrentUser,
  logout,
  updateAccountProfile
} from "@/api/client";
import SiteFooter from "@/components/SiteFooter";
import StartupLoader from "@/components/StartupLoader";
import RichstokLogo from "@/components/logo/RichstokLogo";
import {CartProvider, useCart} from "@/context/CartContext";
import AccountPage from "@/pages/AccountPage";
import AdminPage from "@/pages/AdminPage";
import CartPage from "@/pages/CartPage";
import LoginPage from "@/pages/LoginPage";
import ProductDetailsPage from "@/pages/ProductDetailsPage";
import PublicGatewayPage from "@/pages/PublicGatewayPage";
import StorePage from "@/pages/StorePage";
import type {AccountProfile, AccountProfilePayload, AuthUser} from "@/types/auth";
import type {DisplayCurrency} from "@/types/currency";
import type {Product} from "@/types/product";
import type {Language, ThemeMode} from "@/types/ui";
import {DEFAULT_DISPLAY_RATES, DISPLAY_CURRENCIES, getCurrencySymbol, resolveDisplayCurrency} from "@/utils/currency";
import {AnimatePresence, motion} from "framer-motion";
import {
  Camera,
  CheckCircle2,
  Coins,
  Eye,
  EyeOff,
  Home,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPin,
  Moon,
  Phone,
  ReceiptText,
  RotateCcw,
  Search,
  Settings2,
  ShoppingCart,
  Sparkles,
  Sun,
  UserRound,
  X
} from "lucide-react";
import type {ChangeEvent, FormEvent, ReactNode} from "react";
import {useEffect, useMemo, useRef, useState} from "react";
import type {Location} from "react-router-dom";
import {Link, Navigate, Route, Routes, useLocation, useNavigate} from "react-router-dom";


const labels: Record<
    Language,
    {
      store: string;
      account: string;
      admin: string;
      cart: string;
      home: string;
      search: string;
      accountBalance: string;
      orders: string;
      returns: string;
      profileDetails: string;
      address: string;
      phone: string;
      noAddress: string;
      noPhone: string;
      profileLoadError: string;
      changePassword: string;
      currentPassword: string;
      newPassword: string;
      repeatPassword: string;
      savePassword: string;
      saving: string;
      passwordMismatch: string;
      passwordUpdated: string;
      passwordUpdateError: string;
      language: string;
      authButton: string;
      signOut: string;
      currency: string;
      themeDark: string;
      themeLight: string;
      catalog: string;
      categories: string;
      brands: string;
      adminOnlyTitle: string;
      adminOnlyBody: string;
      authOnlyTitle: string;
      authOnlyBody: string;
      toStore: string;
      addedToCart: string;
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
    }
> = {
  az: {
    store: "Mağaza",
    account: "Kabinet",
    admin: "Admin",
    cart: "Səbət",
    home: "Əsas səhifə",
    search: "Axtar",
    accountBalance: "Cari hesab",
    orders: "Sifarişlər",
    returns: "Qaytarma",
    profileDetails: "Profil məlumatları",
    address: "Ünvan",
    phone: "Telefon",
    noAddress: "Ünvan daxil edilməyib",
    noPhone: "Telefon daxil edilməyib",
    profileLoadError: "Profil məlumatları yüklənmədi.",
    changePassword: "Parolu dəyiş",
    currentPassword: "Cari parol",
    newPassword: "Yeni parol",
    repeatPassword: "Yeni parol təkrarı",
    savePassword: "Yadda saxla",
    saving: "Yadda saxlanır...",
    passwordMismatch: "Yeni parollar eyni deyil.",
    passwordUpdated: "Parol yeniləndi.",
    passwordUpdateError: "Parolu yeniləmək alınmadı.",
    language: "Dil",
    authButton: "Giriş",
    signOut: "Çıxış",
    currency: "Valyuta",
    themeDark: "Qaranlıq",
    themeLight: "Açıq",
    catalog: "Kataloq",
    categories: "Kateqoriyalar",
    brands: "Brendlər",
    adminOnlyTitle: "Admin girişi tələb olunur",
    adminOnlyBody: "Bu bölmə yalnız ADMIN hüququ olan istifadəçilər üçündür.",
    authOnlyTitle: "Giriş tələb olunur",
    authOnlyBody: "Bu bölməni açmaq üçün hesabına daxil ol.",
    toStore: "Mağazaya qayıt",
    addedToCart: "Məhsul səbətə əlavə olundu",
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
  },
  en: {
    store: "Store",
    account: "Account",
    admin: "Admin",
    cart: "Cart",
    home: "Home",
    search: "Search",
    accountBalance: "Account",
    orders: "Orders",
    returns: "Returns",
    profileDetails: "Profile details",
    address: "Address",
    phone: "Phone",
    noAddress: "Address is not set",
    noPhone: "Phone is not set",
    profileLoadError: "Failed to load profile details.",
    changePassword: "Change password",
    currentPassword: "Current password",
    newPassword: "New password",
    repeatPassword: "Repeat password",
    savePassword: "Save",
    saving: "Saving...",
    passwordMismatch: "New passwords do not match.",
    passwordUpdated: "Password updated.",
    passwordUpdateError: "Failed to update password.",
    language: "Language",
    authButton: "Login",
    signOut: "Sign out",
    currency: "Currency",
    themeDark: "Dark",
    themeLight: "Light",
    catalog: "Catalog",
    categories: "Categories",
    brands: "Brands",
    adminOnlyTitle: "Admin access required",
    adminOnlyBody: "This section is available only for ADMIN role users.",
    authOnlyTitle: "Authentication required",
    authOnlyBody: "Please sign in to open this section.",
    toStore: "Back to store",
    addedToCart: "Product added to cart",
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
  },
  ru: {
    store: "Магазин",
    account: "Кабинет",
    admin: "Админ",
    cart: "Корзина",
    home: "Главная",
    search: "Поиск",
    accountBalance: "Текущий счет",
    orders: "Заказы",
    returns: "Возврат",
    profileDetails: "Данные профиля",
    address: "Адрес",
    phone: "Телефон",
    noAddress: "Адрес не указан",
    noPhone: "Телефон не указан",
    profileLoadError: "Не удалось загрузить данные профиля.",
    changePassword: "Смена пароля",
    currentPassword: "Текущий пароль",
    newPassword: "Новый пароль",
    repeatPassword: "Повтор пароля",
    savePassword: "Сохранить",
    saving: "Сохранение...",
    passwordMismatch: "Новые пароли не совпадают.",
    passwordUpdated: "Пароль обновлен.",
    passwordUpdateError: "Не удалось обновить пароль.",
    language: "Язык",
    authButton: "Вход",
    signOut: "Выход",
    currency: "Валюта",
    themeDark: "Темная",
    themeLight: "Светлая",
    catalog: "Каталог",
    categories: "Категории",
    brands: "Бренды",
    adminOnlyTitle: "Нужен доступ администратора",
    adminOnlyBody: "Раздел доступен только для пользователей с ролью ADMIN.",
    authOnlyTitle: "Нужен вход в аккаунт",
    authOnlyBody: "Войди в аккаунт, чтобы открыть этот раздел.",
    toStore: "Вернуться в магазин",
    addedToCart: "Товар добавлен в корзину",
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
  }
};


function getInitialTheme(): ThemeMode {
  const savedTheme = localStorage.getItem("richstok-theme") as ThemeMode | null;
  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }
  const currentHour = new Date().getHours();
  return currentHour >= 20 || currentHour < 7 ? "dark" : "light";
}

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function isB4BHost() {
  if (typeof window === "undefined") {
    return true;
  }
  const hostname = window.location.hostname;
  return hostname.startsWith("b4b.") || isLocalHost(hostname);
}

function resolveB4BLoginUrl() {
  if (typeof window === "undefined") {
    return "https://b4b.richstok.com/login";
  }
  const {protocol, hostname, port} = window.location;
  if (isLocalHost(hostname)) {
    const resolvedPort = port || "5173";
    return `${protocol}//${hostname}:${resolvedPort}/login`;
  }
  if (hostname.endsWith("richstok.com")) {
    return `${protocol}//b4b.richstok.com/login`;
  }
  return "https://b4b.richstok.com/login";
}

function getInitials(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return "U";
  }
  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function normalizeDisplayValue(value: string | null | undefined, fallback: string) {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : fallback;
}

function buildAddressLine(profile: AccountProfile | null, fallback: string) {
  if (!profile) {
    return fallback;
  }
  const parts = [profile.addressLine1, profile.addressLine2, profile.city, profile.postalCode, profile.country]
      .map((item) => item?.trim())
      .filter((item): item is string => Boolean(item));
  return parts.length > 0 ? parts.join(", ") : fallback;
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

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isBooting, setIsBooting] = useState(true);
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem("richstok-language") as Language) || "az");
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getInitialTheme());
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>(() => resolveDisplayCurrency(localStorage.getItem("richstok-display-currency")));
  const [currencyBaseCode, setCurrencyBaseCode] = useState("AZN");
  const [currencyRates, setCurrencyRates] = useState<Record<string, number>>(() => ({...DEFAULT_DISPLAY_RATES}));
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [accountProfile, setAccountProfile] = useState<AccountProfile | null>(null);
  const [accountProfileLoading, setAccountProfileLoading] = useState(false);
  const [accountProfileError, setAccountProfileError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [cartToast, setCartToast] = useState<{id: number; text: string} | null>(null);
  const [cartPulseId, setCartPulseId] = useState(0);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const toastIdRef = useRef(0);
  const pendingSectionRef = useRef<string | null>(null);
  const preferencesRef = useRef<HTMLDivElement | null>(null);
  const profilePanelRef = useRef<HTMLDivElement | null>(null);
  const b4bMode = useMemo(() => isB4BHost(), []);
  const b4bLoginUrl = useMemo(() => resolveB4BLoginUrl(), []);
  const accountSearchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const accountTabParam = accountSearchParams.get("tab");
  const accountModeParam = accountSearchParams.get("mode");
  const isAdmin = authUser?.role === "ADMIN";
  const [currentDebt, setCurrentDebt] = useState(0);
  const ui = labels[language];

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

  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileAvatarUploading, setProfileAvatarUploading] = useState(false);
  const [profile, setProfile] = useState<AccountProfilePayload>(emptyProfile);



  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsBooting(false);
    }, 900);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeMode);
    localStorage.setItem("richstok-theme", themeMode);
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem("richstok-language", language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem("richstok-display-currency", displayCurrency);
  }, [displayCurrency]);

  useEffect(() => {
    if (!b4bMode) {
      setAuthChecked(true);
      setAuthUser(null);
      setAccountProfile(null);
      return;
    }
    void (async () => {
      try {
        const user = await fetchCurrentUser();
        setAuthUser(user);
      } catch {
        setAuthUser(null);
      } finally {
        setAuthChecked(true);
      }
    })();
  }, [b4bMode]);

  useEffect(() => {
    if (!authUser) {
      setAccountProfile(null);
      setAccountProfileError(null);
      return;
    }
    void loadAccountProfile();
  }, [authUser]);

  useEffect(() => {
    void (async () => {
      try {
        const data = await fetchCurrencyRate();
        setCurrencyBaseCode(data.baseCode || "AZN");
        setCurrencyRates({
          ...DEFAULT_DISPLAY_RATES,
          ...data.conversionRates,
          AZN: 1
        });
      } catch {
        setCurrencyBaseCode("AZN");
        setCurrencyRates({...DEFAULT_DISPLAY_RATES});
      }
    })();
  }, []);

  useEffect(() => {
    if (location.pathname !== "/") {
      return;
    }
    if (!pendingSectionRef.current) {
      return;
    }
    const sectionId = pendingSectionRef.current;
    const timer = window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({behavior: "smooth", block: "start"});
      pendingSectionRef.current = null;
    }, 120);
    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    const handleOutside = (event: MouseEvent | TouchEvent) => {
      if (!preferencesRef.current) {
        return;
      }
      if (event.target instanceof Node && preferencesRef.current.contains(event.target)) {
        return;
      }
      setPreferencesOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreferencesOpen(false);
        setProfilePanelOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside, {passive: true});
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!cartToast) {
      return;
    }
    const timer = window.setTimeout(() => {
      setCartToast(null);
    }, 1700);
    return () => window.clearTimeout(timer);
  }, [cartToast]);

  useEffect(() => {
    if (!authUser) {
      setCartItemsCount(0);
      setProfilePanelOpen(false);
    }
  }, [authUser]);

  async function loadAccountProfile() {
    try {
      setAccountProfileLoading(true);
      const data = await fetchAccountProfile();
      setAccountProfile(data);
      setAccountProfileError(null);
    } catch {
      setAccountProfileError(ui.profileLoadError);
    } finally {
      setAccountProfileLoading(false);
    }
  }

  async function openProfilePanel() {
    setProfilePanelOpen(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    if (!accountProfile && authUser) {
      await loadAccountProfile();
    }
  }

  function openAuth() {
    if (!b4bMode) {
      const from = `${location.pathname}${location.search}${location.hash}`;
      navigate("/b4b-access", {state: {from}});
      return;
    }
    if (location.pathname === "/login") {
      return;
    }
    const from = `${location.pathname}${location.search}${location.hash}`;
    navigate("/login", {state: {from}});
  }

  async function handleLogout() {
    await logout();
    setAuthUser(null);
    setProfilePanelOpen(false);
    if (b4bMode) {
      navigate("/login", {replace: true});
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    if (newPassword !== repeatPassword) {
      setPasswordError(ui.passwordMismatch);
      return;
    }
    try {
      setPasswordSaving(true);
      await changePassword({currentPassword, newPassword});
      setCurrentPassword("");
      setNewPassword("");
      setRepeatPassword("");
      setPasswordSuccess(ui.passwordUpdated);
    } catch (error) {
      setPasswordError(getApiErrorMessage(error) ?? ui.passwordUpdateError);
    } finally {
      setPasswordSaving(false);
    }
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
      setCurrentDebt(normalizeMoney(updated.currentDebt));
      setProfileSuccess(ui.profile.success);
    } catch (error) {
      setProfileError(getApiErrorMessage(error) ?? ui.profile.avatarUploadError);
    } finally {
      setProfileAvatarUploading(false);
    }
  }

  function normalizeMoney(value: unknown) {
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed)) {
      return 0;
    }
    return Math.max(0, parsed);
  }

  function goStoreSection(sectionId: "catalog" | "categories" | "brands") {
    if (location.pathname !== "/") {
      pendingSectionRef.current = sectionId;
      navigate("/");
      return;
    }
    document.getElementById(sectionId)?.scrollIntoView({behavior: "smooth", block: "start"});
  }

  function notifyAddedToCart() {
    toastIdRef.current += 1;
    setCartToast({id: toastIdRef.current, text: ui.addedToCart});
    setCartPulseId((previous) => previous + 1);
  }

  return (
      <CartProvider authUser={authUser}>
        <div className="app-shell relative flex min-h-screen flex-col bg-transparent">
          <AnimatePresence>{isBooting && <StartupLoader language={language} />}</AnimatePresence>

          <motion.header
              initial={{y: 0}}
              animate={{y: 0}}
              transition={{duration: 0.25, ease: "easeOut"}}
              className="header-surface sticky top-0 z-[90] overflow-x-clip border-b backdrop-blur-xl"
          >
            <div className="mx-auto flex min-w-0 w-full max-w-[1360px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
              <motion.div
                  initial={{opacity: 0, y: -10, scale: 0.98}}
                  animate={{opacity: 1, y: 0, scale: 1}}
                  transition={{duration: 0.5, delay: 0.18}}
                  whileHover={{scale: 1.01}}
                  className="logo-shell relative shrink-0 overflow-hidden rounded-xl border p-2"
              >
                <RichstokLogo className="h-14 sm:h-16 lg:h-[4.5rem]" />
              </motion.div>

              <div className="flex min-w-0 w-full flex-1 flex-wrap items-center justify-end gap-2 sm:w-auto">
                {authUser &&
                    (isAdmin ? (
                        <nav className="glass-card flex min-w-0 max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-brand-500/20 p-1.5">
                          <NavLink to="/admin" active={location.pathname.startsWith("/admin")}>
                            <LayoutDashboard className="h-4 w-4" />
                            {ui.admin}
                          </NavLink>
                        </nav>
                    ) : (
                        <nav className="user-nav-shell theme-text flex min-w-0 max-w-full items-center gap-1 overflow-x-auto rounded-2xl p-1.5">
                          <HeaderActionLink to="/" active={location.pathname === "/"}>
                            <Home className="h-[18px] w-[18px]" />
                            {ui.home}
                          </HeaderActionLink>

                          <HeaderActionButton
                              active={location.pathname === "/"}
                              onClick={() => goStoreSection("catalog")}
                          >
                            <Search className="h-[18px] w-[18px]" />
                            {ui.search}
                          </HeaderActionButton>

                          <HeaderActionLink
                              to="/account?tab=orders&mode=history"
                              active={
                                  location.pathname.startsWith("/account") &&
                                  (!accountTabParam || accountTabParam === "orders") &&
                                  (!accountModeParam || accountModeParam === "history")
                              }
                          >
                            <ReceiptText className="h-[18px] w-[18px]" />
                            {ui.accountBalance}
                          </HeaderActionLink>

                          <HeaderActionLink to="/cart" active={location.pathname.startsWith("/cart")}>
                    <span className="relative inline-flex">
                      <motion.span
                          key={cartPulseId}
                          initial={{scale: 1, rotate: 0}}
                          animate={{scale: [1, 1.22, 1], rotate: [0, -8, 8, 0]}}
                          transition={{duration: 0.55, ease: "easeInOut"}}
                          className="inline-flex"
                      >
                        <ShoppingCart className="h-[18px] w-[18px]" />
                      </motion.span>
                      {cartItemsCount > 0 && (
                          <span className="absolute -right-2 -top-2 inline-flex min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold leading-5 text-white shadow-md">
                          {Math.min(cartItemsCount, 99)}
                        </span>
                      )}
                    </span>
                            {ui.cart}
                          </HeaderActionLink>

                          <HeaderActionLink to="/account?tab=orders&mode=returns" active={location.pathname.startsWith("/account") && (!accountTabParam || accountTabParam === "orders") && accountModeParam === "returns"}>
                            <RotateCcw className="h-[18px] w-[18px]" />
                            {ui.returns}
                          </HeaderActionLink>
                        </nav>
                    ))}
                <div className="user-nav-side-shell flex shrink-0 items-center gap-2 rounded-xl px-2 py-1">
                  <Coins className="h-4 w-4 text-brand-200" />
                  <label className="sr-only" htmlFor="display-currency-select">
                    {ui.currency}
                  </label>
                  <select
                      id="display-currency-select"
                      value={displayCurrency}
                      onChange={(event) => setDisplayCurrency(resolveDisplayCurrency(event.target.value))}
                      className="bg-transparent text-xs font-medium theme-text outline-none"
                      aria-label={ui.currency}
                  >
                    {DISPLAY_CURRENCIES.map((code) => (
                        <option key={code} value={code}>
                          {code} {getCurrencySymbol(code)}
                        </option>
                    ))}
                  </select>
                </div>

                <div ref={preferencesRef} className="relative z-[130]">
                  <button
                      type="button"
                      aria-label={`${ui.language} & ${ui.themeDark}/${ui.themeLight}`}
                      onClick={() => setPreferencesOpen((prev) => !prev)}
                      className="user-nav-side-shell inline-flex h-9 w-9 items-center justify-center rounded-xl transition hover:border-brand-300"
                  >
                    <Settings2 className="h-4 w-4 theme-text" />
                  </button>

                  <AnimatePresence>
                    {preferencesOpen && (
                        <motion.div
                            initial={{opacity: 0, y: -8, scale: 0.98}}
                            animate={{opacity: 1, y: 0, scale: 1}}
                            exit={{opacity: 0, y: -6, scale: 0.98}}
                            transition={{duration: 0.18}}
                            className="glass-card absolute right-0 top-[calc(100%+8px)] z-[120] w-52 rounded-xl border border-brand-500/20 p-2"
                        >
                          <p className="theme-muted px-2 py-1 text-[11px] uppercase tracking-[0.14em]">{ui.language}</p>
                          <div className="mb-2 flex items-center gap-1 px-1">
                            {(["az", "en", "ru"] as Language[]).map((item) => (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => {
                                      setLanguage(item);
                                      setPreferencesOpen(false);
                                    }}
                                    className={`rounded-md px-2 py-1 text-xs font-medium uppercase tracking-wide transition ${language === item ? "bg-brand-600 text-white" : "theme-text hover:bg-brand-600/20"}`}
                                    aria-label={`${ui.language}: ${item.toUpperCase()}`}
                                >
                                  {item}
                                </button>
                            ))}
                          </div>

                          <p className="theme-muted px-2 py-1 text-[11px] uppercase tracking-[0.14em]">{ui.themeDark} / {ui.themeLight}</p>
                          <button
                              type="button"
                              onClick={() => {
                                setThemeMode((prev) => (prev === "dark" ? "light" : "dark"));
                                setPreferencesOpen(false);
                              }}
                              className="theme-text flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs transition hover:bg-brand-600/20"
                          >
                            <span>{themeMode === "dark" ? ui.themeDark : ui.themeLight}</span>
                            {themeMode === "dark" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
                          </button>
                        </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {!authChecked ? null : authUser ? (
                    <div className="user-nav-side-shell flex min-w-0 max-w-full items-center gap-2 rounded-xl px-2 py-1.5">
                      <button
                          type="button"
                          onClick={() => void openProfilePanel()}
                          className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-brand-400/40 bg-black/20 transition hover:border-brand-300"
                          aria-label={ui.profileDetails}
                      >
                        {authUser.avatarUrl ? (
                            <img src={authUser.avatarUrl} alt={authUser.fullName} className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                            <span className="text-[11px] font-semibold text-brand-100">
                      {getInitials(authUser.fullName)}
                    </span>
                        )}
                      </button>
                      <div className="min-w-0 text-left sm:hidden">
                        <p className="theme-heading truncate text-xs font-medium leading-tight">{authUser.fullName}</p>
                        <p className="theme-muted truncate text-[11px]">
                          {normalizeDisplayValue(accountProfile?.phone || accountProfile?.phoneAlt, ui.noPhone)}
                        </p>
                      </div>
                      <button type="button" onClick={() => void handleLogout()} className="inline-flex items-center gap-1 rounded-md border border-brand-500/35 bg-brand-500/10 px-2.5 py-1.5 text-xs text-brand-100 transition hover:bg-brand-500/20">
                        <LogOut className="h-3.5 w-3.5" />
                        {ui.signOut}
                      </button>
                    </div>
                ) : b4bMode ? (
                    <Link
                        to="/login"
                        aria-label={ui.authButton}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-brand-600 to-pulse-500 text-white transition hover:opacity-90"
                    >
                      <LogIn className="h-4 w-4" />
                    </Link>
                ) : (
                    <a
                        href={b4bLoginUrl}
                        aria-label={ui.authButton}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-brand-600 to-pulse-500 text-white transition hover:opacity-90"
                    >
                      <LogIn className="h-4 w-4" />
                    </a>
                )}
              </div>
            </div>
          </motion.header>

          <AnimatePresence>
            {profilePanelOpen && authUser && (
                <motion.div
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    exit={{opacity: 0}}
                    className="fixed inset-0 z-[140] bg-black/45 p-4 backdrop-blur-[2px] sm:p-6"
                    onClick={() => setProfilePanelOpen(false)}
                >
                  <motion.section
                      ref={profilePanelRef}
                      initial={{opacity: 0, y: 12, scale: 0.98}}
                      animate={{opacity: 1, y: 0, scale: 1}}
                      exit={{opacity: 0, y: 8, scale: 0.98}}
                      transition={{duration: 0.2}}
                      className="glass-card mx-auto max-w-xl rounded-2xl p-5"
                      onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-brand-400/40 bg-black/20">
                          {authUser.avatarUrl ? (
                              <img src={authUser.avatarUrl} alt={authUser.fullName} className="h-12 w-12 rounded-full object-cover" />
                          ) : (
                              <span className="text-sm font-semibold text-brand-100">{getInitials(authUser.fullName)}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="theme-heading truncate text-sm font-semibold">{authUser.fullName}</p>
                          <p className="theme-muted truncate text-xs">{authUser.email}</p>
                        </div>
                      </div>
                      <button
                          type="button"
                          onClick={() => setProfilePanelOpen(false)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 theme-text transition hover:border-brand-400/50"
                          aria-label="close profile panel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

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

                    <div className="mt-4 grid gap-2 rounded-xl border border-white/12 bg-black/15 p-3">
                      <p className="theme-heading text-sm">{ui.profileDetails}</p>
                      <p className="theme-text flex items-start gap-2 text-xs">
                        <Phone className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-brand-200" />
                        <span>
                    {ui.phone}: {normalizeDisplayValue(accountProfile?.phone || accountProfile?.phoneAlt, ui.noPhone)}
                  </span>
                      </p>
                      <p className="theme-text flex items-start gap-2 text-xs">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-brand-200" />
                        <span>
                    {ui.address}: {buildAddressLine(accountProfile, ui.noAddress)}
                  </span>
                      </p>
                      {accountProfileLoading && <p className="theme-muted text-xs">{ui.saving}</p>}
                      {accountProfileError && <p className="text-xs text-rose-200">{accountProfileError}</p>}
                    </div>

                    <form onSubmit={(event) => void handlePasswordSubmit(event)} className="mt-4 grid gap-2">
                      <p className="theme-heading text-sm">{ui.changePassword}</p>
                      <label className="relative block">
                        <span className="theme-muted mb-1 block text-xs">{ui.currentPassword}</span>
                        <input
                            required
                            minLength={8}
                            type={showPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(event) => setCurrentPassword(event.target.value)}
                            className="input-surface w-full rounded-xl border px-3 py-2 pr-10 text-sm outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-2 top-[31px] inline-flex h-8 w-8 items-center justify-center rounded-md theme-text"
                            aria-label="toggle password visibility"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </label>
                      <label className="block">
                        <span className="theme-muted mb-1 block text-xs">{ui.newPassword}</span>
                        <input
                            required
                            minLength={8}
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                            className="input-surface w-full rounded-xl border px-3 py-2 text-sm outline-none"
                        />
                      </label>
                      <label className="block">
                        <span className="theme-muted mb-1 block text-xs">{ui.repeatPassword}</span>
                        <input
                            required
                            minLength={8}
                            type={showPassword ? "text" : "password"}
                            value={repeatPassword}
                            onChange={(event) => setRepeatPassword(event.target.value)}
                            className="input-surface w-full rounded-xl border px-3 py-2 text-sm outline-none"
                        />
                      </label>
                      <div className="mt-1 flex justify-end">
                        <button
                            type="submit"
                            disabled={passwordSaving}
                            className="inline-flex items-center gap-1 rounded-lg border border-brand-500/35 bg-brand-500/10 px-3 py-2 text-xs text-brand-100 transition hover:bg-brand-500/20 disabled:opacity-70"
                        >
                          <UserRound className="h-3.5 w-3.5" />
                          {passwordSaving ? ui.saving : ui.savePassword}
                        </button>
                      </div>
                      {passwordError && <p className="rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">{passwordError}</p>}
                      {passwordSuccess && <p className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">{passwordSuccess}</p>}
                    </form>
                  </motion.section>
                </motion.div>
            )}
          </AnimatePresence>

          <main className="mx-auto w-full max-w-[1360px] flex-1 px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
            <CartAwareRoutes
                location={location}
                locationKey={location.pathname}
                language={language}
                displayCurrency={displayCurrency}
                currencyRates={currencyRates}
                authUser={authUser}
                isAdmin={isAdmin}
                adminOnlyTitle={ui.adminOnlyTitle}
                adminOnlyBody={ui.adminOnlyBody}
                authOnlyTitle={ui.authOnlyTitle}
                authOnlyBody={ui.authOnlyBody}
                toStore={ui.toStore}
                onCartAdded={notifyAddedToCart}
                onCartCountChange={setCartItemsCount}
                onRequireAuth={openAuth}
                onAuthenticated={setAuthUser}
                onLogout={handleLogout}
                b4bMode={b4bMode}
                b4bLoginUrl={b4bLoginUrl}
            />
          </main>

          <SiteFooter language={language} baseCode={currencyBaseCode} rates={currencyRates} />
          <AnimatePresence>
            {cartToast && (
                <motion.div
                    key={cartToast.id}
                    initial={{opacity: 0, y: 28, scale: 0.88, x: 20}}
                    animate={{opacity: 1, y: 0, scale: 1, x: 0}}
                    exit={{opacity: 0, y: 12, scale: 0.92, x: 24}}
                    transition={{type: "spring", stiffness: 300, damping: 24}}
                    className="fixed bottom-5 right-5 z-[120] w-[min(92vw,340px)] overflow-hidden rounded-xl border border-red-400/45 bg-gradient-to-r from-[#7f1d1d]/95 via-[#991b1b]/95 to-[#b91c1c]/95 px-4 py-3 text-sm text-white shadow-[0_0_30px_rgba(239,68,68,0.45)] backdrop-blur"
                >
                  <motion.div
                      className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-red-300/30"
                      animate={{scale: [0.9, 1.12, 0.96], opacity: [0.2, 0.5, 0.25]}}
                      transition={{duration: 1.1, repeat: Infinity, ease: "easeInOut"}}
                  />
                  <div className="relative flex items-center gap-2">
                    <motion.span
                        initial={{scale: 0.8, rotate: -18}}
                        animate={{scale: [0.9, 1.1, 1], rotate: [0, 12, 0]}}
                        transition={{duration: 0.4, ease: "easeOut"}}
                        className="inline-flex rounded-full bg-white/20 p-1"
                    >
                      <CheckCircle2 className="h-4 w-4 text-red-100" />
                    </motion.span>
                    <span className="font-medium">{cartToast.text}</span>
                    <motion.span
                        animate={{scale: [0.95, 1.2, 0.95], opacity: [0.45, 1, 0.45]}}
                        transition={{duration: 0.9, repeat: Infinity, ease: "easeInOut"}}
                        className="ml-auto inline-flex"
                    >
                      <Sparkles className="h-4 w-4 text-red-100" />
                    </motion.span>
                  </div>
                  <motion.div
                      initial={{scaleX: 1}}
                      animate={{scaleX: 0}}
                      transition={{duration: 1.65, ease: "linear"}}
                      className="mt-2 h-1 origin-left rounded-full bg-white/50"
                  />
                </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CartProvider>
  );
}

type NavLinkProps = {
  to: string;
  active: boolean;
  children: ReactNode;
};

function NavLink({to, active, children}: NavLinkProps) {
  return (
      <Link
          to={to}
          className={`relative shrink-0 rounded-lg border px-2.5 py-2 text-xs font-medium sm:px-4 sm:text-sm ${
              active
                  ? "border-red-500 bg-red-600 text-white"
                  : "border-transparent theme-text hover:border-red-400/40 hover:bg-red-500/10"
          }`}
      >
            <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
      </Link>
  );
}

type HeaderActionProps = {
  active: boolean;
  children: ReactNode;
};

type HeaderActionLinkProps = HeaderActionProps & {
  to: string;
};

function HeaderActionLink({to, active, children}: HeaderActionLinkProps) {
  return (
      <Link to={to} className={getHeaderActionClassName(active)}>
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
      </Link>
  );
}

type HeaderActionButtonProps = HeaderActionProps & {
  onClick: () => void;
};

function HeaderActionButton({onClick, active, children}: HeaderActionButtonProps) {
  return (
      <button type="button" onClick={onClick} className={getHeaderActionClassName(active)}>
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
      </button>
  );
}

function getHeaderActionClassName(active: boolean) {
  return `user-nav-action theme-text relative flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium sm:px-4 sm:text-[15px] ${
      active
          ? "is-active border-red-500 bg-red-600 text-white"
          : "border-transparent hover:border-red-400/40 hover:bg-red-500/10"
  }`;
}

type GuardCardProps = {
  title: string;
  description: string;
  buttonText: string;
};

function GuardCard({title, description, buttonText}: GuardCardProps) {
  return (
      <section className="glass-card mx-auto max-w-xl rounded-2xl p-7 text-center">
        <h2 className="theme-heading text-2xl font-semibold">{title}</h2>
        <p className="theme-text mt-2 text-sm">{description}</p>
        <Link to="/" className="mt-5 inline-flex rounded-xl bg-gradient-to-r from-brand-600 to-pulse-500 px-4 py-2 text-sm font-medium text-white">
          {buttonText}
        </Link>
      </section>
  );
}

type CartAwareRoutesProps = {
  location: Location;
  locationKey: string;
  language: Language;
  displayCurrency: DisplayCurrency;
  currencyRates: Record<string, number>;
  authUser: AuthUser | null;
  isAdmin: boolean;
  adminOnlyTitle: string;
  adminOnlyBody: string;
  authOnlyTitle: string;
  authOnlyBody: string;
  toStore: string;
  onCartAdded: () => void;
  onCartCountChange: (count: number) => void;
  onRequireAuth: () => void;
  onAuthenticated: (user: AuthUser) => void;
  onLogout: () => Promise<void>;
  b4bMode: boolean;
  b4bLoginUrl: string;
};

function CartAwareRoutes({
                           location,
                           locationKey,
                           language,
                           displayCurrency,
                           currencyRates,
                           authUser,
                           isAdmin,
                           adminOnlyTitle,
                           adminOnlyBody,
                           authOnlyTitle,
                           authOnlyBody,
                           toStore,
                           onCartAdded,
                           onCartCountChange,
                           onRequireAuth,
                           onAuthenticated,
                           onLogout,
                           b4bMode,
                           b4bLoginUrl
                         }: CartAwareRoutesProps) {
  const {addToCart, totalItems} = useCart();

  useEffect(() => {
    onCartCountChange(totalItems);
  }, [totalItems, onCartCountChange]);

  async function handleAddToCart(product: Product) {
    if (!authUser) {
      onRequireAuth();
      return;
    }
    await addToCart(product);
    onCartAdded();
  }

  return (
      <AnimatePresence mode="wait">
        <Routes location={location} key={locationKey}>
          <Route
              path="/b4b-access"
              element={<PublicGatewayPage language={language} b4bLoginUrl={b4bLoginUrl} />}
          />
          <Route
              path="/login"
              element={
                b4bMode ? (
                    authUser ? (
                        <Navigate to="/" replace />
                    ) : (
                        <LoginPage
                            language={language}
                            authUser={authUser}
                            onAuthenticated={onAuthenticated}
                            onLogout={onLogout}
                        />
                    )
                ) : (
                    <Navigate to="/b4b-access" replace />
                )
              }
          />
          <Route
              path="/"
              element={
                b4bMode && !authUser ? (
                    <Navigate to="/login" replace state={{from: "/"}} />
                ) : authUser && isAdmin ? (
                    <Navigate to="/admin" replace />
                ) : (
                    <StorePage
                        language={language}
                        displayCurrency={displayCurrency}
                        currencyRates={currencyRates}
                        onAddToCart={(product) => void handleAddToCart(product)}
                    />
                )
              }
          />
          <Route
              path="/products/:id"
              element={
                b4bMode && !authUser ? (
                    <Navigate to="/login" replace state={{from: location.pathname}} />
                ) : authUser && isAdmin ? (
                    <Navigate to="/admin" replace />
                ) : (
                    <ProductDetailsPage
                        language={language}
                        displayCurrency={displayCurrency}
                        currencyRates={currencyRates}
                        onAddToCart={(product) => void handleAddToCart(product)}
                    />
                )
              }
          />
          <Route
              path="/cart"
              element={
                authUser && isAdmin ? (
                    <Navigate to="/admin" replace />
                ) : authUser ? (
                    <CartPage
                        language={language}
                        displayCurrency={displayCurrency}
                        currencyRates={currencyRates}
                        authUser={authUser}
                    />
                ) : b4bMode ? (
                    <Navigate to="/login" replace state={{from: location.pathname}} />
                ) : (
                    <Navigate to="/b4b-access" replace state={{from: location.pathname}} />
                )
              }
          />
          <Route
              path="/account"
              element={
                authUser && isAdmin ? (
                    <Navigate to="/admin" replace />
                ) : authUser ? (
                    <AccountPage language={language} user={authUser} />
                ) : b4bMode ? (
                    <Navigate to="/login" replace state={{from: location.pathname}} />
                ) : (
                    <Navigate to="/b4b-access" replace state={{from: location.pathname}} />
                )
              }
          />
          <Route
              path="/admin"
              element={
                authUser && isAdmin ? (
                    <AdminPage language={language} displayCurrency={displayCurrency} currencyRates={currencyRates} />
                ) : b4bMode ? (
                    <Navigate to="/login" replace state={{from: location.pathname}} />
                ) : (
                    <Navigate to="/b4b-access" replace state={{from: location.pathname}} />
                )
              }
          />
        </Routes>
      </AnimatePresence>
  );
}
