import axios from "axios";
import type {Product, ProductBulkImportResponse, ProductPayload} from "@/types/product";
import type {AuthResponse, LoginPayload, RegisterPayload} from "@/types/auth";
import type {CurrencyRateApiResponse, CurrencyRateResponse} from "@/types/currency";

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api/v1";
const apiOrigin = apiBaseUrl.replace(/\/api\/v1\/?$/, "");

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true
});

export async function fetchCatalogProducts() {
  const { data } = await api.get<Product[]>("/catalog/products");
  return data;
}

export async function searchCatalogProducts(query: string) {
  const {data} = await api.get<Product[]>("/catalog/products/search", {
    params: {query}
  });
  return data;
}

export async function fetchCatalogProductById(id: number | string) {
  const {data} = await api.get<Product>(`/catalog/products/id/${id}`);
  return data;
}

export async function fetchAdminProducts() {
  const { data } = await api.get<Product[]>("/admin/products");
  return data;
}

export async function fetchBrandImages() {
  const {data} = await api.get<string[]>("/brands_images");
  return data
    .filter((image): image is string => typeof image === "string" && image.trim().length > 0)
    .map((image) => {
      if (/^https?:\/\//i.test(image) || image.startsWith("data:image/")) {
        return image;
      }
      return `${apiOrigin}${image.startsWith("/") ? "" : "/"}${image}`;
    });
}

export async function fetchCurrencyRate() {
  const {data} = await api.get<CurrencyRateApiResponse>("/currency_rate");
  return normalizeCurrencyRate(data);
}

export async function createProduct(payload: ProductPayload) {
  const { data } = await api.post<Product>("/admin/products", payload);
  return data;
}

export async function updateProduct(id: number, payload: ProductPayload) {
  const {data} = await api.put<Product>(`/admin/products/${id}`, payload);
  return data;
}

export async function deleteProduct(id: number) {
  await api.delete(`/admin/products/${id}`);
}

export async function importProductsExcel(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const {data} = await api.post<ProductBulkImportResponse>("/admin/products/import-excel", formData, {
    headers: {"Content-Type": "multipart/form-data"}
  });
  return data;
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

function normalizeCurrencyRate(data: CurrencyRateApiResponse): CurrencyRateResponse {
  const conversionRates = sanitizeRates(data.conversionRates ?? data.conversion_rates);

  return {
    result: data.result ?? "unknown",
    baseCode: data.baseCode ?? data.base_code ?? "AZN",
    timeLastUpdateUnix: data.timeLastUpdateUnix ?? data.time_last_update_unix ?? 0,
    timeLastUpdateUtc: data.timeLastUpdateUtc ?? data.time_last_update_utc ?? "",
    timeNextUpdateUnix: data.timeNextUpdateUnix ?? data.time_next_update_unix ?? 0,
    timeNextUpdateUtc: data.timeNextUpdateUtc ?? data.time_next_update_utc ?? "",
    conversionRates
  };
}

function sanitizeRates(rawRates: unknown): Record<string, number> {
  if (!rawRates || typeof rawRates !== "object") {
    return {};
  }

  return Object.entries(rawRates as Record<string, unknown>).reduce<Record<string, number>>((accumulator, [code, value]) => {
    const parsedValue = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(parsedValue) && parsedValue > 0) {
      accumulator[code] = parsedValue;
    }
    return accumulator;
  }, {});
}
