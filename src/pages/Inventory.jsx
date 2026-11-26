import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Boxes, CheckCircle2, IndianRupee, Minus, PackageX, Plus, Search, X } from "lucide-react";
import DataTable from "../components/DataTable";
import StatCard from "../components/StatCard";
import { getProducts, updateStock } from "../services/productService";
import { formatNumber, formatPrice, getErrorMessage } from "../utils/format";

// Same threshold as the Products page.
const LOW_STOCK = 10;

const stockLevel = (stock) => (stock === 0 ? "OUT" : stock < LOW_STOCK ? "LOW" : "OK");

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "LOW", label: "Low stock" },
  { key: "OUT", label: "Out of stock" },
  { key: "OK", label: "In stock" },
];

function LevelBadge({ stock }) {
  const level = stockLevel(stock);
  const styles = {
    OUT: "bg-red-50 text-red-700",
    LOW: "bg-amber-50 text-amber-700",
    OK: "bg-green-50 text-green-700",
  };
  const labels = { OUT: "Out of stock", LOW: "Low", OK: "In stock" };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${styles[level]}`}>
      {labels[level]}
    </span>
  );
}

// Inline −/+ editor; Save only appears once the value differs from the saved stock.
function StockEditor({ product, onSaved, onError }) {
  const [value, setValue] = useState(String(product.stock));
  const [saving, setSaving] = useState(false);

  const parsed = Number(value);
  const valid = value !== "" && Number.isInteger(parsed) && parsed >= 0;
  const dirty = valid && parsed !== product.stock;

  const step = (delta) => setValue(String(Math.max(0, (valid ? parsed : product.stock) + delta)));

  const save = async () => {
    setSaving(true);
    try {
      const data = await updateStock(product.id, parsed);
      onSaved({ ...product, stock: parsed, ...(data.product ?? data.data) }, data.message);
    } catch (err) {
      onError(getErrorMessage(err, `Couldn't update stock for ${product.name}.`));
      setValue(String(product.stock));
    } finally {
      setSaving(false);
    }
  };

  const btn = "flex h-8 w-8 items-center justify-center text-gray-500 hover:text-brand-600 disabled:opacity-40";

  return (
    <div className="flex items-center gap-2">
      <div
        className={`inline-flex items-center rounded-full border bg-white ${
          valid ? "border-gray-300" : "border-red-300"
        }`}
      >
        <button type="button" onClick={() => step(-1)} disabled={saving || parsed <= 0} className={btn} aria-label="Decrease">
          <Minus className="h-3.5 w-3.5" />
        </button>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ""))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && dirty) save();
            if (e.key === "Escape") setValue(String(product.stock));
          }}
          disabled={saving}
          inputMode="numeric"
          aria-label={`Stock for ${product.name}`}
          className="w-14 bg-transparent text-center text-sm font-medium text-gray-900 focus:outline-none"
        />
        <button type="button" onClick={() => step(1)} disabled={saving} className={btn} aria-label="Increase">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {dirty && (
        <>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            Save
          </button>
          {!saving && (
            <button
              onClick={() => setValue(String(product.stock))}
              className="text-xs text-gray-400 hover:text-gray-700"
            >
              Reset
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [banner, setBanner] = useState(null); // { type: "success" | "error", text }

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch((err) => setError(getErrorMessage(err, "Couldn't load inventory.")))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    let units = 0;
    let value = 0;
    let low = 0;
    let out = 0;
    for (const p of products) {
      units += p.stock;
      value += p.stock * Number(p.price || 0);
      const level = stockLevel(p.stock);
      if (level === "LOW") low += 1;
      if (level === "OUT") out += 1;
    }
    return { units, value, low, out };
  }, [products]);

  const counts = useMemo(() => {
    const c = { ALL: products.length, LOW: 0, OUT: 0, OK: 0 };
    for (const p of products) c[stockLevel(p.stock)] += 1;
    return c;
  }, [products]);

  // Lowest stock first so items needing attention are on top.
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products
      .filter((p) => filter === "ALL" || stockLevel(p.stock) === filter)
      .filter(
        (p) =>
          !term ||
          p.name?.toLowerCase().includes(term) ||
          p.sku?.toLowerCase().includes(term) ||
          p.category?.name?.toLowerCase().includes(term)
      )
      .sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name));
  }, [products, search, filter]);

  const handleSaved = (updated, message) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
    setBanner({ type: "success", text: message?.trim() || `Stock updated for ${updated.name}.` });
  };

  const columns = [
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
            <Link to={`/products/${p.id}/edit`} className="font-medium text-gray-900 hover:text-brand-600">
              {p.name}
            </Link>
            <p className="text-xs text-gray-400">
              {p.sku && `SKU: ${p.sku}`}
              {!p.isActive && <span className="ml-2 text-gray-400">· Hidden</span>}
            </p>
          </div>
        </div>
      ),
    },
    { key: "category", header: "Category", render: (p) => p.category?.name ?? "—" },
    { key: "price", header: "Price", render: (p) => formatPrice(p.price) },
    { key: "level", header: "Status", render: (p) => <LevelBadge stock={p.stock} /> },
    {
      key: "stock",
      header: "Stock",
      render: (p) => (
        <StockEditor
          key={p.stock}
          product={p}
          onSaved={handleSaved}
          onError={(text) => setBanner({ type: "error", text })}
        />
      ),
    },
    {
      key: "value",
      header: "Stock value",
      className: "text-right",
      render: (p) => <span className="text-gray-500">{formatPrice(p.stock * Number(p.price || 0))}</span>,
    },
  ];

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Inventory</h1>
        <p className="mt-1 text-sm text-gray-500">Track stock levels and restock products.</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Units in stock" value={loading ? "…" : formatNumber(stats.units)} icon={Boxes} hint={`${products.length} products`} />
        <StatCard title="Stock value" value={loading ? "…" : formatPrice(stats.value)} icon={IndianRupee} hint="At current prices" />
        <StatCard title="Low stock" value={loading ? "…" : stats.low} icon={AlertTriangle} hint={`Fewer than ${LOW_STOCK} left`} />
        <StatCard title="Out of stock" value={loading ? "…" : stats.out} icon={PackageX} hint="Can't be ordered" />
      </div>

      {banner && (
        <div
          className={`mt-6 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            banner.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {banner.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          <span className="flex-1">{banner.text}</span>
          <button onClick={() => setBanner(null)} aria-label="Dismiss" className="rounded p-0.5 hover:bg-black/5">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${
              filter === key ? "bg-brand-600 text-white" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {label}
            <span className={`ml-1.5 text-xs ${filter === key ? "text-brand-100" : "text-gray-400"}`}>{counts[key]}</span>
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
              placeholder="Search name, SKU or category"
              className="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-9 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
            />
          </div>
          {!loading && !error && (
            <p className="hidden text-sm text-gray-500 sm:block">
              {filtered.length} of {products.length} products
            </p>
          )}
        </div>

        {error ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-medium text-red-600">{error}</p>
            <p className="mt-1 text-xs text-gray-400">Check that the backend is running.</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            loading={loading}
            emptyMessage={
              search || filter !== "ALL" ? "No products match your filters." : "No products yet. Add some first."
            }
          />
        )}
      </div>
    </div>
  );
}
