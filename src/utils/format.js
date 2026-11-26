// Change currency/locale here to update it across the app.
const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

// Prisma returns Decimal fields as strings, so coerce before formatting.
export const formatPrice = (value) => currencyFormatter.format(Number(value) || 0);

export const formatNumber = (value) => new Intl.NumberFormat("en-IN").format(Number(value) || 0);

export const getErrorMessage = (error, fallback = "Something went wrong. Please try again.") =>
  error?.response?.data?.message || fallback;

export const formatDate = (value, withTime = false) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        ...(withTime && { hour: "numeric", minute: "2-digit" }),
      })
    : "—";
