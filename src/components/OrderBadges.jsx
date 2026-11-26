// Mirrors the OrderStatus / PaymentStatus enums in the backend's schema.prisma.
export const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
export const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"];

const ORDER_STYLES = {
  PENDING: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  PROCESSING: "bg-brand-50 text-brand-700",
  SHIPPED: "bg-purple-50 text-purple-700",
  DELIVERED: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
};

const PAYMENT_STYLES = {
  PENDING: "bg-amber-50 text-amber-700",
  PAID: "bg-green-50 text-green-700",
  FAILED: "bg-red-50 text-red-700",
  REFUNDED: "bg-gray-100 text-gray-700",
};

export const formatEnum = (value) =>
  value ? value.charAt(0) + value.slice(1).toLowerCase() : "—";

function Badge({ value, styles }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${
        styles[value] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {formatEnum(value)}
    </span>
  );
}

export const OrderStatusBadge = ({ status }) => <Badge value={status} styles={ORDER_STYLES} />;
export const PaymentStatusBadge = ({ status }) => <Badge value={status} styles={PAYMENT_STYLES} />;
