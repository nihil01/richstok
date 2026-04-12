import type {Language} from "@/types/ui";
import {Link} from "react-router-dom";

type SiteFooterProps = {
  language: Language;
};

const copy: Record<
  Language,
  {
    title: string;
    subtitle: string;
    navigation: string;
    contacts: string;
    legal: string;
    links: {store: string; account: string; admin: string; cart: string};
    contactLines: string[];
    legalLine: string;
  }
> = {
  az: {
    title: "RICHSTOK",
    subtitle: "Avtomobil ehtiyat hissələri satışı",
    navigation: "Naviqasiya",
    contacts: "Əlaqə",
    legal: "Məlumat",
    links: {store: "Mağaza", account: "Kabinet", admin: "Admin", cart: "Səbət"},
    contactLines: ["Email: admin@richstok.com", "Tel: +994 50 000 00 00", "Bakı, Azərbaycan"],
    legalLine: "© 2026 RICHSTOK. Bütün hüquqlar qorunur."
  },
  en: {
    title: "RICHSTOK",
    subtitle: "Automotive parts",
    navigation: "Navigation",
    contacts: "Contacts",
    legal: "Info",
    links: {store: "Store", account: "Account", admin: "Admin", cart: "Cart"},
    contactLines: ["Email: admin@richstok.com", "Phone: +994 50 000 00 00", "Baku, Azerbaijan"],
    legalLine: "© 2026 RICHSTOK. All rights reserved."
  },
  ru: {
    title: "RICHSTOK",
    subtitle: "Продажа автозапчастей",
    navigation: "Навигация",
    contacts: "Контакты",
    legal: "Информация",
    links: {store: "Магазин", account: "Кабинет", admin: "Админ", cart: "Корзина"},
    contactLines: ["Email: admin@richstok.com", "Тел: +994 50 000 00 00", "Баку, Азербайджан"],
    legalLine: "© 2026 RICHSTOK. Все права защищены."
  }
};

export default function SiteFooter({language}: SiteFooterProps) {
  const ui = copy[language];

  return (
    <footer className="mt-10 border-t border-brand-500/20 bg-black/20">
      <div className="mx-auto grid w-full max-w-[1360px] gap-6 px-4 py-8 sm:px-6 md:grid-cols-3">
        <div>
          <p className="theme-heading text-lg font-semibold">{ui.title}</p>
          <p className="theme-text mt-2 text-sm">{ui.subtitle}</p>
        </div>

        <div>
          <p className="theme-heading text-sm font-semibold uppercase tracking-[0.12em]">{ui.navigation}</p>
          <div className="mt-2 flex flex-col gap-1 text-sm">
            <Link to="/" className="theme-text transition hover:text-brand-200">{ui.links.store}</Link>
            <Link to="/cart" className="theme-text transition hover:text-brand-200">{ui.links.cart}</Link>
            <Link to="/account" className="theme-text transition hover:text-brand-200">{ui.links.account}</Link>
            <Link to="/admin" className="theme-text transition hover:text-brand-200">{ui.links.admin}</Link>
          </div>
        </div>

        <div>
          <p className="theme-heading text-sm font-semibold uppercase tracking-[0.12em]">{ui.contacts}</p>
          <div className="mt-2 space-y-1 text-sm">
            {ui.contactLines.map((line) => (
              <p key={line} className="theme-text">{line}</p>
            ))}
          </div>
          <p className="theme-muted mt-4 text-xs">{ui.legalLine}</p>
        </div>
      </div>
    </footer>
  );
}
