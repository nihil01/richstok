import type {AuthUser} from "@/types/auth";
import type {Language} from "@/types/ui";
import {motion} from "framer-motion";
import {Box, ClipboardList, ShieldCheck} from "lucide-react";

type AccountPageProps = {
  language: Language;
  user: AuthUser | null;
};

const copy: Record<
  Language,
  {
    title: string;
    subtitle: string;
    roleLabel: string;
    cards: Array<{title: string; description: string}>;
  }
> = {
  az: {
    title: "İstifadəçi kabineti",
    subtitle: "Sifarişlərin, seçilmiş məhsulların və hesab ayarlarının idarəsi.",
    roleLabel: "Rol",
    cards: [
      {title: "Sifarişlərim", description: "Son sifariş statusları və detallar."},
      {title: "Seçilmiş məhsullar", description: "Sürətli alış üçün saxlanmış məhsullar."},
      {title: "Hesab təhlükəsizliyi", description: "Parol və giriş aktivliyi nəzarəti."}
    ]
  },
  en: {
    title: "User dashboard",
    subtitle: "Manage your orders, saved products, and account settings.",
    roleLabel: "Role",
    cards: [
      {title: "My orders", description: "Recent order statuses and details."},
      {title: "Saved products", description: "Parts saved for fast checkout."},
      {title: "Account security", description: "Password and sign-in activity control."}
    ]
  },
  ru: {
    title: "Личный кабинет",
    subtitle: "Управление заказами, сохраненными товарами и настройками аккаунта.",
    roleLabel: "Роль",
    cards: [
      {title: "Мои заказы", description: "Статусы и детали последних заказов."},
      {title: "Избранные товары", description: "Товары для быстрого повторного заказа."},
      {title: "Безопасность аккаунта", description: "Контроль пароля и активности входов."}
    ]
  }
};

const icons = [ClipboardList, Box, ShieldCheck];

export default function AccountPage({language, user}: AccountPageProps) {
  const ui = copy[language];

  return (
    <motion.section initial={{opacity: 0, y: 14}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}} transition={{duration: 0.3}} className="space-y-5">
      <header className="glass-card rounded-2xl p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-200">Richstok</p>
        <h1 className="theme-heading mt-2 text-3xl font-semibold">{ui.title}</h1>
        <p className="theme-text mt-2 text-sm">{ui.subtitle}</p>
        {user && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-brand-500/30 bg-brand-500/10 px-3 py-1.5 text-sm text-brand-100">
            <span>{user.fullName}</span>
            <span className="text-brand-300">•</span>
            <span>
              {ui.roleLabel}: {user.role}
            </span>
          </div>
        )}
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {ui.cards.map((card, index) => {
          const Icon = icons[index];
          return (
            <article key={card.title} className="glass-card rounded-xl p-4">
              <Icon className="h-5 w-5 text-brand-300" />
              <h3 className="theme-heading mt-3 font-semibold">{card.title}</h3>
              <p className="theme-text mt-1 text-sm">{card.description}</p>
            </article>
          );
        })}
      </section>
    </motion.section>
  );
}
