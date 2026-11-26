import axios from "axios";

export const TOKEN_KEY = "adminToken";
export const USER_KEY = "adminUser";

// Falls back to the deployed backend when VITE_API_URL isn't set at build time.
const DEFAULT_API_URL = "https://ecommerce-backend-1hic.onrender.com/api";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || DEFAULT_API_URL,
});

// Attach the admin JWT to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the backend rejects our token (expired or invalid), clear it and go back to login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
