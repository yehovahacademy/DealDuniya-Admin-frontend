import Keycloak from "keycloak-js";

// One shared keycloak-js instance for the admin panel (client: VITE_KEYCLOAK_CLIENT_ID).
// It is initialised once in main.jsx before the app renders.
const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
});

export default keycloak;
