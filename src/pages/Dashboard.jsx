import { useEffect, useMemo, useState } from "react";
import { FolderTree, IndianRupee, Package, ShoppingCart, Users } from "lucide-react";
import StatCard from "../components/StatCard";
import ComboChart from "../components/ComboChart";
import { useAuth } from "../hooks/useAuth";
import { getDashboardStats } from "../services/dashboardService";
import { getOrders } from "../services/orderService";
import { RANGES, buildSeries, topProducts } from "../utils/analytics";
import { formatNumber, formatPrice, getErrorMessage } from "../utils/format";

// Compact rupees for the y-axis: ₹1.2K, ₹3.4L, ₹1.1Cr
const compactRupees = (v) =>
  "₹" + new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(v);

function RangePicker({ value, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1 shadow-sm">
      {Object.entries(RANGES).map(([key, { label }]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            value === key ? "bg-brand-600 text-white" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function TopProducts({ rows, loading }) {
  const max = rows[0]?.revenue || 1;
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">Top products</h2>
      <p className="mt-0.5 text-xs text-gray-400">By sales in this period</p>
      <ul className="mt-4 space-y-4">
        {loading &&
          Array.from({ length: 4 }).map((_, i) => <li key={i} className="h-8 animate-pulse rounded bg-gray-100" />)}
        {!loading && rows.length === 0 && <li className="py-8 text-center text-sm text-gray-400">No sales yet.</li>}
        {!loading &&
          rows.map((p) => (
            <li key={p.id}>
              <div className="flex justify-between gap-3 text-sm">
                <span className="truncate text-gray-700">{p.name}</span>
                <span className="shrink-0 font-medium text-gray-900">{formatPrice(p.revenue)}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-[#2a78d6]" style={{ width: `${(p.revenue / max) * 100}%` }} />
                </div>
                <span className="w-14 text-right text-xs text-gray-400">{formatNumber(p.units)} sold</span>
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0];
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState("30d");

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((err) => setError(getErrorMessage(err, "Couldn't load dashboard stats.")));
    getOrders()
      .then(setOrders)
      .catch((err) => setError(getErrorMessage(err, "Couldn't load order analytics.")))
      .finally(() => setOrdersLoading(false));
  }, []);

  const { buckets, totals } = useMemo(() => buildSeries(orders, range), [orders, range]);
  const best = useMemo(() => topProducts(orders, range), [orders, range]);

  const show = (value, format = formatNumber) => (stats ? format(value) : "…");
  const showOrders = (value, format = formatNumber) => (ordersLoading ? "…" : format(value));
  const periodHint = `Last ${RANGES[range].label}`;

  const cards = [
    { title: "Total Revenue", value: show(stats?.totalRevenue, formatPrice), icon: IndianRupee, hint: "From paid orders" },
    { title: "Orders", value: show(stats?.totalOrders), icon: ShoppingCart },
    { title: "Products", value: show(stats?.totalProducts), icon: Package },
    { title: "Categories", value: show(stats?.totalCategories), icon: FolderTree },
    { title: "Customers", value: show(stats?.totalCustomers), icon: Users },
  ];

  const periodCards = [
    { title: "Orders placed", value: showOrders(totals.orders), hint: periodHint },
    { title: "Sales", value: showOrders(totals.sales, formatPrice), hint: "Excludes cancelled orders" },
    { title: "Avg. order value", value: showOrders(totals.avgOrderValue, formatPrice), hint: periodHint },
    { title: "Cancelled", value: showOrders(totals.cancelled), hint: periodHint },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">
        Welcome back{firstName ? `, ${firstName}` : ""}
      </h1>
      <p className="mt-1 text-sm text-gray-500">Here's what's happening with your store.</p>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Analytics</h2>
        <RangePicker value={range} onChange={setRange} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {periodCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <ComboChart
          title="Sales vs collected"
          subtitle="Bars: value of orders placed · Line: payments received"
          data={buckets}
          bar={{ key: "sales", name: "Sales" }}
          line={{ key: "collected", name: "Collected" }}
          format={formatPrice}
          axisFormat={compactRupees}
          loading={ordersLoading}
        />
        <ComboChart
          title="Orders"
          subtitle="Bars: orders placed · Line: orders delivered"
          data={buckets}
          bar={{ key: "orders", name: "Placed" }}
          line={{ key: "delivered", name: "Delivered" }}
          format={formatNumber}
          loading={ordersLoading}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <TopProducts rows={best} loading={ordersLoading} />
      </div>
    </div>
  );
}
