import {login, register} from "@/api/client";
import type {AuthUser} from "@/types/auth";
import type {Language} from "@/types/ui";
import {AnimatePresence, motion} from "framer-motion";
import {Lock, Mail, UserRound, X} from "lucide-react";
import {FormEvent, useEffect, useState} from "react";

type AuthMode = "login" | "register";

type AuthModalProps = {
  language: Language;
  open: boolean;
  initialMode?: AuthMode;
  onClose: () => void;
  onAuthenticated: (user: AuthUser) => void;
};

const copy: Record<
  Language,
  {
    login: string;
    register: string;
    title: string;
    subtitle: string;
    fullName: string;
    email: string;
    password: string;
    submitLogin: string;
    submitRegister: string;
    failed: string;
    support: string;
  }
> = {
  az: {
    login: "Giriş",
    register: "Qeydiyyat",
    title: "RICHSTOK hesabı",
    subtitle: "Bir pəncərədən giriş və qeydiyyat.",
    fullName: "Ad Soyad",
    email: "E-poçt",
    password: "Şifrə",
    submitLogin: "Daxil ol",
    submitRegister: "Hesab yarat",
    failed: "Əməliyyat alınmadı. Məlumatları yoxla.",
    support: "Sifariş və admin hüquqları hesabdan idarə olunur."
  },
  en: {
    login: "Login",
    register: "Register",
    title: "RICHSTOK account",
    subtitle: "Login and registration in one modal.",
    fullName: "Full name",
    email: "Email",
    password: "Password",
    submitLogin: "Sign in",
    submitRegister: "Create account",
    failed: "Request failed. Check your credentials.",
    support: "Orders and role access are managed from your account."
  },
  ru: {
    login: "Вход",
    register: "Регистрация",
    title: "Аккаунт RICHSTOK",
    subtitle: "Вход и регистрация в одном окне.",
    fullName: "Имя и фамилия",
    email: "Email",
    password: "Пароль",
    submitLogin: "Войти",
    submitRegister: "Создать аккаунт",
    failed: "Запрос не выполнен. Проверь данные.",
    support: "Заказы и права доступа управляются через аккаунт."
  }
};

export default function AuthModal({language, open, initialMode = "login", onClose, onAuthenticated}: AuthModalProps) {
  const ui = copy[language];
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setMode(initialMode);
    setError(null);
  }, [initialMode, open]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const user = mode === "login" ? await login({email, password}) : await register({fullName, email, password});
      onAuthenticated(user);
      onClose();
    } catch {
      setError(ui.failed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="fixed inset-0 z-[90] flex items-center justify-center bg-black/65 px-4" onClick={onClose}>
          <motion.div
            initial={{opacity: 0, y: 16, scale: 0.98}}
            animate={{opacity: 1, y: 0, scale: 1}}
            exit={{opacity: 0, y: 8, scale: 0.985}}
            transition={{duration: 0.25, ease: "easeOut"}}
            className="glass-card relative w-full max-w-lg overflow-hidden rounded-3xl border border-brand-500/30 p-6 shadow-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-500/22 blur-3xl" />
            <div className="pointer-events-none absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-pulse-500/16 blur-3xl" />

            <div className="relative mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="theme-heading text-2xl font-semibold">{ui.title}</h2>
                <p className="theme-text mt-1 text-sm">{ui.subtitle}</p>
              </div>
              <button type="button" className="theme-muted rounded-lg p-1.5 transition hover:bg-white/10" onClick={onClose} aria-label="Close auth modal">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative mb-5 grid grid-cols-2 rounded-xl bg-black/20 p-1">
              <button type="button" onClick={() => setMode("login")} className={`relative z-10 rounded-lg px-3 py-2 text-sm font-medium transition ${mode === "login" ? "text-white" : "theme-text"}`}>
                {ui.login}
              </button>
              <button type="button" onClick={() => setMode("register")} className={`relative z-10 rounded-lg px-3 py-2 text-sm font-medium transition ${mode === "register" ? "text-white" : "theme-text"}`}>
                {ui.register}
              </button>
              <motion.span
                layout
                transition={{type: "spring", stiffness: 320, damping: 30}}
                className={`absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-lg bg-gradient-to-r from-brand-600 to-pulse-500 ${mode === "login" ? "left-1" : "left-[calc(50%+2px)]"}`}
              />
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.form
                key={mode}
                initial={{opacity: 0, x: mode === "login" ? -14 : 14}}
                animate={{opacity: 1, x: 0}}
                exit={{opacity: 0, x: mode === "login" ? 14 : -14}}
                transition={{duration: 0.2}}
                onSubmit={handleSubmit}
                className="relative space-y-3"
              >
                {mode === "register" && (
                  <label className="block text-sm">
                    <span className="theme-text mb-1 block">{ui.fullName}</span>
                    <div className="input-surface flex items-center gap-2 rounded-xl border px-3 py-2">
                      <UserRound className="h-4 w-4 text-brand-300" />
                      <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="w-full bg-transparent text-sm outline-none" />
                    </div>
                  </label>
                )}

                <label className="block text-sm">
                  <span className="theme-text mb-1 block">{ui.email}</span>
                  <div className="input-surface flex items-center gap-2 rounded-xl border px-3 py-2">
                    <Mail className="h-4 w-4 text-brand-300" />
                    <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full bg-transparent text-sm outline-none" />
                  </div>
                </label>

                <label className="block text-sm">
                  <span className="theme-text mb-1 block">{ui.password}</span>
                  <div className="input-surface flex items-center gap-2 rounded-xl border px-3 py-2">
                    <Lock className="h-4 w-4 text-brand-300" />
                    <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full bg-transparent text-sm outline-none" />
                  </div>
                </label>

                {error && <p className="rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-pulse-500 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-65"
                >
                  {loading ? "..." : mode === "login" ? ui.submitLogin : ui.submitRegister}
                </button>
              </motion.form>
            </AnimatePresence>

            <p className="theme-muted mt-4 text-xs">{ui.support}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
