export type StockState = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export type Product = {
  id: number;
  name: string;
  promoTag?: string;
  promoTitle?: string;
  promoSubtitle?: string;
  promoSlides?: Array<{title: string; description: string; action: string}>;
  slug: string;
  sku: string;
  category: string;
  oemNumber: string | null;
  description: string | null;
  imageUrl: string | null;
  price: number;
  stockQuantity: number;
  stockState: StockState;
  model?: string | null;
  brand: string | null;
  unknownCount: boolean;
  deliveryDays: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductPayload = {
  name: string;
  slug: string;
  sku: string;
  category: string;
  oemNumber: string;
  description: string;
  imageUrl: string;
  price: number;
  stockQuantity: number;
  stockState: StockState;
  brand: string;
  model: string;
  unknownCount?: boolean;
  deliveryDays: number;
  active: boolean;
};

export type ProductBulkImportResponse = {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
};

export type ProductCategorySummary = {
  name: string;
  count: number;
};

export type ProductCatalogStats = {
  totalProducts: number;
  totalBrands: number;
  totalCategories: number;
  totalStockQuantity: number;
  unknownStockProducts: number;
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};
