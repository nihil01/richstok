import {login} from "@/api/client";
import RichstokLogo from "@/components/logo/RichstokLogo";
import type {AuthUser} from "@/types/auth";
import type {Language} from "@/types/ui";
import {AnimatePresence, motion} from "framer-motion";
import {Lock, Mail, X} from "lucide-react";
import {FormEvent, useEffect, useState} from "react";

type AuthModalProps = {
  language: Language;
  open: boolean;
  onClose: () => void;
  onAuthenticated: (user: AuthUser) => void;
};

const copy: Record<
  Language,
  {
    title: string;
    subtitle: string;
    email: string;
    password: string;
    submitLogin: string;
    failed: string;
    support: string;
  }
> = {
  az: {
    title: "RICHSTOK hesabı",
    subtitle: "Yalnız giriş. Yeni hesablar admin paneldən yaradılır.",
    email: "E-poçt",
    password: "Şifrə",
    submitLogin: "Daxil ol",
    failed: "Əməliyyat alınmadı. Məlumatları yoxla.",
    support: "Yeni hesab üçün adminlə əlaqə saxla."
  },
  en: {
    title: "RICHSTOK account",
    subtitle: "Login only. New users are created by an admin.",
    email: "Email",
    password: "Password",
    submitLogin: "Sign in",
    failed: "Request failed. Check your credentials.",
    support: "Contact an admin to create your account."
  },
  ru: {
    title: "Аккаунт RICHSTOK",
    subtitle: "Только вход. Регистрация доступна только в админ-панели.",
    email: "Email",
    password: "Пароль",
    submitLogin: "Войти",
    failed: "Запрос не выполнен. Проверь данные.",
    support: "Для создания аккаунта обратись к администратору."
  }
};

export default function AuthModal({language, open, onClose, onAuthenticated}: AuthModalProps) {
  const ui = copy[language];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setError(null);
  }, [open]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const user = await login({email, password});
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
                <div className="logo-shell mb-3 inline-flex rounded-lg border p-1">
                  <RichstokLogo className="h-9 sm:h-9" />
                </div>
                <h2 className="theme-heading text-2xl font-semibold">{ui.title}</h2>
                <p className="theme-text mt-1 text-sm">{ui.subtitle}</p>
              </div>
              <button type="button" className="theme-muted rounded-lg p-1.5 transition hover:bg-white/10" onClick={onClose} aria-label="Close auth modal">
                <X className="h-4 w-4" />
              </button>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.form
                key="login"
                initial={{opacity: 0, x: -14}}
                animate={{opacity: 1, x: 0}}
                exit={{opacity: 0, x: 14}}
                transition={{duration: 0.2}}
                onSubmit={handleSubmit}
                className="relative space-y-3"
              >
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
                  {loading ? "..." : ui.submitLogin}
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
