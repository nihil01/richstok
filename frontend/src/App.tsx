import {fetchCurrencyRate, fetchCurrentUser, logout} from "@/api/client";
import AutoBackdrop from "@/components/AutoBackdrop";
import AuthModal from "@/components/AuthModal";
import HeaderCurrencyTicker from "@/components/HeaderCurrencyTicker";
import StartupLoader from "@/components/StartupLoader";
import RichstokLogo from "@/components/logo/RichstokLogo";
import AccountPage from "@/pages/AccountPage";
import AdminPage from "@/pages/AdminPage";
import ProductDetailsPage from "@/pages/ProductDetailsPage";
import StorePage from "@/pages/StorePage";
import type {AuthUser} from "@/types/auth";
import type {DisplayCurrency} from "@/types/currency";
import type {Language, ThemeMode} from "@/types/ui";
import {DEFAULT_DISPLAY_RATES, DISPLAY_CURRENCIES, getCurrencySymbol, resolveDisplayCurrency} from "@/utils/currency";
import {AnimatePresence, motion} from "framer-motion";
import {Coins, LayoutDashboard, LogIn, LogOut, Moon, ShoppingBag, Sun, User} from "lucide-react";
import type {ReactNode} from "react";
import {useEffect, useRef, useState} from "react";
import {Link, Route, Routes, useLocation, useNavigate} from "react-router-dom";

const labels: Record<
  Language,
  {
    store: string;
    account: string;
    admin: string;
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
  }
> = {
  az: {
    store: "Mağaza",
    account: "Kabinet",
    admin: "Admin",
    language: "Dil",
    authButton: "Giriş / Qeydiyyat",
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
    toStore: "Mağazaya qayıt"
  },
  en: {
    store: "Store",
    account: "Account",
    admin: "Admin",
    language: "Language",
    authButton: "Login / Register",
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
    toStore: "Back to store"
  },
  ru: {
    store: "Магазин",
    account: "Кабинет",
    admin: "Админ",
    language: "Язык",
    authButton: "Вход / Регистрация",
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
    toStore: "Вернуться в магазин"
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
  const lastScrollRef = useRef(0);
  const pendingSectionRef = useRef<string | null>(null);
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

  return (
    <div className="app-shell relative min-h-screen bg-transparent">
      <AnimatePresence>{isBooting && <StartupLoader language={language} />}</AnimatePresence>
      <AutoBackdrop />

      <motion.header
        initial={{y: 0}}
        animate={{y: isHeaderHidden ? "-100%" : 0}}
        transition={{duration: 0.25, ease: "easeOut"}}
        className="header-surface sticky top-0 z-30 border-b backdrop-blur-xl"
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

              {isAdmin && (
                <NavLink to="/admin" active={location.pathname.startsWith("/admin")}>
                  <LayoutDashboard className="h-4 w-4" />
                  {ui.admin}
                </NavLink>
              )}
            </nav>

            <div className="glass-card hidden items-center gap-1 rounded-xl border border-brand-500/20 p-1 lg:flex">
              <button type="button" onClick={() => goStoreSection("catalog")} className="theme-text rounded-md px-2 py-1 text-xs transition hover:bg-brand-600/18">
                {ui.catalog}
              </button>
              <button type="button" onClick={() => goStoreSection("categories")} className="theme-text rounded-md px-2 py-1 text-xs transition hover:bg-brand-600/18">
                {ui.categories}
              </button>
              <button type="button" onClick={() => goStoreSection("brands")} className="theme-text rounded-md px-2 py-1 text-xs transition hover:bg-brand-600/18">
                {ui.brands}
              </button>
            </div>

            <div className="glass-card flex items-center gap-1 rounded-xl border border-brand-500/20 p-1">
              {(["az", "en", "ru"] as Language[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setLanguage(item)}
                  className={`rounded-md px-2 py-1 text-xs font-medium uppercase tracking-wide transition ${language === item ? "bg-brand-600 text-white" : "theme-text hover:bg-brand-600/20"}`}
                  aria-label={`${ui.language}: ${item.toUpperCase()}`}
                >
                  {item}
                </button>
              ))}
            </div>

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

            <div className="glass-card flex items-center rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur-md">
                <button
                    type="button"
                    role="switch"
                    aria-checked={themeMode === "dark"}
                    onClick={() => setThemeMode((prev) => (prev === "dark" ? "light" : "dark"))}
                    aria-label={themeMode === "dark" ? ui.themeLight : ui.themeDark}
                    className={`relative flex h-9 w-[72px] items-center rounded-full border transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-brand-400/50 ${
                        themeMode === "dark"
                            ? "border-brand-400/30 bg-gradient-to-r from-slate-900 via-brand-900/80 to-brand-700 shadow-inner shadow-brand-950/40"
                            : "border-slate-300/70 bg-gradient-to-r from-slate-100 to-slate-200 shadow-inner"
                    }`}
                >
                <span
                    className={`absolute inset-y-0 left-0 flex items-center px-2 transition-opacity duration-300 ${
                        themeMode === "dark" ? "opacity-100" : "opacity-60"
                    }`}
                >
                  <Moon
                      className={`h-4 w-4 transition-colors duration-300 ${
                          themeMode === "dark" ? "text-white" : "text-slate-500"
                      }`}
                  />
                </span>

                            <span
                                className={`absolute inset-y-0 right-0 flex items-center px-2 transition-opacity duration-300 ${
                                    themeMode === "light" ? "opacity-100" : "opacity-60"
                                }`}
                            >
                  <Sun
                      className={`h-4 w-4 transition-colors duration-300 ${
                          themeMode === "light" ? "text-amber-500" : "text-white/60"
                      }`}
                  />
                </span>

                            <span
                                className={`absolute top-1/2 h-7 w-7 -translate-y-1/2 rounded-full border shadow-lg transition-all duration-300 ease-out ${
                                    themeMode === "dark"
                                        ? "translate-x-1 border-white/10 bg-white"
                                        : "translate-x-[38px] border-white/80 bg-white"
                                }`}
                            >
                  <span className="flex h-full w-full items-center justify-center">
                    {themeMode === "dark" ? (
                        <Moon className="h-3.5 w-3.5 text-slate-700" />
                    ) : (
                        <Sun className="h-3.5 w-3.5 text-amber-500" />
                    )}
                  </span>
                </span>
                  </button>

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
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<StorePage language={language} displayCurrency={displayCurrency} currencyRates={currencyRates} />} />
            <Route path="/products/:id" element={<ProductDetailsPage language={language} displayCurrency={displayCurrency} currencyRates={currencyRates} />} />
            <Route
              path="/account"
              element={
                authUser ? (
                  <AccountPage language={language} user={authUser} />
                ) : (
                  <GuardCard title={ui.authOnlyTitle} description={ui.authOnlyBody} buttonText={ui.toStore} />
                )
              }
            />
            <Route
              path="/admin"
              element={
                authUser && isAdmin ? (
                  <AdminPage language={language} displayCurrency={displayCurrency} currencyRates={currencyRates} />
                ) : (
                  <GuardCard title={ui.adminOnlyTitle} description={ui.adminOnlyBody} buttonText={ui.toStore} />
                )
              }
            />
          </Routes>
        </AnimatePresence>
      </main>

      <AuthModal language={language} open={authModalOpen} onClose={() => setAuthModalOpen(false)} onAuthenticated={setAuthUser} />
    </div>
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
