import api from "./api";

// GET /api/admin/products/admin-list → { success, products } (includes inactive products)
export const getProducts = async () => {
  const { data } = await api.get("/admin/products/admin-list");
  return data.products ?? [];
};

// GET /api/admin/products/:id → { success, data }
export const getProductById = async (id) => {
  const { data } = await api.get(`/admin/products/${id}`);
  return data.data ?? data.product;
};

// POST /api/admin/products → { success, message, product? }
export const createProduct = async (product) => {
  const { data } = await api.post("/admin/products", product);
  return data;
};

// PATCH /api/admin/products/:id → { success, message, product }
export const updateProduct = async (id, updates) => {
  const { data } = await api.patch(`/admin/products/${id}`, updates);
  return data;
};

// DELETE /api/admin/products/:id → { success, message, product }
// Soft delete: the backend sets isActive = false instead of removing the row.
export const deactivateProduct = async (id) => {
  const { data } = await api.delete(`/admin/products/${id}`);
  return data;
};

// PATCH /api/admin/products/:id { isActive: true } → makes the product visible in the user store.
// Imported products arrive with isActive = false, so this is how they go live.
export const publishProduct = async (id) => updateProduct(id, { isActive: true });

// PATCH /api/admin/products/:id { stock } → used by the Inventory page for quick stock edits.
export const updateStock = async (id, stock) => updateProduct(id, { stock });
