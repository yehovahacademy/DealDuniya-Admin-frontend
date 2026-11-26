import api from "./api";

// GET /api/admin/customers → { success, message, data: [{ id, name, email, avatarUrl, createdAt }] }
export const getCustomers = async () => {
  const { data } = await api.get("/admin/customers");
  return data.data ?? [];
};
