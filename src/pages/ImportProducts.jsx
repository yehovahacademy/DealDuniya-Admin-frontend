import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft, CheckCircle2, Download, RefreshCw, Search, X } from "lucide-react";
import { IMPORT_SOURCES, importProducts, previewExternalProducts } from "../services/importService";
import { getProducts } from "../services/productService";
import { formatNumber, getErrorMessage } from "../utils/format";

const MAX_PER_IMPORT = 100; // backend limit

// External prices are USD; show them as-is so the admin sees what will be saved.
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function ImportProducts() {
  const [source, setSource] = useState("dummyjson");
  const [items, setItems] = useState([]);
  const [existingSkus, setExistingSkus] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [hideImported, setHideImported] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setItems([]);
    setSelected(new Set());
    setCategory("");

    Promise.all([previewExternalProducts(source), getProducts()])
      .then(([external, ours]) => {
        if (cancelled) return;
        setItems(external);
        setExistingSkus(new Set(ours.map((p) => p.sku)));
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, `Couldn't load ${IMPORT_SOURCES[source].label} products.`));
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [source, reloadKey]);

  const categories = useMemo(() => [...new Set(items.map((i) => i.category).filter(Boolean))].sort(), [items]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter(
      (i) =>
        (!category || i.category === category) &&
        (!hideImported || !existingSkus.has(i.sku)) &&
        (!term || i.title?.toLowerCase().includes(term) || i.category?.toLowerCase().includes(term)),
    );
  }, [items, search, category, hideImported, existingSkus]);

  const selectable = visible.filter((i) => !existingSkus.has(i.sku));
  const allVisibleSelected = selectable.length > 0 && selectable.every((i) => selected.has(i.id));

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < MAX_PER_IMPORT) next.add(id);
      return next;
    });

  const toggleAllVisible = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        selectable.forEach((i) => next.delete(i.id));
      } else {
        for (const i of selectable) {
          if (next.size >= MAX_PER_IMPORT) break;
          next.add(i.id);
        }
      }
      return next;
    });

  const handleImport = async () => {
    setImporting(true);
    setResult(null);
    try {
      const data = await importProducts(source, [...selected]);
      setResult({ ok: true, ...data });
      setExistingSkus((prev) => new Set([...prev, ...(data.imported ?? []).map((p) => p.sku)]));
      setSelected(new Set());
    } catch (err) {
      setResult({ ok: false, message: getErrorMessage(err, "Import failed.") });
    } finally {
      setImporting(false);
    }
  };

  const titleFor = (externalId) => items.find((i) => i.id === externalId)?.title ?? `#${externalId}`;

  return (
    <div className="pb-24">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/products"
            className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-brand-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Products
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Import products</h1>
          <p className="mt-1 text-sm text-gray-500">
            Pick products from an external catalogue. Imported products start <strong>hidden</strong> — publish them
            from the Products page to show them in the store.
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1 shadow-sm">
          {Object.entries(IMPORT_SOURCES).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => setSource(key)}
              disabled={importing}
              className={`rounded-md px-4 py-1.5 text-sm font-medium ${
                source === key ? "bg-brand-600 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {result && (
        <div
          className={`mt-6 rounded-lg border px-4 py-3 text-sm ${
            result.ok ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <div className="flex items-start gap-2">
            {result.ok ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <div className="flex-1">
              {result.ok ? (
                <>
                  <p>
                    Imported {result.importedCount} product{result.importedCount === 1 ? "" : "s"}
                    {result.skippedCount > 0 && `, skipped ${result.skippedCount}`}.{" "}
                    {result.importedCount > 0 && (
                      <Link to="/products?status=hidden" className="font-medium underline">
                        Review and publish them →
                      </Link>
                    )}
                  </p>
                  {result.skipped?.length > 0 && (
                    <ul className="mt-2 list-disc pl-5 text-amber-800">
                      {result.skipped.map((s) => (
                        <li key={s.externalId}>
                          {titleFor(s.externalId)} — {s.reason}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <p>{result.message}</p>
              )}
            </div>
            <button onClick={() => setResult(null)} aria-label="Dismiss" className="rounded p-0.5 hover:bg-black/5">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 lg:flex-row lg:items-center">
          <div className="relative w-full lg:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title or category"
              className="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-9 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-gray-300 py-2 pr-8 pl-3 text-sm focus:border-brand-500 focus:outline-none"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={hideImported}
              onChange={(e) => setHideImported(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-600"
            />
            Hide already imported
          </label>
          <div className="flex items-center gap-3 lg:ml-auto">
            {!loading && !error && (
              <span className="text-sm text-gray-500">
                {formatNumber(visible.length)} of {formatNumber(items.length)}
              </span>
            )}
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              disabled={loading}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
              title="Reload"
              aria-label="Reload"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {error ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-medium text-red-600">{error}</p>
            <p className="mt-1 text-xs text-gray-400">
              Check the backend is running and its .env has the API URL for this source.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAllVisible}
                      disabled={loading || selectable.length === 0}
                      aria-label="Select all visible"
                      className="h-4 w-4 rounded border-gray-300 text-brand-600"
                    />
                  </th>
                  {["Product", "Category", "Price", "Stock", "Status"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-4 py-4">
                          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
                        </td>
                      ))}
                    </tr>
                  ))}

                {!loading && visible.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      No products match your filters.
                    </td>
                  </tr>
                )}

                {!loading &&
                  visible.map((item) => {
                    const imported = existingSkus.has(item.sku);
                    const checked = selected.has(item.id);
                    const atLimit = !checked && selected.size >= MAX_PER_IMPORT;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => !imported && !atLimit && toggle(item.id)}
                        className={
                          imported
                            ? "bg-gray-50/60 text-gray-400"
                            : `cursor-pointer ${checked ? "bg-brand-50/60" : "hover:bg-gray-50"}`
                        }
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={imported || atLimit}
                            onChange={() => toggle(item.id)}
                            aria-label={`Select ${item.title}`}
                            className="h-4 w-4 rounded border-gray-300 text-brand-600 disabled:opacity-40"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt=""
                                loading="lazy"
                                className="h-10 w-10 shrink-0 rounded-lg bg-white object-contain ring-1 ring-gray-100"
                              />
                            ) : (
                              <div className="h-10 w-10 shrink-0 rounded-lg bg-gray-100" />
                            )}
                            <div className="min-w-0">
                              <p className={`max-w-sm truncate font-medium ${imported ? "" : "text-gray-900"}`}>
                                {item.title}
                              </p>
                              <p className="text-xs text-gray-400">SKU: {item.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 capitalize">{item.category ?? "—"}</td>
                        <td className="px-4 py-3">{usd.format(Number(item.price) || 0)}</td>
                        <td className="px-4 py-3">{formatNumber(item.stock)}</td>
                        <td className="px-4 py-3">
                          {imported ? (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                              Imported
                            </span>
                          ) : (
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                              New
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sticky action bar */}
      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur lg:left-64">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <p className="text-sm text-gray-700">
              <strong>{selected.size}</strong> selected
              {selected.size >= MAX_PER_IMPORT && (
                <span className="ml-2 text-amber-700">(max {MAX_PER_IMPORT} per import)</span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setSelected(new Set())}
                disabled={importing}
                className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {importing ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {importing ? "Importing…" : `Import ${selected.size}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
