import { motion } from "framer-motion";
import { Car, Wrench, Sparkles } from "lucide-react";
import type { Language } from "@/types/ui";
import RichstokLogo from "@/components/logo/RichstokLogo";

type StartupLoaderProps = {
  language: Language;
};

const loaderText: Record<Language, { tag: string; title: string; subtitle: string }> = {
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

export default function StartupLoader({ language }: StartupLoaderProps) {
  const copy = loaderText[language];

  return (
      <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4, ease: "easeOut" } }}
          className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-[var(--bg-base)]"
      >
        <div className="pointer-events-none absolute inset-0">
          <motion.div
              className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/10 blur-3xl"
              animate={{ scale: [1, 1.08, 1], opacity: [0.2, 0.35, 0.2] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="relative w-[min(92vw,620px)] space-y-6">
          <div className="text-center">
            <div className="logo-shell mx-auto mb-3 inline-flex rounded-xl border p-1.5">
              <RichstokLogo className="h-10 sm:h-11" />
            </div>
            <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="text-xs uppercase tracking-[0.28em] text-brand-300"
            >
              {copy.tag}
            </motion.p>

            <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08 }}
                className="theme-heading mt-2 text-2xl font-semibold sm:text-3xl"
            >
              {copy.title}
            </motion.h2>
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-brand-500/25 bg-[var(--input-bg)] px-5 py-7 shadow-[0_0_40px_rgba(0,0,0,0.18)]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/50 to-transparent" />

            <div className="mb-5 flex items-center justify-center gap-2 text-brand-200/85">
              <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <Wrench className="h-4 w-4" />
              </motion.div>
              <span className="text-xs uppercase tracking-[0.22em]">Auto Parts System</span>
              <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="h-4 w-4" />
              </motion.div>
            </div>

            <div className="relative h-24 overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-brand-950/20 via-transparent to-black/10">
              <div className="absolute inset-x-4 bottom-5 h-[3px] rounded-full bg-white/10" />

              <motion.div
                  className="absolute bottom-[18px] left-0 right-0 flex gap-6"
                  animate={{ x: ["0%", "-50%"] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              >
                {Array.from({ length: 12 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-[3px] w-12 shrink-0 rounded-full bg-brand-300/70"
                    />
                ))}
              </motion.div>

              <motion.div
                  className="absolute bottom-8 left-0"
                  animate={{
                    x: ["-18%", "112%"],
                    y: [0, -2, 0, 2, 0]
                  }}
                  transition={{
                    x: { duration: 2.2, repeat: Infinity, ease: "linear" },
                    y: { duration: 0.45, repeat: Infinity, ease: "easeInOut" }
                  }}
              >
                <div className="relative">
                  <motion.div
                      className="absolute -inset-3 rounded-full bg-brand-400/20 blur-xl"
                      animate={{ opacity: [0.25, 0.45, 0.25], scale: [0.95, 1.08, 0.95] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                  />

                  <div className="relative rounded-2xl border border-brand-400/30 bg-brand-600/15 p-3 text-brand-50 shadow-glow backdrop-blur-sm">
                    <Car className="h-7 w-7" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                  className="absolute inset-y-0 left-[-25%] w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg]"
                  animate={{ x: ["0%", "380%"] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            <div className="mt-5 flex items-center justify-center gap-2">
              {[0, 1, 2].map((i) => (
                  <motion.span
                      key={i}
                      className="h-2.5 w-2.5 rounded-full bg-brand-300"
                      animate={{ opacity: [0.25, 1, 0.25], scale: [0.9, 1.2, 0.9] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.18
                      }}
                  />
              ))}
            </div>
          </div>

          <motion.div
              initial={{ opacity: 0.3 }}
              animate={{ opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="theme-text text-center text-sm"
          >
            {copy.subtitle}
          </motion.div>
        </div>
      </motion.div>
  );
}
