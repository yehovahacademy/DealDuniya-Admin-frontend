import api from "./api";

// Each sign-in method ends the same way: the backend checks the credential,
// then returns its own admin JWT as { success, token, user }.

// Email + password stored in our own database.
export const loginWithPassword = async (email, password) => {
  const { data } = await api.post("/admin/auth/login", { email, password });
  return data;
};

// Supabase session access token (session.access_token from supabase-js).
export const loginWithSupabase = async (accessToken) => {
  const { data } = await api.post("/admin/auth/supabase", { accessToken });
  return data;
};
