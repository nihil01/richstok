import {fetchAdminOrderDetails, fetchAdminOrders, fetchAdminOrdersSummary, updateAdminOrderStatus} from "@/api/client";
import type {DisplayCurrency} from "@/types/currency";
import type {AdminOrderDetails, AdminOrderListItem, AdminOrderReportPage, AdminOrderSummary, OrderStatus, OrderStatusFilter} from "@/types/order";
import type {Language} from "@/types/ui";
import {formatConvertedPrice} from "@/utils/currency";
import {AnimatePresence, motion} from "framer-motion";
import {BadgeDollarSign, CalendarDays, ChevronLeft, ChevronRight, LoaderCircle, PackageSearch, Search, UserRound, X} from "lucide-react";
import {useEffect, useMemo, useState} from "react";

type AdminOrdersReportCardProps = {
  language: Language;
  displayCurrency: DisplayCurrency;
  currencyRates: Record<string, number>;
  mode?: "report" | "management";
};

const REPORT_STATUSES: OrderStatusFilter[] = ["ALL", "PENDING", "COMPLETED", "PARTIALLY_RETURNED", "CANCELLED", "RETURNED"];
const MANAGEMENT_STATUSES: OrderStatusFilter[] = ["ALL", "PENDING", "COMPLETED", "CANCELLED"];

const reportCopy: Record<
  Language,
  {
    title: string;
    subtitle: string;
    filters: {query: string; status: string; fromDate: string; toDate: string; reset: string};
    summary: {orders: string; items: string; revenue: string; avgOrder: string};
    listTitle: string;
    empty: string;
    loading: string;
    loadError: string;
    updateError: string;
    detailsError: string;
    details: string;
    customer: string;
    contacts: string;
    delivery: string;
    note: string;
    items: string;
    sku: string;
    qty: string;
    returned: string;
    reason: string;
    actions: {approve: string; reject: string; processing: string};
    pagination: {page: string; prev: string; next: string};
    statusLabel: Record<OrderStatusFilter, string>;
    statusTone: Record<OrderStatus, string>;
  }
> = {
  az: {
    title: "Sifariş hesabatı",
    subtitle: "Bütün sifarişləri, müştəri məlumatlarını və dövr üzrə gəlirləri izləyin.",
    filters: {query: "Müştəri / email / invoice", status: "Status", fromDate: "Tarixdən", toDate: "Tarixədək", reset: "Filtrləri sıfırla"},
    summary: {orders: "sifariş", items: "məhsul vahidi", revenue: "ümumi gəlir", avgOrder: "orta çek"},
    listTitle: "Sifarişlər siyahısı",
    empty: "Bu filtrə görə sifariş tapılmadı.",
    loading: "Yüklənir...",
    loadError: "Sifariş hesabatını yükləmək alınmadı.",
    updateError: "Sifariş statusunu yeniləmək alınmadı.",
    detailsError: "Sifariş detalları yüklənmədi.",
    details: "Detallar",
    customer: "Müştəri",
    contacts: "Əlaqə",
    delivery: "Çatdırılma",
    note: "Qeyd",
    items: "Məhsullar",
    sku: "Brand code",
    qty: "Say",
    returned: "Qaytarılıb",
    reason: "Səbəb",
    actions: {approve: "Qəbul et", reject: "Ləğv et", processing: "Yenilənir..."},
    pagination: {page: "Səhifə", prev: "Əvvəlki", next: "Növbəti"},
      statusLabel: {
        ALL: "Hamısı",
        PENDING: "Gözləmədə",
        PROCESSING: "İcrada",
        SHIPPED: "Yoldadır",
        COMPLETED: "Qəbul edildi",
        PARTIALLY_RETURNED: "Qismən geri qaytarılıb",
        CANCELLED: "Ləğv edildi",
        RETURNED: "Geri qaytarıldı"
      },
    statusTone: {
      PENDING: "bg-amber-500/10 border-amber-400/30 text-amber-200",
      PROCESSING: "bg-blue-500/10 border-blue-400/30 text-blue-200",
      SHIPPED: "bg-cyan-500/10 border-cyan-400/30 text-cyan-200",
      COMPLETED: "bg-emerald-500/10 border-emerald-400/30 text-emerald-200",
      PARTIALLY_RETURNED: "bg-violet-500/10 border-violet-400/30 text-violet-200",
      CANCELLED: "bg-rose-500/10 border-rose-400/30 text-rose-200",
      RETURNED: "bg-purple-500/10 border-purple-400/30 text-purple-200"
    }
  },
  en: {
    title: "Orders reporting",
    subtitle: "Track all orders, customer data, and revenue by period.",
    filters: {query: "Customer / email / invoice", status: "Status", fromDate: "From", toDate: "To", reset: "Reset filters"},
    summary: {orders: "orders", items: "items sold", revenue: "total revenue", avgOrder: "average order"},
    listTitle: "Orders list",
    empty: "No orders found for current filters.",
    loading: "Loading...",
    loadError: "Failed to load order reports.",
    updateError: "Failed to update order status.",
    detailsError: "Failed to load order details.",
    details: "Details",
    customer: "Customer",
    contacts: "Contacts",
    delivery: "Delivery",
    note: "Note",
    items: "Items",
    sku: "Brand code",
    qty: "Qty",
    returned: "Returned",
    reason: "Reason",
    actions: {approve: "Accept", reject: "Cancel", processing: "Updating..."},
    pagination: {page: "Page", prev: "Previous", next: "Next"},
      statusLabel: {
        ALL: "All",
        PENDING: "Pending",
        PROCESSING: "Processing",
        SHIPPED: "Shipped",
        COMPLETED: "Accepted",
        PARTIALLY_RETURNED: "Partially returned",
        CANCELLED: "Cancelled",
        RETURNED: "Returned"
      },
    statusTone: {
      PENDING: "bg-amber-500/10 border-amber-400/30 text-amber-200",
      PROCESSING: "bg-blue-500/10 border-blue-400/30 text-blue-200",
      SHIPPED: "bg-cyan-500/10 border-cyan-400/30 text-cyan-200",
      COMPLETED: "bg-emerald-500/10 border-emerald-400/30 text-emerald-200",
      PARTIALLY_RETURNED: "bg-violet-500/10 border-violet-400/30 text-violet-200",
      CANCELLED: "bg-rose-500/10 border-rose-400/30 text-rose-200",
      RETURNED: "bg-purple-500/10 border-purple-400/30 text-purple-200"
    }
  },
  ru: {
    title: "Отчетность по заказам",
    subtitle: "Контроль всех заказов, данных клиента и дохода за период.",
    filters: {query: "Клиент / email / invoice", status: "Статус", fromDate: "От", toDate: "До", reset: "Сбросить фильтры"},
    summary: {orders: "заказов", items: "продано позиций", revenue: "общий доход", avgOrder: "средний чек"},
    listTitle: "Список заказов",
    empty: "По выбранным фильтрам заказов нет.",
    loading: "Загрузка...",
    loadError: "Не удалось загрузить отчет по заказам.",
    updateError: "Не удалось обновить статус заказа.",
    detailsError: "Не удалось загрузить детали заказа.",
    details: "Детали",
    customer: "Клиент",
    contacts: "Контакты",
    delivery: "Доставка",
    note: "Комментарий",
    items: "Товары",
    sku: "Brand code",
    qty: "Кол-во",
    returned: "Возвращено",
    reason: "Причина",
    actions: {approve: "Принять", reject: "Отменить", processing: "Обновление..."},
    pagination: {page: "Страница", prev: "Назад", next: "Вперед"},
      statusLabel: {
        ALL: "Все",
        PENDING: "Ожидает",
        PROCESSING: "В обработке",
        SHIPPED: "Отправлен",
        COMPLETED: "Принят",
        PARTIALLY_RETURNED: "Частичный возврат",
        CANCELLED: "Отменен",
        RETURNED: "Возврат"
      },
    statusTone: {
      PENDING: "bg-amber-500/10 border-amber-400/30 text-amber-200",
      PROCESSING: "bg-blue-500/10 border-blue-400/30 text-blue-200",
      SHIPPED: "bg-cyan-500/10 border-cyan-400/30 text-cyan-200",
      COMPLETED: "bg-emerald-500/10 border-emerald-400/30 text-emerald-200",
      PARTIALLY_RETURNED: "bg-violet-500/10 border-violet-400/30 text-violet-200",
      CANCELLED: "bg-rose-500/10 border-rose-400/30 text-rose-200",
      RETURNED: "bg-purple-500/10 border-purple-400/30 text-purple-200"
    }
  }
};

const managementHeadingCopy: Record<Language, {title: string; subtitle: string; listTitle: string}> = {
  az: {
    title: "Sifariş idarəetməsi",
    subtitle: "Sifarişləri gözləmədə, qəbul edildi və ləğv edildi statuslarında idarə edin.",
    listTitle: "İdarə olunacaq sifarişlər"
  },
  en: {
    title: "Order management",
    subtitle: "Manage orders in waiting, accepted, and cancelled statuses.",
    listTitle: "Orders to manage"
  },
  ru: {
    title: "Управление заказами",
    subtitle: "Управляй заказами в статусах ожидания, принятия и отмены.",
    listTitle: "Заказы для управления"
  }
};

export default function AdminOrdersReportCard({language, displayCurrency, currencyRates, mode = "report"}: AdminOrdersReportCardProps) {
  const copy = reportCopy[language];
  const managementCopy = managementHeadingCopy[language];
  const isManagement = mode === "management";
  const orderStatuses = isManagement ? MANAGEMENT_STATUSES : REPORT_STATUSES;
  const locale = language === "ru" ? "ru-RU" : language === "en" ? "en-GB" : "az-Latn-AZ";
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<OrderStatusFilter>("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(0);
  const [ordersPage, setOrdersPage] = useState<AdminOrderReportPage | null>(null);
  const [summary, setSummary] = useState<AdminOrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);

  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderDetails | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(queryInput.trim());
      setPage(0);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [queryInput]);

  useEffect(() => {
    void loadOrdersPage();
  }, [copy.loadError, page, query, status, fromDate, toDate]);

  useEffect(() => {
    if (isManagement) {
      setSummary(null);
      setSummaryLoading(false);
      return;
    }
    void loadSummary();
  }, [isManagement, query, status, fromDate, toDate]);

  async function loadOrdersPage() {
    try {
      setLoading(true);
      const data = await fetchAdminOrders({
        page,
        size: 10,
        query,
        status,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined
      });
      setOrdersPage(data);
      setError(null);
    } catch {
      setError(copy.loadError);
    } finally {
      setLoading(false);
    }
  }

  async function loadSummary() {
    try {
      setSummaryLoading(true);
      const data = await fetchAdminOrdersSummary({
        query,
        status,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined
      });
      setSummary(data);
    } finally {
      setSummaryLoading(false);
    }
  }

  async function openOrderDetails(order: AdminOrderListItem) {
    try {
      setDetailsLoading(true);
      setDetailsError(null);
      const details = await fetchAdminOrderDetails(order.id);
      setSelectedOrder(details);
    } catch {
      setDetailsError(copy.detailsError);
    } finally {
      setDetailsLoading(false);
    }
  }

  async function handleOrderStatusUpdate(orderId: number, nextStatus: OrderStatus) {
    try {
      setStatusUpdatingId(orderId);
      setError(null);
      const updated = await updateAdminOrderStatus(orderId, {status: nextStatus});
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updated);
      }
      await Promise.all([loadOrdersPage(), loadSummary()]);
    } catch {
      setError(copy.updateError);
    } finally {
      setStatusUpdatingId(null);
    }
  }

  function resetFilters() {
    setQueryInput("");
    setQuery("");
    setStatus("ALL");
    setFromDate("");
    setToDate("");
    setPage(0);
  }

  const pagination = useMemo(() => {
    if (!ordersPage || ordersPage.totalElements === 0) {
      return "0-0 / 0";
    }
    const start = page * ordersPage.size + 1;
    const end = Math.min((page + 1) * ordersPage.size, ordersPage.totalElements);
    return `${start}-${end} / ${ordersPage.totalElements}`;
  }, [ordersPage, page]);

  return (
    <section className="glass-card space-y-5 rounded-3xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="theme-heading text-xl font-semibold">{isManagement ? managementCopy.title : copy.title}</h2>
          <p className="theme-text mt-1 text-sm">{isManagement ? managementCopy.subtitle : copy.subtitle}</p>
        </div>
        <button type="button" onClick={resetFilters} className="rounded-lg border border-white/15 px-3 py-1.5 text-xs theme-text transition hover:border-brand-300">
          {copy.filters.reset}
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.6fr,0.9fr,1fr,1fr]">
        <label className="relative block text-sm">
          <Search className="theme-muted pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <input
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            placeholder={copy.filters.query}
            className="input-surface w-full rounded-xl border py-2 pl-9 pr-3 outline-none transition focus:border-brand-300"
          />
        </label>

        <label className="block text-sm">
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as OrderStatusFilter);
              setPage(0);
            }}
            className="input-surface w-full rounded-xl border px-3 py-2 outline-none transition focus:border-brand-300"
            aria-label={copy.filters.status}
          >
            {orderStatuses.map((item) => (
              <option key={item} value={item}>
                {copy.statusLabel[item]}
              </option>
            ))}
          </select>
        </label>

        <label className="relative block text-sm">
          <CalendarDays className="theme-muted pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <input
            type="date"
            value={fromDate}
            onChange={(event) => {
              setFromDate(event.target.value);
              setPage(0);
            }}
            className="input-surface w-full rounded-xl border py-2 pl-9 pr-3 outline-none transition focus:border-brand-300"
            aria-label={copy.filters.fromDate}
          />
        </label>

        <label className="relative block text-sm">
          <CalendarDays className="theme-muted pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <input
            type="date"
            value={toDate}
            onChange={(event) => {
              setToDate(event.target.value);
              setPage(0);
            }}
            className="input-surface w-full rounded-xl border py-2 pl-9 pr-3 outline-none transition focus:border-brand-300"
            aria-label={copy.filters.toDate}
          />
        </label>
      </div>

      {!isManagement && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            title={copy.summary.orders}
            value={summaryLoading ? "…" : String(summary?.totalOrders ?? 0)}
            icon={<PackageSearch className="h-4 w-4 text-brand-200" />}
          />
          <StatTile
            title={copy.summary.items}
            value={summaryLoading ? "…" : String(summary?.totalItems ?? 0)}
            icon={<UserRound className="h-4 w-4 text-brand-200" />}
          />
          <StatTile
            title={copy.summary.revenue}
            value={summaryLoading ? "…" : formatConvertedPrice(summary?.totalRevenue ?? 0, displayCurrency, currencyRates, language)}
            icon={<BadgeDollarSign className="h-4 w-4 text-brand-200" />}
          />
          <StatTile
            title={copy.summary.avgOrder}
            value={summaryLoading ? "…" : formatConvertedPrice(summary?.averageOrderValue ?? 0, displayCurrency, currencyRates, language)}
            icon={<BadgeDollarSign className="h-4 w-4 text-brand-200" />}
          />
        </div>
      )}

      <div>
        <h3 className="theme-heading text-lg font-semibold">{isManagement ? managementCopy.listTitle : copy.listTitle}</h3>
        {error && <p className="mt-3 rounded-xl border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</p>}
        {loading && <p className="theme-text mt-3">{copy.loading}</p>}
        {!loading && !error && (ordersPage?.content.length ?? 0) === 0 && <p className="theme-text mt-3">{copy.empty}</p>}

        {!loading && !error && ordersPage && ordersPage.content.length > 0 && (
          <div className="mt-3 space-y-2">
            {ordersPage.content.map((order) => (
              <motion.div
                key={order.id}
                initial={{opacity: 0, y: 10}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.2}}
                className="tile-surface rounded-2xl p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="theme-heading text-sm font-semibold">{order.invoiceNumber}</p>
                    <p className="theme-text text-sm">{order.customerFullName} · {order.customerEmail}</p>
                    <p className="theme-muted text-xs">{new Date(order.createdAt).toLocaleString(locale)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${copy.statusTone[order.status]}`}>
                      {copy.statusLabel[order.status]}
                    </span>
                    {isManagement && order.status === "PENDING" && (
                      <>
                        <button
                          type="button"
                          disabled={statusUpdatingId === order.id}
                          onClick={() => void handleOrderStatusUpdate(order.id, "COMPLETED")}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/35 bg-emerald-500/10 px-2.5 py-1.5 text-xs text-emerald-100 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {statusUpdatingId === order.id ? copy.actions.processing : copy.actions.approve}
                        </button>
                        <button
                          type="button"
                          disabled={statusUpdatingId === order.id}
                          onClick={() => void handleOrderStatusUpdate(order.id, "CANCELLED")}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-400/35 bg-rose-500/10 px-2.5 py-1.5 text-xs text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {statusUpdatingId === order.id ? copy.actions.processing : copy.actions.reject}
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => void openOrderDetails(order)}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/20 px-2.5 py-1.5 text-xs theme-text transition hover:border-brand-300"
                    >
                      {copy.details}
                    </button>
                  </div>
                </div>

                <div className="theme-text mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span>ID: {order.userId}</span>
                  <span>{order.city}, {order.country}</span>
                  <span>{order.itemCount} pcs</span>
                  <span className="font-medium">{formatConvertedPrice(order.totalAmount, displayCurrency, currencyRates, language)}</span>
                </div>
              </motion.div>
            ))}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
              <p className="theme-muted text-xs">{pagination}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                  disabled={ordersPage.page <= 0}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-sm theme-text transition hover:border-brand-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {copy.pagination.prev}
                </button>
                <p className="theme-text text-sm">
                  {copy.pagination.page} {ordersPage.page + 1} / {Math.max(ordersPage.totalPages, 1)}
                </p>
                <button
                  type="button"
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={ordersPage.last}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-sm theme-text transition hover:border-brand-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {copy.pagination.next}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {(selectedOrder || detailsLoading || detailsError) && (
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 px-4 py-6"
            onClick={() => {
              setSelectedOrder(null);
              setDetailsError(null);
            }}
          >
            <motion.div
              initial={{opacity: 0, y: 16, scale: 0.98}}
              animate={{opacity: 1, y: 0, scale: 1}}
              exit={{opacity: 0, y: 8, scale: 0.98}}
              transition={{duration: 0.2}}
              className="glass-card max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-3xl p-5 sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-2">
                <h4 className="theme-heading text-xl font-semibold">{copy.details}</h4>
                <button
                  type="button"
                  className="rounded-lg border border-white/15 p-2 theme-text transition hover:border-brand-300"
                  onClick={() => {
                    setSelectedOrder(null);
                    setDetailsError(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {detailsLoading && (
                <div className="theme-text flex items-center gap-2">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  {copy.loading}
                </div>
              )}
              {detailsError && !detailsLoading && <p className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{detailsError}</p>}

              {selectedOrder && !detailsLoading && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="theme-heading text-lg font-semibold">{selectedOrder.invoiceNumber}</p>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${copy.statusTone[selectedOrder.status]}`}>
                      {copy.statusLabel[selectedOrder.status]}
                    </span>
                    {isManagement && selectedOrder.status === "PENDING" && (
                      <>
                        <button
                          type="button"
                          disabled={statusUpdatingId === selectedOrder.id}
                          onClick={() => void handleOrderStatusUpdate(selectedOrder.id, "COMPLETED")}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/35 bg-emerald-500/10 px-2.5 py-1.5 text-xs text-emerald-100 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {statusUpdatingId === selectedOrder.id ? copy.actions.processing : copy.actions.approve}
                        </button>
                        <button
                          type="button"
                          disabled={statusUpdatingId === selectedOrder.id}
                          onClick={() => void handleOrderStatusUpdate(selectedOrder.id, "CANCELLED")}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-400/35 bg-rose-500/10 px-2.5 py-1.5 text-xs text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {statusUpdatingId === selectedOrder.id ? copy.actions.processing : copy.actions.reject}
                        </button>
                      </>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <InfoCard title={copy.customer} lines={[selectedOrder.customerFullName, `ID: ${selectedOrder.userId}`]} />
                    <InfoCard title={copy.contacts} lines={[selectedOrder.customerEmail, selectedOrder.customerPhone]} />
                    <InfoCard
                      title={copy.delivery}
                      lines={[
                        selectedOrder.addressLine1,
                        selectedOrder.addressLine2 || "-",
                        `${selectedOrder.city}, ${selectedOrder.country}`,
                        selectedOrder.postalCode || "-"
                      ]}
                    />
                    <InfoCard title={copy.note} lines={[selectedOrder.comment || "-"]} />
                  </div>

                  <div className="rounded-2xl border border-white/10 p-3">
                    <p className="theme-heading text-sm font-semibold">{copy.items}</p>
                    <div className="mt-2 space-y-2">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="rounded-xl border border-white/10 p-2.5">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="theme-heading text-sm font-medium">{item.productName}</p>
                              <p className="theme-muted text-xs">{copy.sku}: {item.productSku}</p>
                              {item.returnedQuantity > 0 && (
                                <p className="theme-muted text-xs">{copy.returned}: {item.returnedQuantity}</p>
                              )}
                              {item.returnReason && (
                                <p className="theme-muted whitespace-pre-line text-xs">{copy.reason}: {item.returnReason}</p>
                              )}
                            </div>
                            <p className="text-sm font-medium text-brand-100">
                              {copy.qty}: {item.quantity} · {formatConvertedPrice(item.lineTotal, displayCurrency, currencyRates, language)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 border-t border-white/10 pt-2 text-right">
                      <p className="theme-heading text-lg font-semibold">
                        {formatConvertedPrice(selectedOrder.totalAmount, displayCurrency, currencyRates, language)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function StatTile({title, value, icon}: {title: string; value: string; icon: JSX.Element}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
      {icon}
      <p className="theme-muted mt-2 text-xs uppercase tracking-[0.14em]">{title}</p>
      <p className="theme-heading mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function InfoCard({title, lines}: {title: string; lines: string[]}) {
  return (
    <div className="rounded-2xl border border-white/10 p-3">
      <p className="theme-muted text-xs uppercase tracking-[0.14em]">{title}</p>
      <div className="theme-text mt-2 space-y-1 text-sm">
        {lines.map((line, index) => (
          <p key={`${title}-${index}`}>{line}</p>
        ))}
      </div>
    </div>
  );
}
