import {createAdminUser, deleteAdminUser, fetchAdminUsers, setAdminUserActive} from "@/api/client";
import type {AdminCreateUserPayload, AdminManagedUser, UserRole} from "@/types/auth";
import type {Language} from "@/types/ui";
import {motion} from "framer-motion";
import {Mail, ShieldCheck, ShieldX, Trash2, UserPlus} from "lucide-react";
import type {FormEvent} from "react";
import {useEffect, useState} from "react";

type AdminUsersCardProps = {
  language: Language;
};

const initialForm: AdminCreateUserPayload = {
  fullName: "",
  email: "",
  password: "",
  role: "USER",
  active: true
};

const copy: Record<
  Language,
  {
    title: string;
    subtitle: string;
    fullName: string;
    email: string;
    password: string;
    role: string;
    roleUser: string;
    roleAdmin: string;
    active: string;
    create: string;
    creating: string;
    success: string;
    users: string;
    empty: string;
    loading: string;
    enabled: string;
    disabled: string;
    toggleOn: string;
    toggleOff: string;
    delete: string;
    confirmDelete: string;
    errors: {
      load: string;
      save: string;
      toggle: string;
      delete: string;
    };
  }
> = {
  az: {
    title: "İstifadəçi qeydiyyatı",
    subtitle: "Yeni istifadəçini yalnız admin yaradır və giriş məlumatları SMTP ilə göndərilir.",
    fullName: "Ad Soyad",
    email: "E-poçt",
    password: "Parol",
    role: "Rol",
    roleUser: "İstifadəçi",
    roleAdmin: "Admin",
    active: "Giriş aktiv olsun",
    create: "İstifadəçi yarat",
    creating: "Yaradılır...",
    success: "İstifadəçi yaradıldı və giriş məlumatı e-poçta göndərildi.",
    users: "İstifadəçilər",
    empty: "Hələ istifadəçi yoxdur.",
    loading: "İstifadəçilər yüklənir...",
    enabled: "Aktiv",
    disabled: "Söndürülüb",
    toggleOn: "Aktiv et",
    toggleOff: "Söndür",
    delete: "Sil",
    confirmDelete: "Bu istifadəçini silmək istədiyinizə əminsiniz?",
    errors: {
      load: "İstifadəçiləri yükləmək mümkün olmadı.",
      save: "İstifadəçi yaratmaq alınmadı.",
      toggle: "Statusu yeniləmək alınmadı.",
      delete: "İstifadəçini silmək alınmadı."
    }
  },
  en: {
    title: "User registration",
    subtitle: "Only admins can create users. Credentials are sent to user email over SMTP.",
    fullName: "Full name",
    email: "Email",
    password: "Password",
    role: "Role",
    roleUser: "User",
    roleAdmin: "Admin",
    active: "Enable login access",
    create: "Create user",
    creating: "Creating...",
    success: "User created and credentials were sent by email.",
    users: "Users",
    empty: "No users yet.",
    loading: "Loading users...",
    enabled: "Enabled",
    disabled: "Disabled",
    toggleOn: "Enable",
    toggleOff: "Disable",
    delete: "Delete",
    confirmDelete: "Are you sure you want to delete this user?",
    errors: {
      load: "Failed to load users.",
      save: "Failed to create user.",
      toggle: "Failed to update user status.",
      delete: "Failed to delete user."
    }
  },
  ru: {
    title: "Регистрация пользователей",
    subtitle: "Пользователя создаёт только админ. Данные для входа отправляются через SMTP на email.",
    fullName: "Имя и фамилия",
    email: "Email",
    password: "Пароль",
    role: "Роль",
    roleUser: "Пользователь",
    roleAdmin: "Админ",
    active: "Разрешить вход",
    create: "Создать пользователя",
    creating: "Создание...",
    success: "Пользователь создан, данные для входа отправлены на email.",
    users: "Пользователи",
    empty: "Пользователей пока нет.",
    loading: "Загрузка пользователей...",
    enabled: "Активен",
    disabled: "Отключён",
    toggleOn: "Включить",
    toggleOff: "Выключить",
    delete: "Удалить",
    confirmDelete: "Точно удалить этого пользователя?",
    errors: {
      load: "Не удалось загрузить пользователей.",
      save: "Не удалось создать пользователя.",
      toggle: "Не удалось изменить статус пользователя.",
      delete: "Не удалось удалить пользователя."
    }
  }
};

export default function AdminUsersCard({language}: AdminUsersCardProps) {
  const ui = copy[language];
  const [users, setUsers] = useState<AdminManagedUser[]>([]);
  const [form, setForm] = useState<AdminCreateUserPayload>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const data = await fetchAdminUsers();
      setUsers(data);
      setError(null);
    } catch {
      setError(ui.errors.load);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const created = await createAdminUser(form);
      setUsers((prev) => [created, ...prev]);
      setForm(initialForm);
      setSuccess(ui.success);
    } catch {
      setError(ui.errors.save);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleUser(user: AdminManagedUser) {
    try {
      setError(null);
      const updatedUser = await setAdminUserActive(user.id, !user.active);
      setUsers((prev) => prev.map((item) => (item.id === user.id ? updatedUser : item)));
    } catch {
      setError(ui.errors.toggle);
    }
  }

  async function handleDeleteUser(user: AdminManagedUser) {
    if (!window.confirm(ui.confirmDelete)) {
      return;
    }
    try {
      setError(null);
      await deleteAdminUser(user.id);
      setUsers((prev) => prev.filter((item) => item.id !== user.id));
    } catch {
      setError(ui.errors.delete);
    }
  }

  function resolveRoleLabel(role: UserRole) {
    return role === "ADMIN" ? ui.roleAdmin : ui.roleUser;
  }

  return (
    <motion.article initial={{opacity: 0, y: 12}} animate={{opacity: 1, y: 0}} transition={{duration: 0.35}} className="glass-card rounded-3xl p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="theme-heading text-xl font-semibold">{ui.title}</h2>
          <p className="theme-text mt-1 text-sm">{ui.subtitle}</p>
        </div>
        <UserPlus className="h-6 w-6 text-brand-300" />
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 lg:grid-cols-2">
        <label className="block text-sm">
          <span className="theme-text mb-1 block">{ui.fullName}</span>
          <input
            required
            value={form.fullName}
            onChange={(event) => setForm((prev) => ({...prev, fullName: event.target.value}))}
            className="input-surface w-full rounded-xl border px-3 py-2 outline-none transition focus:border-brand-300"
          />
        </label>

        <label className="block text-sm">
          <span className="theme-text mb-1 block">{ui.email}</span>
          <div className="input-surface flex items-center gap-2 rounded-xl border px-3 py-2">
            <Mail className="h-4 w-4 text-brand-300" />
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({...prev, email: event.target.value}))}
              className="w-full bg-transparent outline-none"
            />
          </div>
        </label>

        <label className="block text-sm">
          <span className="theme-text mb-1 block">{ui.password}</span>
          <input
            required
            type="password"
            minLength={8}
            value={form.password}
            onChange={(event) => setForm((prev) => ({...prev, password: event.target.value}))}
            className="input-surface w-full rounded-xl border px-3 py-2 outline-none transition focus:border-brand-300"
          />
        </label>

        <label className="block text-sm">
          <span className="theme-text mb-1 block">{ui.role}</span>
          <select
            value={form.role}
            onChange={(event) => setForm((prev) => ({...prev, role: event.target.value as UserRole}))}
            className="input-surface w-full rounded-xl border px-3 py-2 outline-none transition focus:border-brand-300"
          >
            <option value="USER">{ui.roleUser}</option>
            <option value="ADMIN">{ui.roleAdmin}</option>
          </select>
        </label>

        <label className="theme-text inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(event) => setForm((prev) => ({...prev, active: event.target.checked}))}
            className="accent-brand-500"
          />
          {ui.active}
        </label>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-gradient-to-r from-brand-500 to-pulse-500 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-70 lg:w-auto lg:justify-self-end"
        >
          {saving ? ui.creating : ui.create}
        </button>
      </form>

      {error && <p className="mt-4 rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</p>}
      {success && <p className="mt-4 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">{success}</p>}

      <div className="mt-5 border-t border-white/10 pt-4">
        <h3 className="theme-heading text-sm uppercase tracking-[0.16em]">{ui.users}</h3>
        {loading && <p className="theme-text mt-2 text-sm">{ui.loading}</p>}

        {!loading && users.length === 0 && <p className="theme-text mt-2 text-sm">{ui.empty}</p>}

        {!loading && users.length > 0 && (
          <div className="mt-3 space-y-2">
            {users.map((user) => (
              <div key={user.id} className="tile-surface flex flex-wrap items-center justify-between gap-3 rounded-2xl px-3 py-2.5">
                <div className="min-w-0">
                  <p className="theme-heading truncate text-sm font-medium">{user.fullName}</p>
                  <p className="theme-muted truncate text-xs">{user.email}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-white/10 px-2 py-1 text-xs theme-text">{resolveRoleLabel(user.role)}</span>
                  <span className={`rounded-md border px-2 py-1 text-xs ${user.active ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-100" : "border-rose-500/35 bg-rose-500/10 text-rose-100"}`}>
                    {user.active ? ui.enabled : ui.disabled}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleToggleUser(user)}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs theme-text transition hover:border-brand-300"
                  >
                    {user.active ? <ShieldX className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                    {user.active ? ui.toggleOff : ui.toggleOn}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteUser(user)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-500/35 bg-rose-500/10 px-2.5 py-1.5 text-xs text-rose-100 transition hover:bg-rose-500/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {ui.delete}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.article>
  );
}
