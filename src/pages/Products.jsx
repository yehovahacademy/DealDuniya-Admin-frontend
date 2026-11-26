import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Download, Eye, EyeOff, Pencil, Plus, Search, X } from "lucide-react";
import DataTable from "../components/DataTable";
import { deactivateProduct, getProducts, publishProduct } from "../services/productService";
import { formatNumber, formatPrice, getErrorMessage } from "../utils/format";

const LOW_STOCK = 10;

function StockBadge({ stock }) {
  if (stock === 0) {
    return <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">Out of stock</span>;
  }
  if (stock < LOW_STOCK) {
    return (
      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">{stock} left</span>
    );
  }
  return (
    <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
      {formatNumber(stock)} in stock
    </span>
  );
}

function StatusBadge({ active }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700">
      <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400">
      <span className="h-1.5 w-1.5 rounded-full bg-gray-300" /> Hidden
    </span>
  );
}

const getColumns = (onDelete, onPublish, publishingId) => [
  {
    key: "name",
    header: "Product",
    render: (p) => (
      <div className="flex items-center gap-3">
        {p.images?.[0]?.imageUrl ? (
          <img src={p.images[0].imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-sm font-semibold text-brand-600">
            {p.name?.[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-medium text-gray-900">{p.name}</p>
          {p.sku && <p className="text-xs text-gray-400">SKU: {p.sku}</p>}
        </div>
      </div>
    ),
  },
  { key: "category", header: "Category", render: (p) => p.category?.name ?? "—" },
  { key: "price", header: "Price", render: (p) => formatPrice(p.price) },
  { key: "stock", header: "Stock", render: (p) => <StockBadge stock={p.stock} /> },
  { key: "isActive", header: "Status", render: (p) => <StatusBadge active={p.isActive} /> },
  {
    key: "actions",
    header: <span className="sr-only">Actions</span>,
    className: "text-right",
    render: (p) => (
      <div className="flex justify-end gap-1">
        <Link
          to={`/products/${p.id}/edit`}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-brand-600"
          aria-label={`Edit ${p.name}`}
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </Link>
        {p.isActive ? (
          <button
            onClick={() => onDelete(p)}
            className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
            aria-label={`Deactivate ${p.name}`}
            title="Deactivate"
          >
            <EyeOff className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => onPublish(p)}
            disabled={publishingId === p.id}
            className="rounded-lg p-2 text-gray-400 hover:bg-green-50 hover:text-green-600 disabled:opacity-50"
            aria-label={`Publish ${p.name}`}
            title="Publish to store"
          >
            {publishingId === p.id ? (
              <span className="block h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    ),
  },
];

function ConfirmDeleteDialog({ product, deleting, error, onCancel, onConfirm }) {
  if (!product) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Deactivate product?</h2>
            <p className="mt-1 text-sm text-gray-500">
              “{product.name}” will be hidden from your store. Existing orders that include it are kept.
            </p>
          </div>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {deleting && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            {deleting ? "Deactivating…" : "Deactivate"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get("status") ?? "all";
  const [publishingId, setPublishingId] = useState(null);
  const [pageError, setPageError] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [successMessage, setSuccessMessage] = useState(location.state?.message ?? "");
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const openDelete = (product) => {
    setDeleteError("");
    setToDelete(product);
  };

  const closeDelete = () => {
    if (!deleting) setToDelete(null);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      const data = await deactivateProduct(toDelete.id);
      setProducts((prev) => prev.map((p) => (p.id === toDelete.id ? { ...p, isActive: false } : p)));
      setSuccessMessage(data.message || "Product deactivated.");
      setToDelete(null);
    } catch (err) {
      setDeleteError(getErrorMessage(err, "Couldn't deactivate the product."));
    } finally {
      setDeleting(false);
    }
  };

  const handlePublish = async (product) => {
    setPublishingId(product.id);
    setPageError("");
    try {
      const data = await publishProduct(product.id);
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, isActive: true } : p)));
      setSuccessMessage(data.message || `“${product.name}” is now live in the store.`);
    } catch (err) {
      setPageError(getErrorMessage(err, "Couldn't publish the product."));
    } finally {
      setPublishingId(null);
    }
  };

  const columns = useMemo(() => getColumns(openDelete, handlePublish, publishingId), [publishingId]);

  const setStatus = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value === "all") next.delete("status");
    else next.set("status", value);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    // Clear the one-time success message so it doesn't reappear on refresh.
    if (location.state?.message) window.history.replaceState({}, "");

    getProducts()
      .then(setProducts)
      .catch((err) => setError(getErrorMessage(err, "Couldn't load products.")))
      .finally(() => setLoading(false));
  }, [location.state]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        (status === "all" || (status === "active" ? p.isActive : !p.isActive)) &&
        (!term ||
          p.name?.toLowerCase().includes(term) ||
          p.sku?.toLowerCase().includes(term) ||
          p.category?.name?.toLowerCase().includes(term)),
    );
  }, [products, search, status]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your product catalogue.</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/products/import"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Import
          </Link>
          <Link
            to="/products/new"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Add product
          </Link>
        </div>
      </div>

      {successMessage && (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="flex-1">{successMessage}</span>
          <button
            onClick={() => setSuccessMessage("")}
            aria-label="Dismiss"
            className="rounded p-0.5 hover:bg-green-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {pageError && (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{pageError}</span>
          <button onClick={() => setPageError("")} aria-label="Dismiss" className="rounded p-0.5 hover:bg-red-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 p-4">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, SKU or category"
              className="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-9 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-4">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="Filter by status"
              className="rounded-lg border border-gray-300 py-2 pr-8 pl-3 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="hidden">Hidden</option>
            </select>
            {!loading && !error && (
              <p className="hidden text-sm text-gray-500 sm:block">
                {filtered.length} of {products.length} products
              </p>
            )}
          </div>
        </div>

        {error ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-medium text-red-600">{error}</p>
            <p className="mt-1 text-xs text-gray-400">
              Check that the backend is running and the products list endpoint exists.
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            loading={loading}
            emptyMessage={search ? "No products match your search." : "No products yet. Add your first one!"}
          />
        )}
      </div>

      <ConfirmDeleteDialog
        product={toDelete}
        deleting={deleting}
        error={deleteError}
        onCancel={closeDelete}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
