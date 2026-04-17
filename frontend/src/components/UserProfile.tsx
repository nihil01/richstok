import { LogOut, User as UserIcon } from "lucide-react";
import {AuthUser} from "@/types/auth";

export function UserProfile({
                                authUser,
                                handleLogout,
                                ui,
                            }: {
    authUser: AuthUser;
    handleLogout: () => Promise<void> | void;
    ui: { signOut: string };
}) {
    return (
        <div className="flex h-9 items-center gap-2 rounded-xl border border-brand-500/20 bg-brand-500/8 px-2.5">

            {/* Avatar */}
            <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-brand-400/35 bg-brand-500/12">
                {authUser.avatarUrl ? (
                    <img
                        src={authUser.avatarUrl}
                        alt={authUser.fullName}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <UserIcon className="h-3.5 w-3.5 text-brand-300" />
                )}
            </div>

            {/* Info (only if exists) */}
            {(authUser.fullName || authUser.email) && (
                <div className="hidden sm:block leading-none">
                    {authUser.fullName && (
                        <p className="theme-heading max-w-[110px] truncate text-[11px] font-semibold">
                            {authUser.fullName}
                        </p>
                    )}
                    {authUser.email && (
                        <p className="theme-muted max-w-[110px] truncate text-[10px]">
                            {authUser.email}
                        </p>
                    )}
                </div>
            )}

            {/* Logout */}
            <button
                type="button"
                onClick={() => void handleLogout()}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-brand-500/25 bg-brand-500/10 text-brand-100 transition hover:border-red-400/45 hover:bg-red-500/15 hover:text-red-300"
                aria-label={ui.signOut}
            >
                <LogOut className="h-3 w-3" />
            </button>
        </div>
    );
}
