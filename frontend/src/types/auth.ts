export type UserRole = "USER" | "ADMIN";

export type AuthUser = {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
};

export type AuthResponse = {
  user: AuthUser;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
};
