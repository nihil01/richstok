import axios from "axios";
import type {PageResponse, Product, ProductBulkImportResponse, ProductCategorySummary, ProductPayload} from "@/types/product";
import type {
  AccountProfile,
  AccountProfilePayload,
  AdminCreateUserPayload,
  AdminManagedUser,
  AuthResponse,
  ChangePasswordPayload,
  LoginPayload
} from "@/types/auth";
import type {CurrencyRateApiResponse, CurrencyRateResponse} from "@/types/currency";
import type {CartMergeItemPayload, CartResponse, CheckoutPayload, CheckoutResponse} from "@/types/cart";
import type {
  AdminOrderDetails,
  AdminOrderReportPage,
  AdminOrderSummary,
  OrderStatusFilter,
  UserOrderDetails,
  UserOrderPage
} from "@/types/order";

const configuredApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
const apiBaseUrl = import.meta.env.DEV
  ? "http://localhost:8080/api/v1"
  : (configuredApiUrl && configuredApiUrl.length > 0
      ? configuredApiUrl.replace(/\/+$/, "")
      : "/api/v1");
const apiOrigin = apiBaseUrl.startsWith("http://") || apiBaseUrl.startsWith("https://")
  ? apiBaseUrl.replace(/\/api\/v1\/?$/, "")
  : "";

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true
});

export async function fetchCatalogProducts() {
  const { data } = await api.get<Product[]>("/catalog/products");
  return data;
}

export async function fetchCatalogProductsPage(params: {
  page?: number;
  size?: number;
  category?: string;
  query?: string;
}) {
  const {data} = await api.get<PageResponse<Product>>("/catalog/products/page", {
    params
  });
  return data;
}

export async function fetchCatalogCategories() {
  const {data} = await api.get<ProductCategorySummary[]>("/catalog/products/categories");
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
  const { data } = await api.get<string[]>("/brands_images");

  return data
      .filter((image): image is string => typeof image === "string" && image.trim().length > 0)
      .map((image) => {
        if (/^https?:\/\//i.test(image) || image.startsWith("data:image/")) {
          return image;
        }
        const normalizedPath = image.startsWith("/") ? image : `/${image}`;
        return apiOrigin ? `${apiOrigin}${normalizedPath}` : normalizedPath;
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

export async function fetchAdminUsers() {
  const {data} = await api.get<AdminManagedUser[]>("/admin/users");
  return data;
}

export async function createAdminUser(payload: AdminCreateUserPayload) {
  const {data} = await api.post<AdminManagedUser>("/admin/users", payload);
  return data;
}

export async function setAdminUserActive(id: number, active: boolean) {
  const {data} = await api.patch<AdminManagedUser>(`/admin/users/${id}/active`, {active});
  return data;
}

export async function deleteAdminUser(id: number) {
  await api.delete(`/admin/users/${id}`);
}

export async function login(payload: LoginPayload) {
  const {data} = await api.post<AuthResponse>("/auth/login", payload);
  return data.user;
}

export async function logout() {
  await api.post("/auth/logout");
}

export async function changePassword(payload: ChangePasswordPayload) {
  await api.post("/auth/change-password", payload);
}

export async function fetchAccountProfile() {
  const {data} = await api.get<AccountProfile>("/account/profile");
  return data;
}

export async function updateAccountProfile(payload: AccountProfilePayload) {
  const {data} = await api.put<AccountProfile>("/account/profile", payload);
  return data;
}

export async function fetchCurrentUser() {
  const {data} = await api.get<AuthResponse>("/auth/me");
  return data.user;
}

export async function fetchServerCart() {
  const {data} = await api.get<CartResponse>("/cart");
  return data;
}

export async function upsertServerCartItem(productId: number, quantity: number) {
  const {data} = await api.put<CartResponse>(`/cart/items/${productId}`, {quantity});
  return data;
}

export async function removeServerCartItem(productId: number) {
  const {data} = await api.delete<CartResponse>(`/cart/items/${productId}`);
  return data;
}

export async function clearServerCart() {
  await api.delete("/cart");
}

export async function mergeServerCart(items: CartMergeItemPayload[]) {
  const {data} = await api.post<CartResponse>("/cart/merge", items);
  return data;
}

export async function checkoutOrder(payload: CheckoutPayload) {
  const {data} = await api.post<CheckoutResponse>("/orders/checkout", payload);
  return data;
}

export async function fetchMyOrders(params: {page?: number; size?: number} = {}) {
  const {data} = await api.get<UserOrderPage>("/orders/my", {
    params: {
      page: params.page ?? 0,
      size: params.size ?? 10
    }
  });
  return data;
}

export async function fetchMyOrderDetails(id: number) {
  const {data} = await api.get<UserOrderDetails>(`/orders/my/${id}`);
  return data;
}

type AdminOrderReportParams = {
  page?: number;
  size?: number;
  query?: string;
  status?: OrderStatusFilter;
  fromDate?: string;
  toDate?: string;
};

function buildOrderReportQuery(params: AdminOrderReportParams) {
  return {
    page: params.page ?? 0,
    size: params.size ?? 10,
    query: params.query && params.query.trim().length > 0 ? params.query.trim() : undefined,
    status: params.status && params.status !== "ALL" ? params.status : undefined,
    fromDate: params.fromDate || undefined,
    toDate: params.toDate || undefined
  };
}

export async function fetchAdminOrders(params: AdminOrderReportParams = {}) {
  const {data} = await api.get<AdminOrderReportPage>("/admin/orders", {
    params: buildOrderReportQuery(params)
  });
  return data;
}

export async function fetchAdminOrdersSummary(params: AdminOrderReportParams = {}) {
  const {data} = await api.get<AdminOrderSummary>("/admin/orders/summary", {
    params: buildOrderReportQuery(params)
  });
  return data;
}

export async function fetchAdminOrderDetails(id: number) {
  const {data} = await api.get<AdminOrderDetails>(`/admin/orders/${id}`);
  return data;
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
