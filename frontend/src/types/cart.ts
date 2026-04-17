export type CartItem = {
  productId: number;
  name: string;
  sku: string;
  imageUrl: string | null;
  category: string;
  brand: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  stockState: string;
  availableStock: number;
  unknownCount: boolean;
  deliveryDays: number | null;
};

export type CartResponse = {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
};

export type CartMergeItemPayload = {
  productId: number;
  quantity: number;
};

export type CheckoutItemPayload = {
  productId: number;
  quantity: number;
};

export type CheckoutPayload = {
  fullName?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  comment?: string;
  items?: CheckoutItemPayload[];
};

export type CheckoutResponse = {
  invoiceNumber: string;
  createdAt: string;
  itemCount: number;
  totalAmount: number;
  recipientEmail: string;
};
