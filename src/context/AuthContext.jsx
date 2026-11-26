import { createContext, useCallback, useEffect, useState } from "react";
import { googleLogout } from "@react-oauth/google";
import keycloak from "../config/keycloak";
import { loginWithGoogle } from "../services/authService";
import { TOKEN_KEY, USER_KEY } from "../services/api";

export const AuthContext = createContext(null);

// Two ways in, side by side:
//  - "google":   Google ID token -> our backend -> our JWT, kept in localStorage (unchanged).
//  - "keycloak": Authorization Code + PKCE via keycloak-js; tokens stay in keycloak-js memory only.
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

// Builds the session from the Keycloak access token (keycloak.init ran in main.jsx).
// Roles come from the realm roles in `realm_access.roles`.
function keycloakSession() {
  const t = keycloak.tokenParsed;
  if (!keycloak.authenticated || !t) return null;
  const roles = t.realm_access?.roles || [];
  return {
    token: null, // never copied out of keycloak-js; api.js reads keycloak.token directly
    user: {
      id: t.sub,
      name: t.name || t.preferred_username,
      email: t.email || t.preferred_username,
      role: roles.includes("ADMIN") ? "ADMIN" : roles.includes("USER") ? "USER" : null,
      provider: "keycloak",
    },
  };
}

function loadGoogleSession() {
  const token = localStorage.getItem(TOKEN_KEY);
  const storedUser = localStorage.getItem(USER_KEY);

  if (token && storedUser && isTokenValid(token)) {
    try {
      return { token, user: { ...JSON.parse(storedUser), provider: "google" } };
    } catch {
      // fall through to clear a corrupted session
    }
  }

  clearSession();
  return { token: null, user: null };
}

// A Keycloak session wins over a stored Google one.
const loadSession = () => keycloakSession() || loadGoogleSession();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession);

  const login = async (credential) => {
    const data = await loginWithGoogle(credential);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setSession({ token: data.token, user: { ...data.user, provider: "google" } });
    return data.user;
  };

  // Starts Authorization Code + PKCE: full-page redirect to Keycloak's login page,
  // then back to `path` (must match the client's Valid redirect URIs).
  const keycloakLogin = useCallback((path = "/") => {
    clearSession(); // don't keep a Google session around as well
    return keycloak.login({ redirectUri: window.location.origin + path });
  }, []);

  const logout = useCallback(() => {
    if (keycloak.authenticated) {
      // Ends the Keycloak SSO session too, then Keycloak sends the browser back to /login.
      keycloak.logout({ redirectUri: window.location.origin + "/login" });
      return;
    }
    googleLogout();
    clearSession();
    setSession({ token: null, user: null });
  }, []);

  // Keycloak session handling: refresh the access token when it expires;
  // if that fails (session ended in Keycloak), sign out locally.
  useEffect(() => {
    if (!keycloak.authenticated) return;
    keycloak.onTokenExpired = () => {
      keycloak
        .updateToken(30)
        .then(() => setSession(keycloakSession()))
        .catch(() => {
          keycloak.clearToken();
          setSession({ token: null, user: null });
        });
    };
    keycloak.onAuthLogout = () => setSession({ token: null, user: null });
    return () => {
      keycloak.onTokenExpired = undefined;
      keycloak.onAuthLogout = undefined;
    };
  }, []);

  const signedIn = session.user?.provider === "keycloak" ? keycloak.authenticated : Boolean(session.token);

  const value = {
    user: session.user,
    token: session.token,
    isAuthenticated: signedIn && session.user?.role === "ADMIN",
    login,
    keycloakLogin,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
