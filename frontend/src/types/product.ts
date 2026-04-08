export type StockState = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export type Product = {
  id: number;
  name: string;
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
  active: boolean;
};

export type ProductBulkImportResponse = {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
};
