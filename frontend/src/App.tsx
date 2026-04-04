import {fetchCurrentUser, logout} from "@/api/client";
import AuthModal from "@/components/AuthModal";
import NeonBackdrop from "@/components/NeonBackdrop";
import StartupLoader from "@/components/StartupLoader";
import RichstokLogo from "@/components/logo/RichstokLogo";
import AccountPage from "@/pages/AccountPage";
import AdminPage from "@/pages/AdminPage";
import StorePage from "@/pages/StorePage";
import type {AuthUser} from "@/types/auth";
import type {Language, ThemeMode} from "@/types/ui";
import {AnimatePresence, motion} from "framer-motion";
import {LayoutDashboard, LogIn, LogOut, Moon, ShoppingBag, Sun, User} from "lucide-react";
import type {ReactNode} from "react";
import {useEffect, useRef, useState} from "react";
import {Link, Route, Routes, useLocation, useNavigate} from "react-router-dom";

type AuthMode = "login" | "register";

const labels: Record<
  Language,
  {
    store: string;
    account: string;
    admin: string;
    language: string;
    signIn: string;
    signUp: string;
    signOut: string;
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
    signIn: "Giriş",
    signUp: "Qeydiyyat",
    signOut: "Çıxış",
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
    signIn: "Sign in",
    signUp: "Register",
    signOut: "Sign out",
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
    signIn: "Вход",
    signUp: "Регистрация",
    signOut: "Выход",
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

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isBooting, setIsBooting] = useState(true);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem("richstok-language") as Language) || "az");
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const savedTheme = localStorage.getItem("richstok-theme") as ThemeMode | null;
    if (savedTheme === "dark" || savedTheme === "light") {
      return savedTheme;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authModal, setAuthModal] = useState<{open: boolean; mode: AuthMode}>({open: false, mode: "login"});
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

  function openAuth(mode: AuthMode) {
    setAuthModal({open: true, mode});
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
      <NeonBackdrop />

      <motion.header
        initial={{y: 0}}
        animate={{y: isHeaderHidden ? -126 : 0}}
        transition={{duration: 0.25, ease: "easeOut"}}
        className="header-surface sticky top-0 z-30 border-b backdrop-blur-xl"
      >
        <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
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

            <button
              type="button"
              onClick={() => setThemeMode((prev) => (prev === "dark" ? "light" : "dark"))}
              className="glass-card theme-text inline-flex items-center gap-2 rounded-xl border border-brand-500/20 px-3 py-2 text-xs font-medium"
              aria-label={themeMode === "dark" ? ui.themeLight : ui.themeDark}
            >
              {themeMode === "dark" ? <Sun className="h-4 w-4 text-brand-200" /> : <Moon className="h-4 w-4 text-brand-700" />}
              <span className="hidden sm:inline">{themeMode === "dark" ? ui.themeLight : ui.themeDark}</span>
            </button>

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
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => openAuth("login")} className="glass-card theme-text inline-flex items-center gap-1 rounded-xl border border-brand-500/20 px-3 py-2 text-xs font-medium transition hover:bg-brand-500/12">
                  <LogIn className="h-3.5 w-3.5 text-brand-300" />
                  {ui.signIn}
                </button>
                <button type="button" onClick={() => openAuth("register")} className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-brand-600 to-pulse-500 px-3 py-2 text-xs font-medium text-white transition hover:opacity-90">
                  {ui.signUp}
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.header>

      <main className="mx-auto w-full max-w-[1240px] px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<StorePage language={language} />} />
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
                  <AdminPage language={language} />
                ) : (
                  <GuardCard title={ui.adminOnlyTitle} description={ui.adminOnlyBody} buttonText={ui.toStore} />
                )
              }
            />
          </Routes>
        </AnimatePresence>
      </main>

      <AuthModal language={language} open={authModal.open} mode={authModal.mode} onClose={() => setAuthModal((prev) => ({...prev, open: false}))} onAuthenticated={setAuthUser} />
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
    <Link to={to} className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors ${active ? "text-white" : "theme-text"}`}>
      {active && (
        <motion.span
          layoutId="activeNav"
          className="absolute inset-0 rounded-lg bg-gradient-to-r from-brand-600/92 via-brand-500/92 to-pulse-500/92"
          transition={{type: "spring", stiffness: 380, damping: 30}}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
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
