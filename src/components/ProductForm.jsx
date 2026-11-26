import { useEffect, useState } from "react";
import { getCategories } from "../services/categoryService";

const emptyProduct = {
  name: "",
  sku: "",
  description: "",
  price: "",
  stock: "",
  categoryId: "",
};

// Mirrors the backend's checks so users see errors before submitting.
function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = "Product name is required.";
  if (!values.sku.trim()) errors.sku = "SKU is required.";
  if (!values.description.trim()) errors.description = "Description is required.";

  const price = Number(values.price);
  if (values.price === "" || !Number.isFinite(price) || price <= 0) {
    errors.price = "Price must be a positive number.";
  }

  const stock = Number(values.stock);
  if (values.stock === "" || !Number.isInteger(stock) || stock < 0) {
    errors.stock = "Stock must be a whole number of 0 or more.";
  }

  if (!values.categoryId) errors.categoryId = "Please choose a category.";
  return errors;
}

const inputClass = (hasError) =>
  `mt-1.5 block w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:ring-2 focus:outline-none ${
    hasError
      ? "border-red-300 focus:border-red-500 focus:ring-red-100"
      : "border-gray-300 focus:border-brand-500 focus:ring-brand-100"
  }`;

function Field({ label, error, hint, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>
      )}
    </label>
  );
}

function Card({ title, children }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export default function ProductForm({ initialValues, onSubmit, onCancel, submitting, submitLabel = "Save product" }) {
  const [values, setValues] = useState({ ...emptyProduct, ...initialValues });
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [categoriesState, setCategoriesState] = useState("loading"); // loading | ready | error

  useEffect(() => {
    getCategories()
      .then((list) => {
        setCategories(list);
        setCategoriesState("ready");
      })
      .catch(() => setCategoriesState("error"));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    onSubmit({
      name: values.name.trim(),
      sku: values.sku.trim(),
      description: values.description.trim(),
      price: Number(values.price),
      stock: Number(values.stock),
      categoryId: values.categoryId.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card title="Product details">
          <Field label="Name" error={errors.name}>
            <input
              name="name"
              value={values.name}
              onChange={handleChange}
              placeholder="e.g. Cotton Crew T-Shirt"
              className={inputClass(errors.name)}
            />
          </Field>

          <Field label="Description" error={errors.description}>
            <textarea
              name="description"
              rows={6}
              value={values.description}
              onChange={handleChange}
              placeholder="Describe the product, materials, sizing…"
              className={inputClass(errors.description)}
            />
          </Field>
        </Card>

        <Card title="Pricing & inventory">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Price (₹)" error={errors.price}>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={values.price}
                onChange={handleChange}
                placeholder="0.00"
                className={inputClass(errors.price)}
              />
            </Field>

            <Field label="Stock" error={errors.stock}>
              <input
                name="stock"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={values.stock}
                onChange={handleChange}
                placeholder="0"
                className={inputClass(errors.stock)}
              />
            </Field>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Organisation">
          <Field label="SKU" error={errors.sku} hint="Unique stock-keeping code.">
            <input
              name="sku"
              value={values.sku}
              onChange={handleChange}
              placeholder="e.g. TSHIRT-BLK-M"
              className={inputClass(errors.sku)}
            />
          </Field>

          {categoriesState === "error" ? (
            <Field
              label="Category ID"
              error={errors.categoryId}
              hint="Couldn't load categories, so enter the category ID directly."
            >
              <input
                name="categoryId"
                value={values.categoryId}
                onChange={handleChange}
                placeholder="Category ID"
                className={inputClass(errors.categoryId)}
              />
            </Field>
          ) : (
            <Field label="Category" error={errors.categoryId}>
              <select
                name="categoryId"
                value={values.categoryId}
                onChange={handleChange}
                disabled={categoriesState === "loading"}
                className={inputClass(errors.categoryId)}
              >
                <option value="">
                  {categoriesState === "loading" ? "Loading categories…" : "Select a category"}
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </Card>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            {submitting ? "Saving…" : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
