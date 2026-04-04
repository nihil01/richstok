import axios from "axios";
import type {Product, ProductPayload} from "@/types/product";
import type {AuthResponse, LoginPayload, RegisterPayload} from "@/types/auth";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8080/api/v1",
  withCredentials: true
});

export async function fetchCatalogProducts() {
  const { data } = await api.get<Product[]>("/catalog/products");
  return data;
}

export async function fetchAdminProducts() {
  const { data } = await api.get<Product[]>("/admin/products");
  return data;
}

export async function createProduct(payload: ProductPayload) {
  const { data } = await api.post<Product>("/admin/products", payload);
  return data;
}

export async function deleteProduct(id: number) {
  await api.delete(`/admin/products/${id}`);
}

export async function login(payload: LoginPayload) {
  const {data} = await api.post<AuthResponse>("/auth/login", payload);
  return data.user;
}

export async function register(payload: RegisterPayload) {
  const {data} = await api.post<AuthResponse>("/auth/register", payload);
  return data.user;
}

export async function logout() {
  await api.post("/auth/logout");
}

export async function fetchCurrentUser() {
  const {data} = await api.get<AuthResponse>("/auth/me");
  return data.user;
}
