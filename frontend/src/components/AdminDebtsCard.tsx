import {fetchAdminUsers, resetAdminUserDebtLimit, setAdminUserDebtLimit} from "@/api/client";
import type {AdminManagedUser} from "@/types/auth";
import type {Language} from "@/types/ui";
import {motion} from "framer-motion";
import {BadgeDollarSign, RotateCcw, Save} from "lucide-react";
import type {ChangeEvent} from "react";
import {useEffect, useMemo, useState} from "react";

type AdminDebtsCardProps = {
  language: Language;
};

const copy: Record<
  Language,
  {
    title: string;
    subtitle: string;
    loading: string;
    empty: string;
    role: string;
    currentDebt: string;
    debtLimit: string;
    available: string;
    setLimit: string;
    saving: string;
    save: string;
    resetLimit: string;
    resetting: string;
    success: string;
    errors: {
      load: string;
      save: string;
      invalidLimit: string;
    };
  }
> = {
  az: {
    title: "Borc limitləri",
    subtitle: "Hər istifadəçi üçün borc limiti və cari borc məbləğini idarə et.",
    loading: "Yüklənir...",
    empty: "İstifadəçi yoxdur.",
    role: "Rol",
    currentDebt: "Cari borc",
    debtLimit: "Limit",
    available: "Qalıq limit",
    setLimit: "Limit təyin et",
    saving: "Yadda saxlanılır...",
    save: "Yadda saxla",
    resetLimit: "Limiti ve borcu sıfırla",
    resetting: "Sıfırlanır...",
    success: "Limit yeniləndi.",
    errors: {
      load: "İstifadəçi borclarını yükləmək mümkün olmadı.",
      save: "Borc limiti yenilənmədi.",
      invalidLimit: "Limit üçün 0 və ya daha böyük rəqəm daxil edin."
    }
  },
  en: {
    title: "Debt limits",
    subtitle: "Manage debt limit and current debt amount for each user.",
    loading: "Loading...",
    empty: "No users found.",
    role: "Role",
    currentDebt: "Current debt",
    debtLimit: "Limit",
    available: "Available limit",
    setLimit: "Set limit",
    saving: "Saving...",
    save: "Save",
    resetLimit: "Reset limit and debt",
    resetting: "Resetting...",
    success: "Debt limit updated.",
    errors: {
      load: "Failed to load user debts.",
      save: "Failed to update debt limit.",
      invalidLimit: "Enter a valid number greater than or equal to 0."
    }
  },
  ru: {
    title: "Лимиты долга",
    subtitle: "Управляй лимитом и текущим долгом каждого пользователя.",
    loading: "Загрузка...",
    empty: "Пользователей пока нет.",
    role: "Роль",
    currentDebt: "Текущий долг",
    debtLimit: "Лимит",
    available: "Доступный лимит",
    setLimit: "Установить лимит",
    saving: "Сохранение...",
    save: "Сохранить",
    resetLimit: "Сбросить лимит и долг",
    resetting: "Сброс...",
    success: "Лимит долга обновлен.",
    errors: {
      load: "Не удалось загрузить данные по долгам.",
      save: "Не удалось обновить лимит долга.",
      invalidLimit: "Введите корректное число (0 или больше)."
    }
  }
};

export default function AdminDebtsCard({language}: AdminDebtsCardProps) {
  const ui = copy[language];
  const [users, setUsers] = useState<AdminManagedUser[]>([]);
  const [debtLimitDrafts, setDebtLimitDrafts] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<number | null>(null);
  const [resettingUserId, setResettingUserId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const data = await fetchAdminUsers();
      setUsers(data.filter((user) => user.role !== "ADMIN"));
      setDebtLimitDrafts(
        Object.fromEntries(
          data
            .filter((user) => user.role !== "ADMIN")
            .map((user) => [user.id, toEditableMoney(user.debtLimit)])
        )
      );
      setError(null);
    } catch {
      setError(ui.errors.load);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveDebtLimit(user: AdminManagedUser) {
    const draft = debtLimitDrafts[user.id] ?? "";
    const parsed = Number(draft.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError(ui.errors.invalidLimit);
      setSuccess(null);
      return;
    }

    try {
      setSavingUserId(user.id);
      setError(null);
      const updatedUser = await setAdminUserDebtLimit(user.id, parsed);
      setUsers((previousUsers) => previousUsers.map((item) => (item.id === user.id ? updatedUser : item)));
      setDebtLimitDrafts((prev) => ({...prev, [user.id]: toEditableMoney(updatedUser.debtLimit)}));
      setSuccess(ui.success);
    } catch {
      setError(ui.errors.save);
      setSuccess(null);
    } finally {
      setSavingUserId(null);
    }
  }

  async function handleResetDebtLimit(user: AdminManagedUser) {
    try {
      setResettingUserId(user.id);
      setError(null);
      const updatedUser = await resetAdminUserDebtLimit(user.id);
      setUsers((previousUsers) => previousUsers.map((item) => (item.id === user.id ? updatedUser : item)));
      setDebtLimitDrafts((prev) => ({...prev, [user.id]: toEditableMoney(updatedUser.debtLimit)}));
      setSuccess(ui.success);
    } catch {
      setError(ui.errors.save);
      setSuccess(null);
    } finally {
      setResettingUserId(null);
    }
  }

  function handleDebtLimitDraftChange(userId: number, event: ChangeEvent<HTMLInputElement>) {
    setDebtLimitDrafts((previousDrafts) => ({
      ...previousDrafts,
      [userId]: event.target.value
    }));
  }

  const rows = useMemo(() => users, [users]);

  return (
    <motion.article initial={{opacity: 0, y: 12}} animate={{opacity: 1, y: 0}} transition={{duration: 0.35}} className="glass-card rounded-3xl p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="theme-heading text-xl font-semibold">{ui.title}</h2>
          <p className="theme-text mt-1 text-sm">{ui.subtitle}</p>
        </div>
        <BadgeDollarSign className="h-6 w-6 text-brand-300" />
      </div>

      {error && <p className="mb-4 rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</p>}
      {success && <p className="mb-4 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">{success}</p>}

      {loading && <p className="theme-text text-sm">{ui.loading}</p>}
      {!loading && rows.length === 0 && <p className="theme-text text-sm">{ui.empty}</p>}

      {!loading && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="px-2 py-2 theme-muted font-medium">{ui.setLimit}</th>
                <th className="px-2 py-2 theme-muted font-medium">{ui.currentDebt}</th>
                <th className="px-2 py-2 theme-muted font-medium">{ui.debtLimit}</th>
                <th className="px-2 py-2 theme-muted font-medium">{ui.available}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((user) => (
                <tr key={user.id} className="border-b border-white/5 align-middle">
                  <td className="px-2 py-3">
                    <p className="theme-heading text-sm font-medium">{user.fullName}</p>
                    <p className="theme-muted text-xs">{user.email}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <input
                        value={debtLimitDrafts[user.id] ?? ""}
                        onChange={(event) => handleDebtLimitDraftChange(user.id, event)}
                        type="number"
                        min={0}
                        step="0.01"
                        className="input-surface w-28 rounded-lg border px-2.5 py-1.5 text-xs outline-none transition focus:border-brand-300"
                      />
                      <button
                        type="button"
                        onClick={() => void handleSaveDebtLimit(user)}
                        disabled={savingUserId === user.id || resettingUserId === user.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-brand-400/35 bg-brand-500/12 px-2.5 py-1.5 text-xs text-brand-100 transition hover:bg-brand-500/20 disabled:opacity-60"
                      >
                        <Save className="h-3.5 w-3.5" />
                        {savingUserId === user.id ? ui.saving : ui.save}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleResetDebtLimit(user)}
                        disabled={savingUserId === user.id || resettingUserId === user.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-400/35 bg-amber-500/12 px-2.5 py-1.5 text-xs text-amber-100 transition hover:bg-amber-500/20 disabled:opacity-60"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        {resettingUserId === user.id ? ui.resetting : ui.resetLimit}
                      </button>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-rose-200">{formatMoney(user.currentDebt)}</td>
                  <td className="px-2 py-3 text-brand-100">{formatMoney(user.debtLimit)}</td>
                  <td className="px-2 py-3 text-emerald-200">{formatMoney(user.availableDebt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.article>
  );
}

function formatMoney(value: number) {
  const normalizedValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  return `${normalizedValue.toFixed(2)} AZN`;
}

function toEditableMoney(value: number) {
  const normalizedValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  return normalizedValue.toFixed(2);
}
