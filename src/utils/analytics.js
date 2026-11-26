// Turns the admin orders list into chart-ready buckets.
// Done client-side from GET /api/admin/orders; move to a backend endpoint once order volume grows.

export const RANGES = {
  "7d": { label: "7 days", unit: "day", count: 7 },
  "30d": { label: "30 days", unit: "day", count: 30 },
  "12m": { label: "12 months", unit: "month", count: 12 },
};

const pad = (n) => String(n).padStart(2, "0");
const keyFor = (date, unit) =>
  unit === "day"
    ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    : `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;

const labelFor = (date, unit) =>
  date.toLocaleDateString("en-IN", unit === "day" ? { day: "numeric", month: "short" } : { month: "short", year: "2-digit" });

// Empty buckets for the whole range (oldest first), so days with no orders still show as 0.
function emptyBuckets({ unit, count }) {
  const now = new Date();
  const buckets = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = unit === "day"
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      : new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: keyFor(d, unit),
      label: labelFor(d, unit),
      orders: 0,
      delivered: 0,
      cancelled: 0,
      sales: 0, // value of non-cancelled orders placed
      collected: 0, // value of orders with paymentStatus PAID
    });
  }
  return buckets;
}

export function buildSeries(orders, rangeKey) {
  const range = RANGES[rangeKey];
  const buckets = emptyBuckets(range);
  const byKey = new Map(buckets.map((b) => [b.key, b]));

  for (const order of orders) {
    const bucket = byKey.get(keyFor(new Date(order.createdAt), range.unit));
    if (!bucket) continue; // outside the selected range

    const amount = Number(order.totalAmount) || 0;
    bucket.orders += 1;
    if (order.status === "DELIVERED") bucket.delivered += 1;
    if (order.status === "CANCELLED") bucket.cancelled += 1;
    else bucket.sales += amount;
    if (order.paymentStatus === "PAID") bucket.collected += amount;
  }

  const totals = buckets.reduce(
    (t, b) => ({
      orders: t.orders + b.orders,
      delivered: t.delivered + b.delivered,
      cancelled: t.cancelled + b.cancelled,
      sales: t.sales + b.sales,
      collected: t.collected + b.collected,
    }),
    { orders: 0, delivered: 0, cancelled: 0, sales: 0, collected: 0 },
  );
  const placed = totals.orders - totals.cancelled;
  totals.avgOrderValue = placed ? totals.sales / placed : 0;

  return { buckets, totals };
}

// Best sellers by revenue within the range (cancelled orders excluded).
export function topProducts(orders, rangeKey, limit = 5) {
  const range = RANGES[rangeKey];
  const keys = new Set(emptyBuckets(range).map((b) => b.key));
  const map = new Map();

  for (const order of orders) {
    if (order.status === "CANCELLED" || !keys.has(keyFor(new Date(order.createdAt), range.unit))) continue;
    for (const item of order.items ?? []) {
      const id = item.productId ?? item.productSku;
      const row = map.get(id) ?? { id, name: item.productName, units: 0, revenue: 0 };
      row.units += item.quantity;
      row.revenue += Number(item.lineTotal) || 0;
      map.set(id, row);
    }
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}
