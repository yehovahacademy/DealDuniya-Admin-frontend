import api from "./api";

// Sends the Google ID token to the backend; returns { success, token, user }.
export const loginWithGoogle = async (credential) => {
  const { data } = await api.post("/admin/auth/google", { credential });
  return data;
};
