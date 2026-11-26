import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import DataTable from "../components/DataTable";
import { getCustomers } from "../services/customerService";
import { formatDate, getErrorMessage } from "../utils/format";

function Avatar({ customer }) {
  const [broken, setBroken] = useState(false);
  const initials = (customer.name || customer.email || "?")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (customer.avatarUrl && !broken) {
    return (
      <img
        src={customer.avatarUrl}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className="h-9 w-9 rounded-full object-cover"
      />
    );
  }
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600">
      {initials}
    </span>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    getCustomers()
      .then((list) => setCustomers([...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))))
      .catch((err) => setError(getErrorMessage(err, "Couldn't load customers.")))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter(
      (c) => c.name?.toLowerCase().includes(term) || c.email?.toLowerCase().includes(term)
    );
  }, [customers, search]);

  const columns = [
    {
      key: "name",
      header: "Customer",
      render: (c) => (
        <div className="flex items-center gap-3">
          <Avatar customer={c} />
          <p className="font-medium text-gray-900">{c.name || "—"}</p>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (c) => (
        <a href={`mailto:${c.email}`} className="text-gray-600 hover:text-brand-600">
          {c.email}
        </a>
      ),
    },
    {
      key: "createdAt",
      header: "Joined",
      render: (c) => <span className="text-gray-500">{formatDate(c.createdAt)}</span>,
    },
  ];

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
        <p className="mt-1 text-sm text-gray-500">View registered customers.</p>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 p-4">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              className="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-9 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
            />
          </div>
          {!loading && !error && (
            <p className="hidden text-sm text-gray-500 sm:block">
              {filtered.length} of {customers.length} customers
            </p>
          )}
        </div>

        {error ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-medium text-red-600">{error}</p>
            <p className="mt-1 text-xs text-gray-400">
              Check that the backend is running and GET /api/admin/customers is mounted.
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            loading={loading}
            emptyMessage={search ? "No customers match your search." : "No customers have signed up yet."}
          />
        )}
      </div>
    </div>
  );
}
