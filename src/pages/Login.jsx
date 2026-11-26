import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { BarChart3, Package, ShieldCheck, ShoppingBag } from "lucide-react";
import Logo from "../components/Logo";
import { useAuth } from "../hooks/useAuth";

const features = [
  { icon: Package, text: "Manage products, categories and inventory" },
  { icon: ShoppingBag, text: "Track and fulfil customer orders" },
  { icon: BarChart3, text: "See sales and store performance at a glance" },
];

export default function Login() {
  const { user, login, keycloakLogin, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/";

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  // Signed in to Keycloak, but the account doesn't carry the ADMIN realm role.
  const keycloakNotAdmin = user?.provider === "keycloak";

  const handleKeycloak = () => {
    setError("");
    setLoading(true);
    keycloakLogin(from).catch(() => {
      setLoading(false);
      setError("Couldn't reach the login server. Please try again.");
    });
  };

  const handleSuccess = async ({ credential }) => {
    setError("");
    setLoading(true);
    try {
      await login(credential);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Brand panel (hidden on small screens) */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-navy-800 p-12 text-white lg:flex">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand-500/25 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-[#5B2F7E]/40 blur-3xl" />

        <div className="relative">
          <Logo size={32} light badge="Admin" />
        </div>

        <div className="relative">
          <h2 className="text-5xl leading-[1.05] font-semibold tracking-tight">
            Run your store
            <br />
            from <span className="text-brand-400">one place.</span>
          </h2>
          <ul className="mt-8 space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-white/80">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                  <Icon className="h-5 w-5" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-white/50">
          © {new Date().getFullYear()} DealDuniya · Best deals. Whole world.
        </p>
      </aside>

      {/* Sign-in panel */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo size={30} badge="Admin" />
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Welcome back</h1>
          <p className="mt-2 text-gray-500">Sign in with your admin Google account to continue.</p>

          <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex min-h-11 justify-center">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
                  Signing in…
                </div>
              ) : (
                <GoogleLogin
                  onSuccess={handleSuccess}
                  onError={() => setError("Google sign-in failed. Please try again.")}
                  size="large"
                  width="300"
                  text="signin_with"
                  shape="pill"
                />
              )}
            </div>

            <div className="my-5 flex items-center gap-3 text-xs text-gray-400">
              <span className="h-px flex-1 bg-gray-200" />
              or
              <span className="h-px flex-1 bg-gray-200" />
            </div>

            {keycloakNotAdmin ? (
              <div className="space-y-3 text-center">
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  You're signed in to Keycloak as <b>{user.email}</b>, but this account doesn't have the ADMIN role.
                </p>
                <button
                  type="button"
                  onClick={logout}
                  className="w-full rounded-full border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Sign out of Keycloak
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleKeycloak}
                disabled={loading}
                className="w-full rounded-full border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-100 disabled:opacity-60"
              >
                Continue with Keycloak
              </button>
            )}

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700">
                {error}
              </p>
            )}
          </div>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <ShieldCheck className="h-4 w-4" />
            Access is restricted to authorised administrators.
          </p>
        </div>
      </main>
    </div>
  );
}
