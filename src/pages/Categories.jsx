import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FolderTree, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import DataTable from "../components/DataTable";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../services/categoryService";
import { getErrorMessage } from "../utils/format";

function Modal({ onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />;
}

// Used for both "Add" (category = null) and "Edit".
function CategoryFormDialog({ category, onClose, onSaved }) {
  const isEdit = Boolean(category);
  const [name, setName] = useState(category?.name ?? "");
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setFieldError("Category name is required.");
      return;
    }
    if (isEdit && trimmed === category.name) {
      onClose();
      return;
    }

    setSaving(true);
    setError("");
    try {
      const data = isEdit
        ? await updateCategory(category.id, { name: trimmed })
        : await createCategory({ name: trimmed });
      onSaved(data, isEdit);
    } catch (err) {
      setError(getErrorMessage(err, `Couldn't ${isEdit ? "update" : "create"} the category.`));
      setSaving(false);
    }
  };

  return (
    <Modal onClose={saving ? undefined : onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="flex items-start justify-between">
          <h2 className="text-base font-semibold text-gray-900">{isEdit ? "Edit category" : "Add category"}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="mt-5 block">
          <span className="text-sm font-medium text-gray-700">Name</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setFieldError("");
            }}
            placeholder="e.g. Men's Clothing"
            className={`mt-1.5 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:ring-2 focus:outline-none ${
              fieldError
                ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                : "border-gray-300 focus:border-brand-500 focus:ring-brand-100"
            }`}
          />
          {fieldError && <span className="mt-1 block text-xs text-red-600">{fieldError}</span>}
        </label>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving && <Spinner />}
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create category"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteCategoryDialog({ category, onClose, onDeleted }) {
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    setError("");
    try {
      const data = await deleteCategory(category.id);
      onDeleted(data);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't delete the category."));
      setDeleting(false);
    }
  };

  return (
    <Modal onClose={deleting ? undefined : onClose}>
      <div className="flex gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-gray-900">Delete category?</h2>
          <p className="mt-1 text-sm text-gray-500">
            “{category.name}” will be permanently deleted. Categories that still have products can’t be deleted.
          </p>
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={deleting}
          className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
        >
          {deleting && <Spinner />}
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Modal>
  );
}

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  // { type: "form", category: null | {...} } or { type: "delete", category }
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err) => setError(getErrorMessage(err, "Couldn't load categories.")))
      .finally(() => setLoading(false));
  }, []);

  const sortByName = (list) => [...list].sort((a, b) => a.name.localeCompare(b.name));

  const handleSaved = (data, isEdit) => {
    const saved = data.category;
    if (saved) {
      setCategories((prev) =>
        sortByName(isEdit
          ? prev.map((c) => (c.id === saved.id ? { ...c, ...saved } : c))
          : [...prev, { _count: { products: 0 }, ...saved }])
      );
    } else {
      // Backend didn't return the category; reload the list instead.
      getCategories().then(setCategories).catch(() => {});
    }
    setSuccessMessage(data.message || (isEdit ? "Category updated." : "Category created."));
    setDialog(null);
  };

  const handleDeleted = (data) => {
    const removedId = dialog.category.id;
    setCategories((prev) => prev.filter((c) => c.id !== removedId));
    setSuccessMessage(data.message || "Category deleted.");
    setDialog(null);
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? categories.filter((c) => c.name.toLowerCase().includes(term)) : categories;
  }, [categories, search]);

  const columns = [
    {
      key: "name",
      header: "Category",
      render: (c) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <FolderTree className="h-4 w-4" />
          </span>
          <div>
            <p className="font-medium text-gray-900">{c.name}</p>
            {c.slug && <p className="text-xs text-gray-400">/{c.slug}</p>}
          </div>
        </div>
      ),
    },
    {
      key: "products",
      header: "Products",
      render: (c) => (c._count?.products != null ? c._count.products : "—"),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      render: (c) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={() => setDialog({ type: "form", category: c })}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-brand-600"
            aria-label={`Edit ${c.name}`}
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDialog({ type: "delete", category: c })}
            className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
            aria-label={`Delete ${c.name}`}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Categories</h1>
          <p className="mt-1 text-sm text-gray-500">Organise products into categories.</p>
        </div>
        <button
          onClick={() => setDialog({ type: "form", category: null })}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Add category
        </button>
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

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 p-4">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories"
              className="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-9 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
            />
          </div>
          {!loading && !error && (
            <p className="hidden text-sm text-gray-500 sm:block">
              {filtered.length} of {categories.length} categories
            </p>
          )}
        </div>

        {error ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-medium text-red-600">{error}</p>
            <p className="mt-1 text-xs text-gray-400">Check that the backend is running and the categories endpoint works.</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            loading={loading}
            emptyMessage={search ? "No categories match your search." : "No categories yet. Add your first one!"}
          />
        )}
      </div>

      {dialog?.type === "form" && (
        <CategoryFormDialog category={dialog.category} onClose={() => setDialog(null)} onSaved={handleSaved} />
      )}
      {dialog?.type === "delete" && (
        <DeleteCategoryDialog category={dialog.category} onClose={() => setDialog(null)} onDeleted={handleDeleted} />
      )}
    </div>
  );
}
