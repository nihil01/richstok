import RichstokLogo from "@/components/logo/RichstokLogo";
import type {Language} from "@/types/ui";
import {motion} from "framer-motion";
import {Mail, MapPin, Phone, ShieldCheck, Truck, Warehouse} from "lucide-react";
import {Link} from "react-router-dom";

type SiteFooterProps = {
  language: Language;
  baseCode: string;
  rates: Record<string, number>;
};

const copy: Record<
  Language,
  {
    subtitle: string;
    rates: string;
    navigation: string;
    contacts: string;
    links: {store: string; account: string; admin: string; cart: string};
    badges: string[];
    contact: {email: string; phone: string; city: string};
    legalLine: string;
  }
> = {
  az: {
    subtitle: "Avtomobil ehtiyat hissələri satışı",
    rates: "Valyuta kursu",
    navigation: "Naviqasiya",
    contacts: "Əlaqə",
    links: {store: "Mağaza", account: "Kabinet", admin: "Admin", cart: "Səbət"},
    badges: ["Canlı stok", "Sürətli çatdırılma", "Rəsmi məhsullar"],
    contact: {
      email: "admin@richstok.com",
      phone: "+994 50 000 00 00",
      city: "Bakı, Azərbaycan"
    },
    legalLine: "© 2026 RICHSTOK. Bütün hüquqlar qorunur."
  },
  en: {
    subtitle: "Automotive parts",
    rates: "Exchange rates",
    navigation: "Navigation",
    contacts: "Contacts",
    links: {store: "Store", account: "Account", admin: "Admin", cart: "Cart"},
    badges: ["Live inventory", "Fast delivery", "Official parts"],
    contact: {
      email: "admin@richstok.com",
      phone: "+994 50 000 00 00",
      city: "Baku, Azerbaijan"
    },
    legalLine: "© 2026 RICHSTOK. All rights reserved."
  },
  ru: {
    subtitle: "Продажа автозапчастей",
    rates: "Курсы валют",
    navigation: "Навигация",
    contacts: "Контакты",
    links: {store: "Магазин", account: "Кабинет", admin: "Админ", cart: "Корзина"},
    badges: ["Живой сток", "Быстрая доставка", "Официальные детали"],
    contact: {
      email: "admin@richstok.com",
      phone: "+994 50 000 00 00",
      city: "Баку, Азербайджан"
    },
    legalLine: "© 2026 RICHSTOK. Все права защищены."
  }
};

const badgeIcons = [Warehouse, Truck, ShieldCheck];

export default function SiteFooter({language, baseCode, rates}: SiteFooterProps) {
  const ui = copy[language];
  const locale = language === "ru" ? "ru-RU" : language === "en" ? "en-GB" : "az-Latn-AZ";
  const normalizedBaseCode = baseCode?.trim().toUpperCase() || "AZN";

  const rateRows = [
    {code: normalizedBaseCode, value: 1},
    {code: "USD", value: resolveRate(rates, "USD")},
    {code: "EUR", value: resolveRate(rates, "EUR")}
  ];

  return (
    <motion.footer
      initial={{opacity: 0, y: 14}}
      animate={{opacity: 1, y: 0}}
      transition={{duration: 0.35}}
      className="relative mt-auto overflow-hidden border-t border-brand-500/20 bg-black/20"
    >
      <motion.div
        className="pointer-events-none absolute left-[-20%] top-0 h-px w-1/3 bg-gradient-to-r from-transparent via-brand-400/70 to-transparent"
        animate={{x: ["0%", "420%"]}}
        transition={{duration: 4.2, repeat: Infinity, ease: "linear"}}
      />
      <div className="pointer-events-none absolute -bottom-20 right-8 h-44 w-44 rounded-full bg-brand-500/20 blur-3xl" />

      <div className="mx-auto grid w-full max-w-[1360px] gap-6 px-4 py-8 sm:px-6 md:grid-cols-3">
        <div>
          <motion.div whileHover={{scale: 1.02}} className="logo-shell inline-flex max-w-[230px] rounded-xl border p-1.5">
            <RichstokLogo className="h-11 sm:h-12" />
          </motion.div>
          <p className="theme-text mt-2 text-sm">{ui.subtitle}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {ui.badges.map((badge, index) => {
              const Icon = badgeIcons[index];
              return (
                <motion.span
                  key={badge}
                  className="inline-flex items-center gap-1 rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-1 text-[11px] text-brand-100"
                  animate={{opacity: [0.75, 1, 0.75]}}
                  transition={{duration: 1.8, repeat: Infinity, delay: index * 0.2}}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {badge}
                </motion.span>
              );
            })}
          </div>
          <div className="mt-4">
            <p className="theme-muted text-[11px] uppercase tracking-[0.12em]">{ui.rates}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {rateRows.map((row) => (
                <span key={row.code} className="inline-flex items-center gap-1 rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-1 text-[11px] text-brand-100">
                  <span className="font-semibold">{row.code}</span>
                  <span className="theme-text">{formatRate(row.value, locale)}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div>
          <p className="theme-heading text-sm font-semibold uppercase tracking-[0.12em]">{ui.navigation}</p>
          <div className="mt-2 flex flex-col gap-1.5 text-sm">
            <Link to="/" className="theme-text transition hover:translate-x-1 hover:text-brand-200">{ui.links.store}</Link>
            <Link to="/cart" className="theme-text transition hover:translate-x-1 hover:text-brand-200">{ui.links.cart}</Link>
            <Link to="/account" className="theme-text transition hover:translate-x-1 hover:text-brand-200">{ui.links.account}</Link>
            <Link to="/admin" className="theme-text transition hover:translate-x-1 hover:text-brand-200">{ui.links.admin}</Link>
          </div>
        </div>

        <div>
          <p className="theme-heading text-sm font-semibold uppercase tracking-[0.12em]">{ui.contacts}</p>
          <div className="mt-2 space-y-2 text-sm">
            <p className="theme-text inline-flex items-center gap-2">
              <Mail className="h-4 w-4 text-brand-300" />
              {ui.contact.email}
            </p>
            <p className="theme-text inline-flex items-center gap-2">
              <Phone className="h-4 w-4 text-brand-300" />
              {ui.contact.phone}
            </p>
            <p className="theme-text inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-300" />
              {ui.contact.city}
            </p>
          </div>
          <p className="theme-muted mt-4 text-xs">{ui.legalLine}</p>
        </div>
      </div>
    </motion.footer>
  );
}

function resolveRate(rates: Record<string, number>, code: string): number {
  const value = rates[code];
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (code === "USD") {
    return 0.5882;
  }
  if (code === "EUR") {
    return 0.5093;
  }
  return 1;
}

function formatRate(value: number, locale: string): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "—";
  }
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: value >= 1 ? 2 : 4,
    maximumFractionDigits: value >= 1 ? 3 : 4
  }).format(value);
}
