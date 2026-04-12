import {fetchCurrencyRate, fetchCurrentUser, logout} from "@/api/client";
import AuthModal from "@/components/AuthModal";
import HeaderCurrencyTicker from "@/components/HeaderCurrencyTicker";
import SiteFooter from "@/components/SiteFooter";
import StartupLoader from "@/components/StartupLoader";
import RichstokLogo from "@/components/logo/RichstokLogo";
import {CartProvider, useCart} from "@/context/CartContext";
import {WishlistProvider, useWishlist} from "@/context/WishlistContext";
import AccountPage from "@/pages/AccountPage";
import AdminPage from "@/pages/AdminPage";
import CartPage from "@/pages/CartPage";
import ProductDetailsPage from "@/pages/ProductDetailsPage";
import StorePage from "@/pages/StorePage";
import WishlistPage from "@/pages/WishlistPage";
import type {AuthUser} from "@/types/auth";
import type {DisplayCurrency} from "@/types/currency";
import type {Product} from "@/types/product";
import type {Language, ThemeMode} from "@/types/ui";
import {DEFAULT_DISPLAY_RATES, DISPLAY_CURRENCIES, getCurrencySymbol, resolveDisplayCurrency} from "@/utils/currency";
import {AnimatePresence, motion} from "framer-motion";
import {CheckCircle2, Coins, Heart, LayoutDashboard, LogIn, LogOut, Moon, Settings2, ShoppingBag, ShoppingCart, Sparkles, Sun, User} from "lucide-react";
import type {ReactNode} from "react";
import {useEffect, useRef, useState} from "react";
import type {Location} from "react-router-dom";
import {Link, Route, Routes, useLocation, useNavigate} from "react-router-dom";

const labels: Record<
  Language,
  {
    store: string;
    account: string;
    admin: string;
    cart: string;
    wishlist: string;
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
  }
> = {
  az: {
    store: "Mağaza",
    account: "Kabinet",
    admin: "Admin",
    cart: "Səbət",
    wishlist: "İstək",
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
    addedToCart: "Məhsul səbətə əlavə olundu"
  },
  en: {
    store: "Store",
    account: "Account",
    admin: "Admin",
    cart: "Cart",
    wishlist: "Wishlist",
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
    addedToCart: "Product added to cart"
  },
  ru: {
    store: "Магазин",
    account: "Кабинет",
    admin: "Админ",
    cart: "Корзина",
    wishlist: "Желаемое",
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
    addedToCart: "Товар добавлен в корзину"
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

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isBooting, setIsBooting] = useState(true);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem("richstok-language") as Language) || "az");
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getInitialTheme());
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>(() => resolveDisplayCurrency(localStorage.getItem("richstok-display-currency")));
  const [currencyBaseCode, setCurrencyBaseCode] = useState("AZN");
  const [currencyRates, setCurrencyRates] = useState<Record<string, number>>(() => ({...DEFAULT_DISPLAY_RATES}));
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [cartToast, setCartToast] = useState<{id: number; text: string} | null>(null);
  const [cartPulseId, setCartPulseId] = useState(0);
  const lastScrollRef = useRef(0);
  const toastIdRef = useRef(0);
  const pendingSectionRef = useRef<string | null>(null);
  const preferencesRef = useRef<HTMLDivElement | null>(null);
  const ui = labels[language];
  const isAdmin = authUser?.role === "ADMIN";

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
    const onScroll = () => {
      const currentScroll = window.scrollY;
      if (currentScroll <= 24) {
        setIsHeaderHidden(false);
      } else if (currentScroll > lastScrollRef.current + 6) {
        setIsHeaderHidden(true);
      } else if (currentScroll < lastScrollRef.current - 6) {
        setIsHeaderHidden(false);
      }
      lastScrollRef.current = currentScroll;
    };
    window.addEventListener("scroll", onScroll, {passive: true});
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
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
  }, []);

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

  function openAuth() {
    setAuthModalOpen(true);
  }

  async function handleLogout() {
    await logout();
    setAuthUser(null);
    if (location.pathname.startsWith("/admin") || location.pathname.startsWith("/account")) {
      navigate("/");
    }
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
    <WishlistProvider authUser={authUser}>
      <CartProvider authUser={authUser}>
      <div className="app-shell relative min-h-screen bg-transparent">
      <AnimatePresence>{isBooting && <StartupLoader language={language} />}</AnimatePresence>

      <motion.header
        initial={{y: 0}}
        animate={{y: isHeaderHidden ? "-100%" : 0}}
        transition={{duration: 0.25, ease: "easeOut"}}
        className="header-surface sticky top-0 z-[90] border-b backdrop-blur-xl"
      >
        <HeaderCurrencyTicker language={language} baseCode={currencyBaseCode} rates={currencyRates} />
        <div className="mx-auto flex w-full max-w-[1360px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <motion.div
            initial={{opacity: 0, y: -10, scale: 0.98}}
            animate={{opacity: 1, y: 0, scale: 1}}
            transition={{duration: 0.5, delay: 0.18}}
            whileHover={{scale: 1.01}}
            className="logo-shell relative overflow-hidden rounded-xl border p-1.5 [&_svg]:h-9 [&_svg]:w-auto sm:[&_svg]:h-10"
          >
            <RichstokLogo />
          </motion.div>

          <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
            <nav className="glass-card flex items-center gap-1 rounded-xl border border-brand-500/20 p-1.5">
              <NavLink to="/" active={location.pathname === "/"}>
                <ShoppingBag className="h-4 w-4" />
                {ui.store}
              </NavLink>

              {authUser && (
                <NavLink to="/account" active={location.pathname.startsWith("/account")}>
                  <User className="h-4 w-4" />
                  {ui.account}
                </NavLink>
              )}

              <NavLink to="/cart" active={location.pathname.startsWith("/cart")}>
                <motion.span
                  key={cartPulseId}
                  initial={{scale: 1, rotate: 0}}
                  animate={{scale: [1, 1.22, 1], rotate: [0, -8, 8, 0]}}
                  transition={{duration: 0.55, ease: "easeInOut"}}
                  className="inline-flex"
                >
                  <ShoppingCart className="h-4 w-4" />
                </motion.span>
                {ui.cart}
              </NavLink>

              <NavLink to="/wishlist" active={location.pathname.startsWith("/wishlist")}>
                <Heart className="h-4 w-4" />
                {ui.wishlist}
              </NavLink>

              {isAdmin && (
                <NavLink to="/admin" active={location.pathname.startsWith("/admin")}>
                  <LayoutDashboard className="h-4 w-4" />
                  {ui.admin}
                </NavLink>
              )}
            </nav>
            <div className="glass-card flex items-center gap-2 rounded-xl border border-brand-500/20 px-2 py-1">
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
                className="glass-card inline-flex h-9 w-9 items-center justify-center rounded-xl border border-brand-500/20 transition hover:border-brand-300"
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
              <div className="glass-card flex items-center gap-2 rounded-xl border border-brand-500/20 px-2 py-1.5">
                <div className="hidden text-right sm:block">
                  <p className="theme-heading text-xs font-medium leading-tight">{authUser.fullName}</p>
                  <p className="text-[11px] uppercase tracking-wide text-brand-200">{authUser.role}</p>
                </div>
                <button type="button" onClick={() => void handleLogout()} className="inline-flex items-center gap-1 rounded-md border border-brand-500/35 bg-brand-500/10 px-2.5 py-1.5 text-xs text-brand-100 transition hover:bg-brand-500/20">
                  <LogOut className="h-3.5 w-3.5" />
                  {ui.signOut}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={openAuth}
                aria-label={ui.authButton}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-brand-600 to-pulse-500 text-white transition hover:opacity-90"
              >
                <LogIn className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </motion.header>

      <main className="mx-auto w-full max-w-[1360px] px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
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
          onRequireAuth={openAuth}
        />
      </main>

      <SiteFooter language={language} />
      <AuthModal language={language} open={authModalOpen} onClose={() => setAuthModalOpen(false)} onAuthenticated={setAuthUser} />
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
    </WishlistProvider>
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
            className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                active ? "text-white" : "theme-text"
            }`}
        >
            {active && (
                <motion.span
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-lg bg-red-500"
                    transition={{type: "spring", stiffness: 380, damping: 30}}
                />
            )}
            <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
        </Link>
    );
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
  onRequireAuth: () => void;
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
  onRequireAuth
}: CartAwareRoutesProps) {
  const {addToCart} = useCart();
  const {isWishlisted, toggleWishlist} = useWishlist();

  async function handleAddToCart(product: Product) {
    if (!authUser) {
      onRequireAuth();
      return;
    }
    await addToCart(product);
    onCartAdded();
  }

  function handleToggleWishlist(product: Product) {
    if (!authUser) {
      onRequireAuth();
      return;
    }
    toggleWishlist(product);
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={locationKey}>
        <Route
          path="/"
          element={
            <StorePage
              language={language}
              displayCurrency={displayCurrency}
              currencyRates={currencyRates}
              onAddToCart={(product) => void handleAddToCart(product)}
            />
          }
        />
        <Route
          path="/products/:id"
          element={
            <ProductDetailsPage
              language={language}
              displayCurrency={displayCurrency}
              currencyRates={currencyRates}
              onAddToCart={(product) => void handleAddToCart(product)}
              isWishlisted={(productId) => Boolean(authUser) && isWishlisted(productId)}
              onToggleWishlist={handleToggleWishlist}
            />
          }
        />
        <Route
          path="/wishlist"
          element={
            authUser ? (
              <WishlistPage
                language={language}
                displayCurrency={displayCurrency}
                currencyRates={currencyRates}
                onAddToCart={(product) => void handleAddToCart(product)}
              />
            ) : (
              <GuardCard title={authOnlyTitle} description={authOnlyBody} buttonText={toStore} />
            )
          }
        />
        <Route
          path="/cart"
          element={
            authUser ? (
              <CartPage
                language={language}
                displayCurrency={displayCurrency}
                currencyRates={currencyRates}
                authUser={authUser}
              />
            ) : (
              <GuardCard title={authOnlyTitle} description={authOnlyBody} buttonText={toStore} />
            )
          }
        />
        <Route
          path="/account"
          element={
            authUser ? (
              <AccountPage language={language} user={authUser} />
            ) : (
              <GuardCard title={authOnlyTitle} description={authOnlyBody} buttonText={toStore} />
            )
          }
        />
        <Route
          path="/admin"
          element={
            authUser && isAdmin ? (
              <AdminPage language={language} displayCurrency={displayCurrency} currencyRates={currencyRates} />
            ) : (
              <GuardCard title={adminOnlyTitle} description={adminOnlyBody} buttonText={toStore} />
            )
          }
        />
      </Routes>
    </AnimatePresence>
  );
}
