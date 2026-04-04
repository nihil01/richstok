export type Product = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stockQuantity: number;
  brand: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductPayload = {
  name: string;
  slug: string;
  description: string;
  price: number;
  stockQuantity: number;
  brand: string;
  active: boolean;
};
