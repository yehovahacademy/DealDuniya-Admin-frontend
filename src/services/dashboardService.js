import api from "./api";

// GET /api/admin/dashboard/stats → { success, stats }
export const getDashboardStats = async () => {
  const { data } = await api.get("/admin/dashboard/stats");
  return data.stats;
};
