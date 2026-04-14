import {login} from "@/api/client";
import RichstokLogo from "@/components/logo/RichstokLogo";
import type {AuthUser} from "@/types/auth";
import type {Language} from "@/types/ui";
import {AnimatePresence, motion} from "framer-motion";
import {ArrowRight, Lock, LogIn, LogOut, Mail, User} from "lucide-react";
import {FormEvent, useMemo, useState} from "react";
import {Link, useLocation} from "react-router-dom";

type LoginPageProps = {
  language: Language;
  authUser: AuthUser | null;
  onAuthenticated: (user: AuthUser) => void;
  onLogout: () => Promise<void>;
};

const copy: Record<
  Language,
  {
    title: string;
    subtitle: string;
    email: string;
    password: string;
    signIn: string;
    signingIn: string;
    failed: string;
    support: string;
    signedTitle: string;
    signedBody: string;
    signOut: string;
    toAccount: string;
    toStore: string;
    returnBack: string;
  }
> = {
  az: {
    title: "RICHSTOK hesabına giriş",
    subtitle: "Yeni hesablar yalnız admin paneldən yaradılır.",
    email: "E-poçt",
    password: "Şifrə",
    signIn: "Daxil ol",
    signingIn: "Daxil olunur...",
    failed: "Giriş alınmadı. Məlumatları yoxla.",
    support: "Hesab üçün adminlə əlaqə saxla.",
    signedTitle: "Sən artıq daxil olmusan",
    signedBody: "Bu səhifədə girişdən çıxış da edə bilərsən.",
    signOut: "Çıxış",
    toAccount: "Kabinet",
    toStore: "Mağaza",
    returnBack: "Geri dön"
  },
  en: {
    title: "Sign in to RICHSTOK",
    subtitle: "New accounts are created by admin only.",
    email: "Email",
    password: "Password",
    signIn: "Sign in",
    signingIn: "Signing in...",
    failed: "Sign-in failed. Check your credentials.",
    support: "Contact admin to get an account.",
    signedTitle: "You are already signed in",
    signedBody: "You can also sign out from this page.",
    signOut: "Sign out",
    toAccount: "Account",
    toStore: "Store",
    returnBack: "Go back"
  },
  ru: {
    title: "Вход в RICHSTOK",
    subtitle: "Новые аккаунты создаёт только администратор.",
    email: "Email",
    password: "Пароль",
    signIn: "Войти",
    signingIn: "Вход...",
    failed: "Не удалось войти. Проверь данные.",
    support: "Для создания аккаунта обратись к администратору.",
    signedTitle: "Ты уже авторизован",
    signedBody: "На этой странице можно и выйти из аккаунта.",
    signOut: "Выйти",
    toAccount: "Кабинет",
    toStore: "Магазин",
    returnBack: "Вернуться"
  }
};

export default function LoginPage({language, authUser, onAuthenticated, onLogout}: LoginPageProps) {
  const ui = copy[language];
  const location = useLocation();
  const fromPath = useMemo(() => {
    const candidate = (location.state as {from?: string} | null)?.from;
    if (!candidate || candidate === "/login") {
      return null;
    }
    return candidate;
  }, [location.state]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const user = await login({email, password});
      onAuthenticated(user);
      setPassword("");
    } catch {
      setError(ui.failed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-xl">
      <motion.div
        initial={{opacity: 0, y: 18}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.28, ease: "easeOut"}}
        className="glass-card relative overflow-hidden rounded-3xl border border-brand-500/30 p-6 sm:p-7"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-14 bottom-0 h-36 w-36 rounded-full bg-pulse-500/16 blur-3xl" />

        <div className="relative mb-5">
          <div className="logo-shell mb-3 inline-flex rounded-lg border p-1">
            <RichstokLogo className="h-10 sm:h-10" />
          </div>
          <h1 className="theme-heading text-2xl font-semibold">{ui.title}</h1>
          <p className="theme-text mt-1 text-sm">{ui.subtitle}</p>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {authUser ? (
            <motion.div
              key="signed"
              initial={{opacity: 0, y: 10}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: -6}}
              className="relative space-y-4"
            >
              <div className="input-surface rounded-2xl border p-4">
                <p className="theme-heading text-base font-semibold">{ui.signedTitle}</p>
                <p className="theme-text mt-1 text-sm">{ui.signedBody}</p>
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <User className="h-4 w-4 text-brand-300" />
                  <span className="theme-text">{authUser.fullName} · {authUser.role}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void onLogout()}
                  className="inline-flex items-center gap-1 rounded-xl border border-brand-500/35 bg-brand-500/10 px-4 py-2 text-sm text-brand-100 transition hover:bg-brand-500/20"
                >
                  <LogOut className="h-4 w-4" />
                  {ui.signOut}
                </button>
                <Link to="/account" className="inline-flex items-center gap-1 rounded-xl border border-brand-500/35 px-4 py-2 text-sm theme-text transition hover:bg-brand-600/15">
                  {ui.toAccount}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link to="/" className="inline-flex items-center gap-1 rounded-xl border border-brand-500/35 px-4 py-2 text-sm theme-text transition hover:bg-brand-600/15">
                  {ui.toStore}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                {fromPath && (
                  <Link to={fromPath} className="inline-flex items-center gap-1 rounded-xl border border-brand-500/35 px-4 py-2 text-sm theme-text transition hover:bg-brand-600/15">
                    {ui.returnBack}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="login"
              initial={{opacity: 0, y: 10}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: -6}}
              transition={{duration: 0.2}}
              onSubmit={handleSubmit}
              className="relative space-y-3"
            >
              <label className="block text-sm">
                <span className="theme-text mb-1 block">{ui.email}</span>
                <div className="input-surface flex items-center gap-2 rounded-xl border px-3 py-2">
                  <Mail className="h-4 w-4 text-brand-300" />
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </label>

              <label className="block text-sm">
                <span className="theme-text mb-1 block">{ui.password}</span>
                <div className="input-surface flex items-center gap-2 rounded-xl border px-3 py-2">
                  <Lock className="h-4 w-4 text-brand-300" />
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </label>

              {error && <p className="rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-pulse-500 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-65"
              >
                <LogIn className="h-4 w-4" />
                {loading ? ui.signingIn : ui.signIn}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="theme-muted mt-4 text-xs">{ui.support}</p>
      </motion.div>
    </section>
  );
}
