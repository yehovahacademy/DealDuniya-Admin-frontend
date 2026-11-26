import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { BarChart3, Eye, EyeOff, Package, ShieldCheck, ShoppingBag } from "lucide-react";
import Logo from "../components/Logo";
import { supabase } from "../config/supabase";
import { useAuth } from "../hooks/useAuth";

const features = [
  { icon: Package, text: "Manage products, categories and inventory" },
  { icon: ShoppingBag, text: "Track and fulfil customer orders" },
  { icon: BarChart3, text: "See sales and store performance at a glance" },
];

const inputClass =
  "mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none";

// "password" = account in our own database, "supabase" = Supabase Auth account.
const methods = [
  { id: "password", label: "Password" },
  { id: "supabase", label: "Supabase" },
];

export default function Login() {
  const { login, supabaseLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [method, setMethod] = useState("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/";

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  // Runs one sign-in attempt; on success go where the user was heading.
  const attempt = async (signIn) => {
    setError("");
    setLoading(true);
    try {
      await signIn();
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed. Please try again.");
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const signIn = method === "supabase" ? supabaseLogin : login;
    attempt(() => signIn(email.trim(), password));
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
          <p className="mt-2 text-gray-500">Sign in with your admin account to continue.</p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            {supabase && (
              <div className="grid grid-cols-2 gap-1 rounded-full bg-gray-100 p-1 text-sm font-medium">
                {methods.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setMethod(id);
                      setError("");
                    }}
                    className={`rounded-full px-3 py-1.5 ${
                      method === id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 mt-1.5 flex items-center px-3 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              {loading ? "Signing in…" : method === "supabase" ? "Sign in with Supabase" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <ShieldCheck className="h-4 w-4" />
            Access is restricted to authorised administrators.
          </p>
        </div>
      </main>
    </div>
  );
}
