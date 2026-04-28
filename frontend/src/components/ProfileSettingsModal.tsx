import {changePassword, fetchAccountProfile, updateAccountProfile} from "@/api/client";
import type {AccountProfilePayload} from "@/types/auth";
import type {Language} from "@/types/ui";
import {AnimatePresence, motion} from "framer-motion";
import {Camera, X} from "lucide-react";
import type {ChangeEvent, FormEvent} from "react";
import {useEffect, useState} from "react";

type ProfileSettingsModalProps = {
  open: boolean;
  language: Language;
  onClose: () => void;
  onProfileUpdated: (profile: {fullName: string; avatarUrl: string | null}) => void;
};

const emptyProfile: AccountProfilePayload = {
  fullName: "",
  avatarUrl: "",
  phone: "",
  phoneAlt: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  postalCode: "",
  country: ""
};

const copy: Record<
  Language,
  {
    title: string;
    profile: {
      title: string;
      subtitle: string;
      avatarHint: string;
      avatarPick: string;
      avatarUploading: string;
      save: string;
      saving: string;
      success: string;
      loadError: string;
      saveError: string;
      avatarUploadError: string;
      fields: {
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
    password: {
      title: string;
      subtitle: string;
      currentPassword: string;
      newPassword: string;
      repeatPassword: string;
      submit: string;
      submitting: string;
      success: string;
      mismatch: string;
      error: string;
    };
  }
> = {
  az: {
    title: "Profil və təhlükəsizlik",
    profile: {
      title: "Profil məlumatları",
      subtitle: "Buradakı məlumatlar checkout zamanı istifadə olunur.",
      avatarHint: "Profil şəkli yüklə (max 2MB).",
      avatarPick: "Avatar seç",
      avatarUploading: "Yüklənir...",
      save: "Məlumatları yenilə",
      saving: "Yenilənir...",
      success: "Məlumatlar yeniləndi.",
      loadError: "Profil məlumatlarını yükləmək mümkün olmadı.",
      saveError: "Məlumatlar yenilənmədi.",
      avatarUploadError: "Avatar yüklənmədi.",
      fields: {
        fullName: "Ad Soyad",
        phone: "Telefon",
        phoneAlt: "Əlavə telefon",
        addressLine1: "Ünvan",
        addressLine2: "Əlavə ünvan",
        city: "Şəhər",
        postalCode: "Poçt kodu",
        country: "Ölkə"
      }
    },
    password: {
      title: "Parolun dəyişdirilməsi",
      subtitle: "Hesab təhlükəsizliyi üçün parolu yenilə.",
      currentPassword: "Cari parol",
      newPassword: "Yeni parol",
      repeatPassword: "Yeni parolu təkrar et",
      submit: "Parolu yenilə",
      submitting: "Yenilənir...",
      success: "Parol uğurla dəyişdirildi.",
      mismatch: "Yeni parollar eyni deyil.",
      error: "Parolu dəyişmək alınmadı. Cari parolu yoxla."
    }
  },
  en: {
    title: "Profile & security",
    profile: {
      title: "Profile details",
      subtitle: "This information is used during checkout.",
      avatarHint: "Upload profile image (max 2MB).",
      avatarPick: "Choose avatar",
      avatarUploading: "Uploading...",
      save: "Update details",
      saving: "Updating...",
      success: "Profile details updated.",
      loadError: "Failed to load profile details.",
      saveError: "Failed to update profile details.",
      avatarUploadError: "Failed to upload avatar.",
      fields: {
        fullName: "Full name",
        phone: "Phone",
        phoneAlt: "Alternative phone",
        addressLine1: "Address",
        addressLine2: "Address line 2",
        city: "City",
        postalCode: "Postal code",
        country: "Country"
      }
    },
    password: {
      title: "Change password",
      subtitle: "Update your password to keep your account secure.",
      currentPassword: "Current password",
      newPassword: "New password",
      repeatPassword: "Repeat new password",
      submit: "Update password",
      submitting: "Updating...",
      success: "Password changed successfully.",
      mismatch: "New passwords do not match.",
      error: "Failed to change password. Check your current password."
    }
  },
  ru: {
    title: "Профиль и безопасность",
    profile: {
      title: "Данные профиля",
      subtitle: "Эти данные используются при оформлении заказа.",
      avatarHint: "Загрузи аватар (до 2MB).",
      avatarPick: "Выбрать аватар",
      avatarUploading: "Загрузка...",
      save: "Обновить данные",
      saving: "Обновление...",
      success: "Данные профиля обновлены.",
      loadError: "Не удалось загрузить данные профиля.",
      saveError: "Не удалось обновить данные профиля.",
      avatarUploadError: "Не удалось загрузить аватар.",
      fields: {
        fullName: "Имя и фамилия",
        phone: "Телефон",
        phoneAlt: "Доп. телефон",
        addressLine1: "Адрес",
        addressLine2: "Доп. адрес",
        city: "Город",
        postalCode: "Почтовый индекс",
        country: "Страна"
      }
    },
    password: {
      title: "Смена пароля",
      subtitle: "Обнови пароль для безопасности аккаунта.",
      currentPassword: "Текущий пароль",
      newPassword: "Новый пароль",
      repeatPassword: "Повторите новый пароль",
      submit: "Обновить пароль",
      submitting: "Обновление...",
      success: "Пароль успешно изменён.",
      mismatch: "Новые пароли не совпадают.",
      error: "Не удалось сменить пароль. Проверь текущий пароль."
    }
  }
};

const editableProfileFields: Array<Exclude<keyof AccountProfilePayload, "avatarUrl">> = [
  "fullName",
  "phone",
  "phoneAlt",
  "addressLine1",
  "addressLine2",
  "city",
  "postalCode",
  "country"
];

export default function ProfileSettingsModal({open, language, onClose, onProfileUpdated}: ProfileSettingsModalProps) {
  const ui = copy[language];
  const [profile, setProfile] = useState<AccountProfilePayload>(emptyProfile);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileAvatarUploading, setProfileAvatarUploading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    void loadProfile();
  }, [open, language]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  async function loadProfile() {
    try {
      setProfileLoading(true);
      const data = await fetchAccountProfile();
      setProfile({
        fullName: data.fullName ?? "",
        avatarUrl: data.avatarUrl ?? "",
        phone: data.phone ?? "",
        phoneAlt: data.phoneAlt ?? "",
        addressLine1: data.addressLine1 ?? "",
        addressLine2: data.addressLine2 ?? "",
        city: data.city ?? "",
        postalCode: data.postalCode ?? "",
        country: data.country ?? ""
      });
      setProfileError(null);
    } catch {
      setProfileError(ui.profile.loadError);
    } finally {
      setProfileLoading(false);
    }
  }

  async function handleSaveProfile(event: FormEvent) {
    event.preventDefault();
    try {
      setProfileSaving(true);
      setProfileError(null);
      setProfileSuccess(null);
      const updated = await updateAccountProfile(profile);
      const normalizedProfile = {
        fullName: updated.fullName ?? "",
        avatarUrl: updated.avatarUrl ?? "",
        phone: updated.phone ?? "",
        phoneAlt: updated.phoneAlt ?? "",
        addressLine1: updated.addressLine1 ?? "",
        addressLine2: updated.addressLine2 ?? "",
        city: updated.city ?? "",
        postalCode: updated.postalCode ?? "",
        country: updated.country ?? ""
      };
      setProfile(normalizedProfile);
      onProfileUpdated({
        fullName: normalizedProfile.fullName,
        avatarUrl: normalizedProfile.avatarUrl || null
      });
      setProfileSuccess(ui.profile.success);
    } catch (error) {
      setProfileError(getApiErrorMessage(error) ?? ui.profile.saveError);
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
      setProfileError(ui.profile.avatarUploadError);
      return;
    }

    try {
      setProfileAvatarUploading(true);
      setProfileError(null);
      setProfileSuccess(null);
      const avatarUrl = await fileToDataUrl(file);
      const updated = await updateAccountProfile({...profile, avatarUrl});
      const normalizedProfile = {
        fullName: updated.fullName ?? "",
        avatarUrl: updated.avatarUrl ?? "",
        phone: updated.phone ?? "",
        phoneAlt: updated.phoneAlt ?? "",
        addressLine1: updated.addressLine1 ?? "",
        addressLine2: updated.addressLine2 ?? "",
        city: updated.city ?? "",
        postalCode: updated.postalCode ?? "",
        country: updated.country ?? ""
      };
      setProfile(normalizedProfile);
      onProfileUpdated({
        fullName: normalizedProfile.fullName,
        avatarUrl: normalizedProfile.avatarUrl || null
      });
      setProfileSuccess(ui.profile.success);
    } catch (error) {
      setProfileError(getApiErrorMessage(error) ?? ui.profile.avatarUploadError);
    } finally {
      setProfileAvatarUploading(false);
    }
  }

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    if (newPassword !== repeatPassword) {
      setPasswordError(ui.password.mismatch);
      return;
    }

    try {
      setPasswordLoading(true);
      await changePassword({currentPassword, newPassword});
      setCurrentPassword("");
      setNewPassword("");
      setRepeatPassword("");
      setPasswordSuccess(ui.password.success);
    } catch (error) {
      setPasswordError(getApiErrorMessage(error) ?? ui.password.error);
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          exit={{opacity: 0}}
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.section
            initial={{opacity: 0, y: 16, scale: 0.98}}
            animate={{opacity: 1, y: 0, scale: 1}}
            exit={{opacity: 0, y: 10, scale: 0.98}}
            transition={{duration: 0.2}}
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-zinc-300/70 bg-white p-5 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="mb-4 flex items-center justify-between gap-3">
              <h2 className="theme-heading text-xl font-semibold">{ui.title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-300/80 text-zinc-700 transition hover:border-brand-400 hover:text-brand-600 dark:border-zinc-700 dark:text-zinc-100"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <section className="mt-4 rounded-xl border border-zinc-300/70 bg-zinc-100/80 p-4 dark:border-white/12 dark:bg-black/20">
              <h3 className="theme-heading text-base font-semibold">{ui.password.title}</h3>
              <p className="theme-text mt-1 text-sm">{ui.password.subtitle}</p>

              <form onSubmit={handleChangePassword} className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm sm:col-span-2">
                  <span className="theme-text mb-1 block">{ui.password.currentPassword}</span>
                  <input
                    required
                    minLength={8}
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    className="input-surface w-full rounded-xl border px-3 py-2 outline-none transition focus:border-brand-300"
                  />
                </label>

                <label className="block text-sm">
                  <span className="theme-text mb-1 block">{ui.password.newPassword}</span>
                  <input
                    required
                    minLength={8}
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="input-surface w-full rounded-xl border px-3 py-2 outline-none transition focus:border-brand-300"
                  />
                </label>

                <label className="block text-sm">
                  <span className="theme-text mb-1 block">{ui.password.repeatPassword}</span>
                  <input
                    required
                    minLength={8}
                    type="password"
                    value={repeatPassword}
                    onChange={(event) => setRepeatPassword(event.target.value)}
                    className="input-surface w-full rounded-xl border px-3 py-2 outline-none transition focus:border-brand-300"
                  />
                </label>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="rounded-xl bg-gradient-to-r from-brand-500 to-pulse-500 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-70 sm:col-span-2 sm:justify-self-end"
                >
                  {passwordLoading ? ui.password.submitting : ui.password.submit}
                </button>
              </form>

              {passwordError && <p className="mt-3 rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-100">{passwordError}</p>}
              {passwordSuccess && <p className="mt-3 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-100">{passwordSuccess}</p>}
            </section>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function getApiErrorMessage(error: unknown): string | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }
  const response = (error as {response?: {data?: {message?: unknown}}}).response;
  const message = response?.data?.message;
  if (typeof message !== "string") {
    return null;
  }
  const normalized = message.trim();
  return normalized.length > 0 ? normalized : null;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read avatar file."));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string" && result.length > 0) {
        resolve(result);
        return;
      }
      reject(new Error("Invalid avatar file."));
    };
    reader.readAsDataURL(file);
  });
}
