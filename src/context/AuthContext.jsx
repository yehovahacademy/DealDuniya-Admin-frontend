import { createContext, useCallback, useState } from "react";
import { supabase } from "../config/supabase";
import { loginWithPassword, loginWithSupabase } from "../services/authService";
import { TOKEN_KEY, USER_KEY } from "../services/api";

export const AuthContext = createContext(null);

// Two ways in, all ending with our backend's JWT kept in localStorage:
//  - "password": email + password checked by our backend.
//  - "supabase": Supabase email + password -> Supabase access token -> our backend.
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

  const startSession = (data, provider) => {
    const user = { ...data.user, provider };
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setSession({ token: data.token, user });
    return user;
  };

  const login = async (email, password) => startSession(await loginWithPassword(email, password), "password");

  const supabaseLogin = async (email, password) => {
    if (!supabase) throw new Error("Supabase sign-in isn't configured.");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    try {
      return startSession(await loginWithSupabase(data.session.access_token), "supabase");
    } catch (err) {
      // The backend refused this account (e.g. not an admin): don't leave a Supabase session behind.
      await supabase.auth.signOut();
      throw err;
    }
  };

  const logout = useCallback(() => {
    if (session.user?.provider === "supabase") supabase?.auth.signOut();
    clearSession();
    setSession({ token: null, user: null });
  }, [session.user?.provider]);

  const value = {
    user: session.user,
    token: session.token,
    isAuthenticated: Boolean(session.token) && session.user?.role === "ADMIN",
    login,
    supabaseLogin,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
