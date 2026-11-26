import api from "./api";

// Sends the admin's email and password to the backend; returns { success, token, user }.
export const loginWithPassword = async (email, password) => {
  const { data } = await api.post("/admin/auth/login", { email, password });
  return data;
};
