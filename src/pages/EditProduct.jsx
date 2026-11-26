import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ProductForm from "../components/ProductForm";
import { getProductById, updateProduct } from "../services/productService";
import { getErrorMessage } from "../utils/format";

// Convert an API product into the string values the form inputs expect.
const toFormValues = (product) => ({
  name: product.name ?? "",
  sku: product.sku ?? "",
  description: product.description ?? "",
  price: product.price != null ? String(product.price) : "",
  stock: product.stock != null ? String(product.stock) : "",
  categoryId: product.categoryId ?? product.category?.id ?? "",
});

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getProductById(id)
      .then(setProduct)
      .catch((err) => setLoadError(getErrorMessage(err, "Couldn't load this product.")));
  }, [id]);

  const handleSubmit = async (updates) => {
    setError("");
    setSubmitting(true);
    try {
      const data = await updateProduct(id, updates);
      navigate("/products", {
        state: { message: data.message || "Product updated successfully." },
      });
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't update the product."));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        to="/products"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to products
      </Link>

      <h1 className="mt-3 text-2xl font-semibold text-gray-900">Edit product</h1>
      <p className="mt-1 text-sm text-gray-500">
        {product ? `Update details for “${product.name}”.` : "Update product details."}
      </p>

      {loadError ? (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-sm font-medium text-red-600">{loadError}</p>
          <Link to="/products" className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline">
            Go back to products
          </Link>
        </div>
      ) : !product ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="h-80 animate-pulse rounded-xl bg-gray-100 lg:col-span-2" />
          <div className="h-48 animate-pulse rounded-xl bg-gray-100" />
        </div>
      ) : (
        <>
          {error && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="mt-6">
            <ProductForm
              initialValues={toFormValues(product)}
              onSubmit={handleSubmit}
              onCancel={() => navigate("/products")}
              submitting={submitting}
              submitLabel="Save changes"
            />
          </div>
        </>
      )}
    </div>
  );
}
