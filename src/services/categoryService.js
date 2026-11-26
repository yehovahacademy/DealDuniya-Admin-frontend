import api from "./api";

// GET /api/admin/categories → { success, categories }
export const getCategories = async () => {
  const { data } = await api.get("/admin/categories");
  return data.categories ?? [];
};

// POST /api/admin/categories → { success, message, category }
export const createCategory = async (category) => {
  const { data } = await api.post("/admin/categories", category);
  return data;
};

// PATCH /api/admin/categories/:id → { success, message, category }
export const updateCategory = async (id, updates) => {
  const { data } = await api.patch(`/admin/categories/${id}`, updates);
  return data;
};

// DELETE /api/admin/categories/:id → { success, message }
// Returns 409 if products still use this category.
export const deleteCategory = async (id) => {
  const { data } = await api.delete(`/admin/categories/${id}`);
  return data;
};
