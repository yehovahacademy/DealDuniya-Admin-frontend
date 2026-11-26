import axios from "axios";
import keycloak from "../config/keycloak";

export const TOKEN_KEY = "adminToken";
export const USER_KEY = "adminUser";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach the admin token to every request.
// Keycloak session: its in-memory access token, refreshed first if it expires within 30s.
// Google session: our backend's JWT from localStorage.
api.interceptors.request.use(async (config) => {
  if (keycloak.authenticated) {
    try {
      await keycloak.updateToken(30);
    } catch {
      // Refresh failed (Keycloak session ended); AuthContext signs the user out.
    }
    if (keycloak.token) {
      config.headers.Authorization = `Bearer ${keycloak.token}`;
    }
    return config;
  }

  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the backend rejects our Google-session token, clear it and go back to login.
// Keycloak sessions are left alone here: Keycloak still holds the session, so a reload
// would sign straight back in and bounce /login -> / -> 401 forever.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !keycloak.authenticated && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
