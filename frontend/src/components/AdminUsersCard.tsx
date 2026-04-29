import {
  createAdminUser,
  deleteAdminUser,
  fetchAdminUsers,
  updateAdminAccountProfile,
  setAdminUserActive, // Добавили вызов для активации
} from "@/api/client";
import type { AdminCreateUserPayload } from "@/types/auth";
import type { Language } from "@/types/ui";
import { AnimatePresence, motion } from "framer-motion";
import { Mail, MapPin, Pencil, Phone, Search, Shield, ShieldCheck, ShieldX, Trash2, X } from "lucide-react";
import { FormEvent, useMemo, useEffect, useState } from "react";

type AdminUsersCardProps = {
  language: Language;
};

// --- ТИПЫ ДАННЫХ ---
export type UserRole = "ADMIN" | "MANAGER" | "USER";

export type AccountProfilePayload = {
  fullName: string;
  avatarUrl: string;
  phone: string;
  phoneAlt: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  country: string;
};

export type UserProfilePayload = Omit<AccountProfilePayload, "avatarUrl">;

export type UserPayload = UserProfilePayload & {
  email: string;
  password?: string;
  role: UserRole;
  active: boolean;
};

export type UserDto = UserPayload & {
  id: number;
  currentDebt?: number;
};

// --- ЛОКАЛИЗАЦИЯ ---
const ui: Record<
    Language,
    {
      title: string;
      subtitle: string;
      searchPlaceholder: string;
      users: string;
      empty: string;
      loading: string;
      delete: string;
      toggleOn: string;
      toggleOff: string;
      form: {
        createTitle: string;
        editTitle: string;
        createSubtitle: string;
        editSubtitle: string;
        save: string;
        saving: string;
        cancel: string;
        successCreate: string;
        successUpdate: string;
        successToggle: string;
        error: string;
        fields: {
          email: string;
          password: string;
          role: string;
          active: string;
          fullName: string;
          phone: string;
          phoneAlt: string;
          addressLine1: string;
          addressLine2: string;
          city: string;
          postalCode: string;
          country: string;
        };
      };
    }
> = {
  az: {
    title: "İstifadəçi qeydiyyatı",
    subtitle: "Yeni istifadəçini yalnız admin yaradır və giriş məlumatları SMTP ilə göndərilir.",
    searchPlaceholder: "E-poçt, ad və ya telefonla axtarış",
    users: "İstifadəçilər",
    empty: "Hələ istifadəçi yoxdur.",
    loading: "İstifadəçilər yüklənir...",
    delete: "Sil",
    toggleOn: "Aktiv et",
    toggleOff: "Deaktiv et",
    form: {
      createTitle: "İstifadəçi yarat",
      editTitle: "İstifadəçini redaktə et",
      createSubtitle: "Əsas məlumatları daxil edin.",
      editSubtitle: "Əlavə profil və çatdırılma məlumatlarını redaktə edin.",
      save: "Yadda saxla",
      saving: "Yadda saxlanılır...",
      cancel: "Ləğv et",
      successCreate: "İstifadəçi yaradıldı!",
      successUpdate: "Profil yeniləndi!",
      successToggle: "Status dəyişdirildi!",
      error: "Xəta baş verdi.",
      fields: {
        email: "E-poçt",
        password: "Parol",
        role: "Rol",
        active: "Giriş aktiv olsun",
        fullName: "Ad Soyad",
        phone: "Telefon",
        phoneAlt: "Əlavə telefon",
        addressLine1: "Ünvan (Sətir 1)",
        addressLine2: "Ünvan (Sətir 2)",
        city: "Şəhər",
        postalCode: "Poçt indeksi",
        country: "Ölkə"
      }
    }
  },
  en: {
    title: "User Management",
    subtitle: "Manage users and their profiles.",
    searchPlaceholder: "Search users...",
    users: "Users",
    empty: "No users found.",
    loading: "Loading...",
    delete: "Delete",
    toggleOn: "Activate",
    toggleOff: "Deactivate",
    form: {
      createTitle: "Create User",
      editTitle: "Edit Profile",
      createSubtitle: "Enter basic details.",
      editSubtitle: "Enter additional details.",
      save: "Save",
      saving: "Saving...",
      cancel: "Cancel",
      successCreate: "User created!",
      successUpdate: "Profile updated!",
      successToggle: "Status toggled!",
      error: "Operation failed.",
      fields: {
        email: "Email",
        password: "Password",
        role: "Role",
        active: "Active",
        fullName: "Full Name",
        phone: "Phone",
        phoneAlt: "Alt. Phone",
        addressLine1: "Address 1",
        addressLine2: "Address 2",
        city: "City",
        postalCode: "Postal Code",
        country: "Country"
      }
    }
  },
  ru: {
    title: "Регистрация пользователей",
    subtitle: "Пользователя создаёт только админ. Данные для входа отправляются через SMTP на email.",
    searchPlaceholder: "Поиск по email, имени или телефону",
    users: "Пользователи",
    empty: "Пользователей пока нет.",
    loading: "Загрузка пользователей...",
    delete: "Удалить",
    toggleOn: "Активировать",
    toggleOff: "Деактивировать",
    form: {
      createTitle: "Создать пользователя",
      editTitle: "Редактировать профиль",
      createSubtitle: "Введите основные данные для регистрации.",
      editSubtitle: "Заполните дополнительные данные и адрес доставки.",
      save: "Сохранить",
      saving: "Сохранение...",
      cancel: "Отмена",
      successCreate: "Пользователь создан!",
      successUpdate: "Профиль успешно обновлен!",
      successToggle: "Статус пользователя изменен!",
      error: "Не удалось выполнить операцию.",
      fields: {
        email: "Email",
        password: "Пароль",
        role: "Роль",
        active: "Разрешить вход",
        fullName: "Имя и фамилия",
        phone: "Телефон",
        phoneAlt: "Доп. телефон",
        addressLine1: "Адрес (строка 1)",
        addressLine2: "Адрес (строка 2)",
        city: "Город",
        postalCode: "Индекс",
        country: "Страна"
      }
    }
  }
};

const initialForm: UserPayload = {
  email: "",
  password: "",
  role: "USER",
  active: true,
  fullName: "",
  phone: "",
  phoneAlt: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  postalCode: "",
  country: ""
};

const editableProfileFields: Array<keyof UserProfilePayload> = [
  "phone",
  "phoneAlt",
  "addressLine1",
  "addressLine2",
  "city",
  "postalCode",
  "country"
];

export default function AdminUsersCard({ language }: AdminUsersCardProps) {
  const copy = ui[language] || ui.ru;

  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const [form, setForm] = useState<UserPayload>(initialForm);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isEditing = editingUserId !== null;

  useEffect(() => {
    void loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await fetchAdminUsers();
      setUsers(data as unknown as UserDto[]);
    } catch {
      setError(copy.form.error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveUser(event: FormEvent) {
    event.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      if (isEditing) {
        const profilePayload: AccountProfilePayload = {
          fullName: form.fullName,
          avatarUrl: "",
          phone: form.phone,
          phoneAlt: form.phoneAlt,
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2,
          city: form.city,
          postalCode: form.postalCode,
          country: form.country,
        };
        await updateAdminAccountProfile(editingUserId, profilePayload);
        setSuccess(copy.form.successUpdate);
      } else {
        const createPayload = {
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          role: form.role,
          active: form.active, // Добавили active, чтобы не было ошибки валидации
        } as unknown as AdminCreateUserPayload;

        await createAdminUser(createPayload);
        setSuccess(copy.form.successCreate);
        setForm(initialForm);
      }

      await loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || copy.form.error);
    } finally {
      setSaving(false);
    }
  }

  // --- НОВАЯ ФУНКЦИЯ ПЕРЕКЛЮЧЕНИЯ АКТИВНОСТИ ---
  async function handleToggleActive(userId: number, currentStatus: boolean) {
    try {
      setError(null);
      await setAdminUserActive(userId, !currentStatus);
      setSuccess(copy.form.successToggle);
      await loadUsers(); // Перезагружаем список
      setTimeout(() => setSuccess(null), 2000);
    } catch {
      setError(copy.form.error);
    }
  }

  async function handleDeleteUser(id: number) {
    if (!confirm(copy.delete + "?")) return;
    try {
      await deleteAdminUser(id);
      await loadUsers();
      if (editingUserId === id) resetForm();
    } catch {
      setError(copy.form.error);
    }
  }

  function openEditUser(user: UserDto) {
    setEditingUserId(user.id);
    setError(null);
    setSuccess(null);
    setForm({
      email: user.email,
      password: "",
      role: user.role,
      active: user.active ?? true,
      fullName: user.fullName ?? "",
      phone: user.phone ?? "",
      phoneAlt: user.phoneAlt ?? "",
      addressLine1: user.addressLine1 ?? "",
      addressLine2: user.addressLine2 ?? "",
      city: user.city ?? "",
      postalCode: user.postalCode ?? "",
      country: user.country ?? ""
    });
  }

  function resetForm() {
    setEditingUserId(null);
    setForm(initialForm);
    setError(null);
    setSuccess(null);
  }

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return users;
    return users.filter((u) =>
        [u.email, u.fullName, u.phone].join(" ").toLowerCase().includes(normalizedQuery)
    );
  }, [users, query]);

  return (
      <div className="grid gap-6 xl:grid-cols-[400px,1fr]">
        {/* ЛЕВАЯ ЧАСТЬ: ФОРМА */}
        <motion.section
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="glass-card flex h-fit flex-col rounded-3xl p-5 sm:p-6"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="theme-heading text-xl font-semibold">
                {isEditing ? copy.form.editTitle : copy.form.createTitle}
              </h2>
              <p className="theme-text mt-1 text-sm">
                {isEditing ? copy.form.editSubtitle : copy.form.createSubtitle}
              </p>
            </div>
            {isEditing && (
                <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border border-white/15 p-2 theme-text transition hover:border-brand-300"
                >
                  <X className="h-4 w-4" />
                </button>
            )}
          </div>

          <form onSubmit={handleSaveUser} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm sm:col-span-2">
                <span className="theme-text mb-1 block">{copy.form.fields.email}</span>
                <input
                    required
                    disabled={isEditing}
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="input-surface w-full rounded-xl border px-3 py-2 outline-none transition focus:border-brand-300 disabled:opacity-50"
                />
              </label>

              {!isEditing && (
                  <label className="block text-sm sm:col-span-2">
                    <span className="theme-text mb-1 block">{copy.form.fields.password}</span>
                    <input
                        required
                        type="text"
                        value={form.password}
                        onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                        className="input-surface w-full rounded-xl border px-3 py-2 outline-none transition focus:border-brand-300"
                    />
                  </label>
              )}

              <label className="block text-sm sm:col-span-2">
                <span className="theme-text mb-1 block">{copy.form.fields.fullName}</span>
                <input
                    required
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                    className="input-surface w-full rounded-xl border px-3 py-2 outline-none transition focus:border-brand-300"
                />
              </label>

              <label className="block text-sm">
                <span className="theme-text mb-1 block">{copy.form.fields.role}</span>
                <select
                    value={form.role}
                    onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as UserRole }))}
                    className="input-surface w-full rounded-xl border px-3 py-2 outline-none transition focus:border-brand-300"
                >
                  <option value="USER">USER</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </label>

              <label className="theme-text flex items-center gap-2 text-sm pt-6">
                <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
                    className="accent-brand-500"
                />
                {copy.form.fields.active}
              </label>
            </div>

            <AnimatePresence>
              {isEditing && (
                  <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                  >
                    <hr className="my-4 border-white/10" />
                    <div className="grid gap-3 sm:grid-cols-2 pb-1">
                      {editableProfileFields.map((field) => (
                          <label
                              key={field}
                              className={`block text-sm ${field === "addressLine1" || field === "addressLine2" ? "sm:col-span-2" : ""}`}
                          >
                      <span className="theme-text mb-1 block">
                        {copy.form.fields[field as keyof typeof copy.form.fields]}
                      </span>
                            <input
                                required={["phone", "addressLine1", "city", "country"].includes(field)}
                                type="text"
                                value={form[field] || ""}
                                onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
                                className="input-surface w-full rounded-xl border px-3 py-2 outline-none transition focus:border-brand-300"
                            />
                          </label>
                      ))}
                    </div>
                  </motion.div>
              )}
            </AnimatePresence>

            {error && <p className="rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</p>}
            {success && <p className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">{success}</p>}

            <motion.button
                whileTap={{ scale: 0.98 }}
                disabled={saving}
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-brand-500 to-pulse-500 px-4 py-2.5 font-medium text-white shadow-glow transition-opacity hover:opacity-90 disabled:opacity-70 mt-2"
            >
              {saving ? copy.form.saving : copy.form.save}
            </motion.button>
          </form>
        </motion.section>

        {/* ПРАВАЯ ЧАСТЬ: СПИСОК */}
        <motion.section
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="glass-card rounded-3xl p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="theme-heading text-xl font-semibold">{copy.title}</h2>
            <div className="relative w-full max-w-xs">
              <Search className="theme-muted pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={copy.searchPlaceholder}
                  className="input-surface w-full rounded-xl border py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand-300"
              />
            </div>
          </div>

          {loading && <p className="theme-text mt-4">{copy.loading}</p>}
          {!loading && filteredUsers.length === 0 && <p className="theme-text mt-4">{copy.empty}</p>}

          {!loading && filteredUsers.length > 0 && (
              <div className="mt-4 space-y-3">
                <AnimatePresence initial={false}>
                  {filteredUsers.map((user) => (
                      <motion.div
                          key={user.id}
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 12 }}
                          transition={{ duration: 0.25 }}
                          onClick={() => openEditUser(user)}
                          className={`tile-surface cursor-pointer rounded-2xl p-4 transition border ${editingUserId === user.id ? "border-brand-400/50 bg-brand-500/10" : "border-transparent"}`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="theme-heading truncate font-medium">{user.fullName || "Безымянный"}</p>
                              {user.role === "ADMIN" && <Shield className="h-3.5 w-3.5 text-brand-400" />}
                              {!user.active && <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] uppercase text-rose-300">Неактивен</span>}
                            </div>

                            <div className="theme-muted mt-2 grid gap-1 text-xs">
                              <p className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {user.email}</p>
                              {user.phone && <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {user.phone}</p>}
                              {user.city && <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {user.city}, {user.addressLine1}</p>}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* КНОПКА АКТИВАЦИИ / ДЕАКТИВАЦИИ */}
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={(e) => { e.stopPropagation(); void handleToggleActive(user.id, !!user.active); }}
                                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition ${
                                    user.active
                                        ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20"
                                        : "border-amber-400/35 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20"
                                }`}
                                title={user.active ? copy.toggleOff : copy.toggleOn}
                            >
                              {user.active ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldX className="h-3.5 w-3.5" />}
                            </motion.button>

                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={(e) => { e.stopPropagation(); openEditUser(user); }}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-400/35 bg-brand-500/12 px-3 py-1.5 text-sm text-brand-100 transition hover:bg-brand-500/20"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </motion.button>

                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={(e) => { e.stopPropagation(); void handleDeleteUser(user.id); }}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/35 bg-rose-500/10 px-3 py-1.5 text-sm text-rose-100 transition hover:bg-rose-500/20"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                  ))}
                </AnimatePresence>
              </div>
          )}
        </motion.section>
      </div>
  );
}