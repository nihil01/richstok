import type {Product} from "@/types/product";

export type WishlistItem = Pick<
  Product,
  "id" | "name" | "slug" | "sku" | "category" | "oemNumber" | "description" | "imageUrl" | "price" | "stockQuantity" | "stockState" | "brand" | "bakuCount" | "bakuCountUnknown" | "ganjaCount" | "ganjaCountUnknown" | "deliveryDays" | "active" | "createdAt" | "updatedAt" | "model"
>;
