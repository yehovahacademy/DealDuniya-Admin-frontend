import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Search } from "lucide-react";
import DataTable from "../components/DataTable";
import { ORDER_STATUSES, OrderStatusBadge, PaymentStatusBadge, formatEnum } from "../components/OrderBadges";
import { getOrders } from "../services/orderService";
import { formatDate, formatPrice, getErrorMessage } from "../utils/format";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    getOrders()
      .then((list) => setOrders([...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))))
      .catch((err) => setError(getErrorMessage(err, "Couldn't load orders.")))
      .finally(() => setLoading(false));
  }, []);

  // Count per status for the filter tabs.
  const counts = useMemo(() => {
    const result = { ALL: orders.length };
    for (const o of orders) result[o.status] = (result[o.status] ?? 0) + 1;
    return result;
  }, [orders]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
      if (!term) return true;
      return (
        o.orderNumber?.toLowerCase().includes(term) ||
        o.user?.name?.toLowerCase().includes(term) ||
        o.user?.email?.toLowerCase().includes(term) ||
        o.shippingName?.toLowerCase().includes(term)
      );
    });
  }, [orders, search, statusFilter]);

  const columns = [
    {
      key: "orderNumber",
      header: "Order",
      render: (o) => (
        <Link to={`/orders/${o.id}`} className="font-medium whitespace-nowrap text-brand-600 hover:text-brand-800">
          #{o.orderNumber}
        </Link>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (o) => (
        <div>
          <p className="font-medium text-gray-900">{o.user?.name || o.shippingName || "—"}</p>
          {o.user?.email && <p className="text-xs text-gray-400">{o.user.email}</p>}
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Date",
      render: (o) => <span className="whitespace-nowrap text-gray-500">{formatDate(o.createdAt)}</span>,
    },
    {
      key: "items",
      header: "Items",
      render: (o) => o._count?.items ?? o.items?.length ?? "—",
    },
    {
      key: "totalAmount",
      header: "Total",
      render: (o) => <span className="font-medium text-gray-900">{formatPrice(o.totalAmount)}</span>,
    },
    {
      key: "payment",
      header: "Payment",
      render: (o) => (
        <div className="flex items-center gap-2">
          <PaymentStatusBadge status={o.paymentStatus} />
          <span className="text-xs text-gray-400">{o.paymentMethod}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (o) => <OrderStatusBadge status={o.status} />,
    },
    {
      key: "view",
      header: <span className="sr-only">View</span>,
      className: "text-right",
      render: (o) => (
        <Link
          to={`/orders/${o.id}`}
          className="inline-flex rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-brand-600"
          aria-label={`View order ${o.orderNumber}`}
          title="View details"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      ),
    },
  ];

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
        <p className="mt-1 text-sm text-gray-500">View and manage customer orders.</p>
      </div>

      {/* Status filter tabs */}
      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {["ALL", ...ORDER_STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${
              statusFilter === s
                ? "bg-brand-600 text-white"
                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s === "ALL" ? "All" : formatEnum(s)}
            <span className={`ml-1.5 text-xs ${statusFilter === s ? "text-brand-100" : "text-gray-400"}`}>
              {counts[s] ?? 0}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 p-4">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order #, name or email"
              className="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-9 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
            />
          </div>
          {!loading && !error && (
            <p className="hidden text-sm text-gray-500 sm:block">
              {filtered.length} of {orders.length} orders
            </p>
          )}
        </div>

        {error ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-medium text-red-600">{error}</p>
            <p className="mt-1 text-xs text-gray-400">
              Check that the backend is running and GET /api/admin/orders is mounted.
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            loading={loading}
            emptyMessage={
              search || statusFilter !== "ALL" ? "No orders match your filters." : "No orders have been placed yet."
            }
          />
        )}
      </div>
    </div>
  );
}
