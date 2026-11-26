import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ProductForm from "../components/ProductForm";
import { createProduct } from "../services/productService";
import { getErrorMessage } from "../utils/format";

export default function AddProduct() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (product) => {
    setError("");
    setSubmitting(true);
    try {
      const data = await createProduct(product);
      navigate("/products", {
        state: { message: data.message || "Product created successfully." },
      });
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't create the product."));
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

      <h1 className="mt-3 text-2xl font-semibold text-gray-900">Add product</h1>
      <p className="mt-1 text-sm text-gray-500">Fill in the details below to add a product to your store.</p>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6">
        <ProductForm
          onSubmit={handleSubmit}
          onCancel={() => navigate("/products")}
          submitting={submitting}
          submitLabel="Create product"
        />
      </div>
    </div>
  );
}
