import RichstokLogo from "@/components/logo/RichstokLogo";
import type {Language} from "@/types/ui";
import {motion} from "framer-motion";
import {ArrowRight, Lock} from "lucide-react";

type PublicGatewayPageProps = {
  language: Language;
  b4bLoginUrl: string;
};

const copy: Record<
  Language,
  {
    badge: string;
    title: string;
    body: string;
    button: string;
    hint: string;
  }
> = {
  az: {
    badge: "RICHSTOK PUBLIC",
    title: "Bu açıq vitrindir",
    body: "Funksional B4B mağazaya daxil olmaq üçün əvvəlcə sistemə giriş et.",
    button: "B4B girişə keç",
    hint: "Giriş: b4b.richstok.com/login"
  },
  en: {
    badge: "RICHSTOK PUBLIC",
    title: "This is a public storefront",
    body: "To open the functional B4B shop, sign in first.",
    button: "Go to B4B login",
    hint: "Login: b4b.richstok.com/login"
  },
  ru: {
    badge: "RICHSTOK PUBLIC",
    title: "Это публичная витрина",
    body: "Чтобы перейти в рабочий B4B-магазин, сначала авторизуйся.",
    button: "Перейти к B4B-входу",
    hint: "Вход: b4b.richstok.com/login"
  }
};

export default function PublicGatewayPage({language, b4bLoginUrl}: PublicGatewayPageProps) {
  const ui = copy[language];

  return (
    <motion.section
      initial={{opacity: 0, y: 18}}
      animate={{opacity: 1, y: 0}}
      transition={{duration: 0.28, ease: "easeOut"}}
      className="glass-card relative overflow-hidden rounded-3xl border border-brand-500/30 p-7 text-center sm:p-9"
    >
      <div className="pointer-events-none absolute -right-20 -top-16 h-52 w-52 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-pulse-500/18 blur-3xl" />

      <p className="text-xs uppercase tracking-[0.2em] text-brand-300">{ui.badge}</p>

      <div className="logo-shell mx-auto mt-4 inline-flex rounded-xl border p-1.5">
        <RichstokLogo className="h-14 sm:h-16" />
      </div>

      <h1 className="theme-heading mt-5 text-2xl font-semibold sm:text-3xl">{ui.title}</h1>
      <p className="theme-text mx-auto mt-2 max-w-2xl text-sm sm:text-base">{ui.body}</p>

      <a
        href={b4bLoginUrl}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-pulse-500 px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
      >
        <Lock className="h-4 w-4" />
        {ui.button}
        <ArrowRight className="h-4 w-4" />
      </a>

      <p className="theme-muted mt-4 text-xs">{ui.hint}</p>
    </motion.section>
  );
}
