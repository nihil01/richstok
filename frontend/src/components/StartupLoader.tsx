import {motion} from "framer-motion";
import {Car} from "lucide-react";
import type {Language} from "@/types/ui";

type StartupLoaderProps = {
  language: Language;
};

const loaderText: Record<Language, {tag: string; title: string; subtitle: string}> = {
  az: {
    tag: "RICHSTOK CATALOG",
    title: "Məhsul vitrinini yükləyirik",
    subtitle: "Kateqoriyalar, brendlər və satış liderləri hazırlanır..."
  },
  en: {
    tag: "RICHSTOK CATALOG",
    title: "Loading product showcase",
    subtitle: "Preparing categories, brands, and bestsellers..."
  },
  ru: {
    tag: "RICHSTOK CATALOG",
    title: "Загрузка витрины товаров",
    subtitle: "Загружаем категории, бренды и хиты продаж..."
  }
};

export default function StartupLoader({language}: StartupLoaderProps) {
  const copy = loaderText[language];

  return (
    <motion.div
      initial={{opacity: 1}}
      exit={{opacity: 0, transition: {duration: 0.35, ease: "easeOut"}}}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--bg-base)]"
    >
      <div className="w-[min(92vw,560px)] space-y-5">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.26em] text-brand-300">{copy.tag}</p>
          <h2 className="theme-heading mt-2 text-2xl font-semibold">{copy.title}</h2>
        </div>

        <div className="relative overflow-hidden rounded-full border border-brand-500/35 bg-[var(--input-bg)] px-4 py-4">
          <div className="absolute inset-x-3 top-1/2 h-[2px] -translate-y-1/2 bg-gradient-to-r from-transparent via-brand-400/70 to-transparent" />
          <motion.div
            className="w-fit rounded-full border border-brand-400/35 bg-brand-600/20 p-2.5 text-brand-100 shadow-glow"
            animate={{x: ["-15%", "112%"]}}
            transition={{duration: 1.3, repeat: Infinity, ease: "linear"}}
          >
            <Car className="h-5 w-5" />
          </motion.div>
        </div>

        <motion.div
          initial={{opacity: 0.3}}
          animate={{opacity: [0.35, 1, 0.35]}}
          transition={{duration: 1.3, repeat: Infinity, ease: "easeInOut"}}
          className="theme-text text-center text-sm"
        >
          {copy.subtitle}
        </motion.div>
      </div>
    </motion.div>
  );
}
