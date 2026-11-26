import { createContext, useCallback, useState } from "react";
import { loginWithPassword } from "../services/authService";
import { TOKEN_KEY, USER_KEY } from "../services/api";

export const AuthContext = createContext(null);

// Email + password -> our backend -> our JWT, kept in localStorage.
// The user object is for the UI only. The backend verifies the real token on every request.

// Reads the `exp` claim from the JWT so expired sessions aren't restored.
function isTokenValid(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function loadSession() {
  const token = localStorage.getItem(TOKEN_KEY);
  const storedUser = localStorage.getItem(USER_KEY);

  if (token && storedUser && isTokenValid(token)) {
    try {
      return { token, user: JSON.parse(storedUser) };
    } catch {
      // fall through to clear a corrupted session
    }
  }

  clearSession();
  return { token: null, user: null };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession);

  const login = async (email, password) => {
    const data = await loginWithPassword(email, password);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setSession({ token: data.token, user: data.user });
    return data.user;
  };

  const logout = useCallback(() => {
    clearSession();
    setSession({ token: null, user: null });
  }, []);

  const value = {
    user: session.user,
    token: session.token,
    isAuthenticated: Boolean(session.token) && session.user?.role === "ADMIN",
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
