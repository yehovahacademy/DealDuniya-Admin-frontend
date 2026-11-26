import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, MapPin, Phone, User, X } from "lucide-react";
import {
  ORDER_STATUSES,
  OrderStatusBadge,
  PaymentStatusBadge,
  formatEnum,
} from "../components/OrderBadges";
import { getOrderById, updateOrderStatus } from "../services/orderService";
import { formatDate, formatPrice, getErrorMessage } from "../utils/format";

function Card({ title, children, className = "" }) {
  return (
    <section className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>
      {title && <h2 className="border-b border-gray-200 px-5 py-3 text-sm font-semibold text-gray-900">{title}</h2>}
      <div className="p-5">{children}</div>
    </section>
  );
}

// The backend's PATCH /status only accepts `status`; payment status is shown read-only.
function StatusForm({ order, onUpdated }) {
  const [status, setStatus] = useState(order.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const data = await updateOrderStatus(order.id, { status });
      // PATCH returns the order without items/user, so merge onto what we already have.
      onUpdated({ ...order, ...(data.data ?? data.order), status }, data.message?.trim() || "Order updated.");
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't update the order."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="Update status">
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Order status</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          disabled={saving}
          className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {formatEnum(s)}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">Payment status</span>
        <PaymentStatusBadge status={order.paymentStatus} />
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button
        onClick={handleSave}
        disabled={status === order.status || saving}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
        {saving ? "Saving…" : "Save changes"}
      </button>
    </Card>
  );
}

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setLoading(true);
    getOrderById(id)
      .then(setOrder)
      .catch((err) => setError(getErrorMessage(err, "Couldn't load this order.")))
      .finally(() => setLoading(false));
  }, [id]);

  const backLink = (
    <Link to="/orders" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
      <ArrowLeft className="h-4 w-4" /> Back to orders
    </Link>
  );

  if (loading) {
    return (
      <div>
        {backLink}
        <div className="mt-4 h-8 w-48 animate-pulse rounded bg-gray-100" />
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="h-64 animate-pulse rounded-xl bg-gray-100 lg:col-span-2" />
          <div className="h-64 animate-pulse rounded-xl bg-gray-100" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div>
        {backLink}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white px-4 py-12 text-center">
          <p className="text-sm font-medium text-red-600">{error || "Order not found."}</p>
          <p className="mt-1 text-xs text-gray-400">Check that GET /api/admin/orders/:id is available.</p>
        </div>
      </div>
    );
  }

  const items = order.items ?? [];

  return (
    <div>
      {backLink}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Order #{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-gray-500">Placed on {formatDate(order.createdAt, true)}</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">Order <OrderStatusBadge status={order.status} /></span>
          <span className="flex items-center gap-1.5">Payment <PaymentStatusBadge status={order.paymentStatus} /></span>
        </div>
      </div>

      {successMessage && (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="flex-1">{successMessage}</span>
          <button onClick={() => setSuccessMessage("")} aria-label="Dismiss" className="rounded p-0.5 hover:bg-green-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Left: items + totals */}
        <div className="space-y-6 lg:col-span-2">
          <Card title={`Items (${items.length})`} className="overflow-hidden">
            <div className="-m-5 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {["Product", "Price", "Qty", "Total"].map((h, i) => (
                      <th
                        key={h}
                        className={`px-5 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase ${
                          i === 0 ? "text-left" : "text-right"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-5 py-3">
                        {item.productId ? (
                          <Link
                            to={`/products/${item.productId}/edit`}
                            className="font-medium text-gray-900 hover:text-brand-600"
                          >
                            {item.productName}
                          </Link>
                        ) : (
                          <p className="font-medium text-gray-900">{item.productName}</p>
                        )}
                        <p className="text-xs text-gray-400">SKU: {item.productSku}</p>
                      </td>
                      <td className="px-5 py-3 text-right text-gray-700">{formatPrice(item.unitPrice)}</td>
                      <td className="px-5 py-3 text-right text-gray-700">{item.quantity}</td>
                      <td className="px-5 py-3 text-right font-medium text-gray-900">{formatPrice(item.lineTotal)}</td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-gray-400">
                        No items returned for this order.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Summary">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Subtotal</dt>
                <dd className="text-gray-900">{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Shipping</dt>
                <dd className="text-gray-900">
                  {Number(order.shippingFee) ? formatPrice(order.shippingFee) : "Free"}
                </dd>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-semibold">
                <dt className="text-gray-900">Total</dt>
                <dd className="text-gray-900">{formatPrice(order.totalAmount)}</dd>
              </div>
              <div className="flex justify-between pt-1">
                <dt className="text-gray-500">Payment method</dt>
                <dd className="text-gray-900">{order.paymentMethod === "COD" ? "Cash on delivery" : "Online"}</dd>
              </div>
            </dl>
          </Card>
        </div>

        {/* Right: status, customer, shipping */}
        <div className="space-y-6">
          <StatusForm
            key={order.status}
            order={order}
            onUpdated={(updated, message) => {
              setOrder(updated);
              setSuccessMessage(message);
            }}
          />

          <Card title="Customer">
            <div className="flex items-start gap-3 text-sm">
              <User className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{order.user?.name || "—"}</p>
                {order.user?.email && (
                  <a href={`mailto:${order.user.email}`} className="text-gray-500 hover:text-brand-600">
                    {order.user.email}
                  </a>
                )}
              </div>
            </div>
          </Card>

          <Card title="Shipping address">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <address className="text-gray-700 not-italic">
                  <p className="font-medium text-gray-900">{order.shippingName}</p>
                  <p>{order.shippingAddressLine1}</p>
                  {order.shippingAddressLine2 && <p>{order.shippingAddressLine2}</p>}
                  <p>
                    {order.shippingCity}, {order.shippingState} {order.shippingPostalCode}
                  </p>
                  <p>{order.shippingCountry}</p>
                </address>
              </div>
              {order.shippingPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0 text-gray-400" />
                  <a href={`tel:${order.shippingPhone}`} className="text-gray-700 hover:text-brand-600">
                    {order.shippingPhone}
                  </a>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
