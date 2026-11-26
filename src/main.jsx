import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./context/AuthContext";
import keycloak from "./config/keycloak";
import App from "./App";
import "./index.css";

const root = createRoot(document.getElementById("root"));

// Ask Keycloak whether there is already a session (Authorization Code + PKCE S256)
// before rendering any protected route. "check-sso" never forces a login,
// so Google sign-in keeps working alongside it.
keycloak
  .init({
    onLoad: "check-sso",
    checkLoginIframe: false,
    pkceMethod: "S256",
  })
  .then(() => {
    root.render(
      <StrictMode>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </GoogleOAuthProvider>
      </StrictMode>
    );
  })
  .catch((error) => {
    console.error("Keycloak initialization failed:", error);
    root.render(
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-gray-600">
        Authentication service could not be initialized. Please refresh the page.
      </div>
    );
  });
