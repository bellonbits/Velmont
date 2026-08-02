import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { useProducts } from "../../context/ProductsContext";
import { getStockStatus } from "../../lib/stock";
import { brands } from "../../data/brands";
import { AdminNav } from "../../components/AdminNav";

interface VisitorStats {
  totalViews: number;
  uniqueVisitors: number;
  last24h: { views: number; visitors: number };
  daily: { day: string; views: number; visitors: number }[];
  topPages: { path: string; views: number }[];
  recent: { path: string; createdAt: string; userName: string | null }[];
}

export function AdminDashboard() {
  const { products } = useProducts();
  const [stats, setStats] = useState<VisitorStats | null>(null);

  useEffect(() => {
    api.get<VisitorStats>("/admin/visitors").then(setStats);
  }, []);

  const outOfStock = products.filter((p) => getStockStatus(p.stockQuantity) === "out-of-stock");
  const lowStock = products.filter((p) => getStockStatus(p.stockQuantity) === "low-stock");
  const maxDailyViews = Math.max(1, ...(stats?.daily.map((d) => d.views) ?? [1]));

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <AdminNav />
      <div className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16 pt-8 md:px-8">
        <h1 className="text-2xl font-semibold text-neutral-900 md:text-3xl">Dashboard</h1>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile label="Total page views" value={stats?.totalViews ?? "—"} />
          <StatTile label="Unique visitors" value={stats?.uniqueVisitors ?? "—"} />
          <StatTile label="Views, last 24h" value={stats?.last24h.views ?? "—"} />
          <StatTile label="Visitors, last 24h" value={stats?.last24h.visitors ?? "—"} />
        </div>

        {(outOfStock.length > 0 || lowStock.length > 0) && (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">Stock alerts</p>
            <div className="mt-2 flex flex-col gap-1.5">
              {outOfStock.map((p) => (
                <Link
                  key={p.id}
                  to="/admin/inventory"
                  className="flex items-center justify-between text-sm text-amber-900"
                >
                  <span>{p.name}</span>
                  <span className="font-semibold text-rose-600">Out of stock</span>
                </Link>
              ))}
              {lowStock.map((p) => (
                <Link
                  key={p.id}
                  to="/admin/inventory"
                  className="flex items-center justify-between text-sm text-amber-900"
                >
                  <span>{p.name}</span>
                  <span className="font-semibold">Only {p.stockQuantity} left</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
            Visits, last {stats?.daily.length ?? 0} days
          </h2>
          <div className="mt-3 flex h-32 items-end gap-1.5 rounded-2xl border border-neutral-200 p-4">
            {stats?.daily.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-neutral-900"
                  style={{ height: `${Math.max(4, (d.views / maxDailyViews) * 80)}px` }}
                  title={`${d.day}: ${d.views} views`}
                />
              </div>
            ))}
            {!stats && <p className="text-xs text-neutral-400">Loading…</p>}
            {stats && stats.daily.length === 0 && (
              <p className="text-xs text-neutral-400">No visits recorded yet.</p>
            )}
          </div>
        </section>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
              Top pages
            </h2>
            <div className="mt-3 flex flex-col gap-2">
              {stats?.topPages.map((p) => (
                <div key={p.path} className="flex items-center justify-between text-sm">
                  <span className="text-neutral-700">{p.path}</span>
                  <span className="font-semibold text-neutral-900">{p.views}</span>
                </div>
              ))}
              {stats && stats.topPages.length === 0 && (
                <p className="text-sm text-neutral-400">No data yet.</p>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
              Recent activity
            </h2>
            <div className="mt-3 flex flex-col gap-2">
              {stats?.recent.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-neutral-700">
                    {r.userName ?? "Guest"} viewed {r.path}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {new Date(r.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
              {stats && stats.recent.length === 0 && (
                <p className="text-sm text-neutral-400">No activity yet.</p>
              )}
            </div>
          </section>
        </div>

        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
            Catalog
          </h2>
          <p className="mt-2 text-sm text-neutral-500">
            {products.length} watches across {brands.length} brands · {outOfStock.length} out of
            stock · {lowStock.length} low stock
          </p>
        </section>
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-neutral-200 p-4">
      <p className="text-xs text-neutral-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-neutral-900">{value}</p>
    </div>
  );
}
