export type UserRole = "USER" | "ADMIN";

export type AuthUser = {
  id: number;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  role: UserRole;
};

export type AuthResponse = {
  user: AuthUser;
};

export type AdminManagedUser = {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export type AccountProfile = {
  id: number;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
  phone: string | null;
  phoneAlt: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
};

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

export type AdminCreateUserPayload = {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  active: boolean;
};
