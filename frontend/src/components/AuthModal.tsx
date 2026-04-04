import {login, register} from "@/api/client";
import type {AuthUser} from "@/types/auth";
import type {Language} from "@/types/ui";
import {AnimatePresence, motion} from "framer-motion";
import {X} from "lucide-react";
import {FormEvent, useEffect, useState} from "react";

type AuthMode = "login" | "register";

type AuthModalProps = {
  language: Language;
  open: boolean;
  mode: AuthMode;
  onClose: () => void;
  onAuthenticated: (user: AuthUser) => void;
};

const copy: Record<
  Language,
  {
    login: string;
    register: string;
    subtitle: string;
    fullName: string;
    email: string;
    password: string;
    submitLogin: string;
    submitRegister: string;
    switchToLogin: string;
    switchToRegister: string;
    failed: string;
  }
> = {
  az: {
    login: "Giriş",
    register: "Qeydiyyat",
    subtitle: "Sifariş tarixçəsi və şəxsi menyu üçün hesabına daxil ol.",
    fullName: "Ad Soyad",
    email: "E-poçt",
    password: "Şifrə",
    submitLogin: "Daxil ol",
    submitRegister: "Hesab yarat",
    switchToLogin: "Artıq hesabın var?",
    switchToRegister: "Hesabın yoxdur?",
    failed: "Əməliyyat alınmadı. Məlumatları yoxla."
  },
  en: {
    login: "Login",
    register: "Register",
    subtitle: "Sign in to access personal menu and order flows.",
    fullName: "Full name",
    email: "Email",
    password: "Password",
    submitLogin: "Sign in",
    submitRegister: "Create account",
    switchToLogin: "Already have an account?",
    switchToRegister: "No account yet?",
    failed: "Request failed. Please check your data."
  },
  ru: {
    login: "Вход",
    register: "Регистрация",
    subtitle: "Войди в аккаунт для персонального меню и заказов.",
    fullName: "Имя и фамилия",
    email: "Email",
    password: "Пароль",
    submitLogin: "Войти",
    submitRegister: "Создать аккаунт",
    switchToLogin: "Уже есть аккаунт?",
    switchToRegister: "Нет аккаунта?",
    failed: "Запрос не выполнен. Проверь данные."
  }
};

export default function AuthModal({language, open, mode, onClose, onAuthenticated}: AuthModalProps) {
  const ui = copy[language];
  const [activeMode, setActiveMode] = useState<AuthMode>(mode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setActiveMode(mode);
    setError(null);
  }, [mode, open]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const user = activeMode === "login" ? await login({email, password}) : await register({fullName, email, password});
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
        <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-4">
          <motion.div
            initial={{opacity: 0, scale: 0.98, y: 16}}
            animate={{opacity: 1, scale: 1, y: 0}}
            exit={{opacity: 0, scale: 0.98, y: 8}}
            className="glass-card w-full max-w-md rounded-2xl p-6"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="theme-heading text-2xl font-semibold">{activeMode === "login" ? ui.login : ui.register}</h2>
                <p className="theme-text mt-1 text-sm">{ui.subtitle}</p>
              </div>
              <button type="button" className="theme-muted rounded-md p-1 transition hover:bg-white/10" onClick={onClose} aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {activeMode === "register" && (
                <label className="block text-sm">
                  <span className="theme-text mb-1 block">{ui.fullName}</span>
                  <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="input-surface w-full rounded-xl border px-3 py-2 outline-none transition focus:border-brand-300" />
                </label>
              )}

              <label className="block text-sm">
                <span className="theme-text mb-1 block">{ui.email}</span>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="input-surface w-full rounded-xl border px-3 py-2 outline-none transition focus:border-brand-300" />
              </label>

              <label className="block text-sm">
                <span className="theme-text mb-1 block">{ui.password}</span>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="input-surface w-full rounded-xl border px-3 py-2 outline-none transition focus:border-brand-300" />
              </label>

              {error && <p className="rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</p>}

              <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-pulse-500 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-70">
                {loading ? "..." : activeMode === "login" ? ui.submitLogin : ui.submitRegister}
              </button>
            </form>

            <button type="button" className="theme-muted mt-3 text-sm transition hover:text-brand-200" onClick={() => setActiveMode((prev) => (prev === "login" ? "register" : "login"))}>
              {activeMode === "login" ? ui.switchToRegister : ui.switchToLogin}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
