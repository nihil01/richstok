import type {PageResponse} from "@/types/product";

export type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "COMPLETED" | "PARTIALLY_RETURNED" | "CANCELLED" | "RETURNED";
export type OrderStatusFilter = OrderStatus | "ALL";
export type AdminOrderStatusUpdatePayload = {
  status: OrderStatus;
  note?: string;
};

export type AdminOrderListItem = {
  id: number;
  invoiceNumber: string;
  userId: number;
  userInfoId: number | null;
  customerFullName: string;
  customerEmail: string;
  customerPhone: string;
  city: string;
  country: string;
  totalAmount: number;
  itemCount: number;
  currencyCode: string;
  status: OrderStatus;
  createdAt: string;
};

export type AdminOrderItem = {
  id: number;
  productId: number | null;
  productName: string;
  productSku: string;
  productBrand: string | null;
  productCategory: string | null;
  productOem: string | null;
  productModel: string | null;
  unitPrice: number;
  quantity: number;
  returnedQuantity: number;
  lineTotal: number;
  imageUrl: string | null;
  stockState: string | null;
  returnReason: string | null;
};

export type AdminOrderDetails = {
  id: number;
  invoiceNumber: string;
  userId: number;
  userInfoId: number | null;
  customerFullName: string;
  customerEmail: string;
  customerPhone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  postalCode: string | null;
  country: string;
  comment: string | null;
  totalAmount: number;
  itemCount: number;
  currencyCode: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  items: AdminOrderItem[];
};

export type AdminOrderSummary = {
  totalOrders: number;
  totalItems: number;
  totalRevenue: number;
  averageOrderValue: number;
  currencyCode: string;
  statusCounts: Record<string, number>;
};

export type AdminOrderReportPage = PageResponse<AdminOrderListItem>;

export type UserOrderListItem = {
  id: number;
  invoiceNumber: string;
  totalAmount: number;
  itemCount: number;
  currencyCode: string;
  status: OrderStatus;
  createdAt: string;
};

export type UserOrderItem = {
  id: number;
  productId: number | null;
  productName: string;
  productSku: string;
  quantity: number;
  returnedQuantity: number;
  unitPrice: number;
  lineTotal: number;
  imageUrl: string | null;
  returnReason: string | null;
};

export type UserOrderDetails = {
  id: number;
  invoiceNumber: string;
  totalAmount: number;
  itemCount: number;
  currencyCode: string;
  status: OrderStatus;
  createdAt: string;
  customerFullName: string;
  customerPhone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  postalCode: string | null;
  country: string;
  comment: string | null;
  items: UserOrderItem[];
};

export type UserOrderPage = PageResponse<UserOrderListItem>;
