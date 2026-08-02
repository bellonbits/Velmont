import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-neutral-400">Loading…</p>
      </div>
    );
  }

  if (!user) {
    const next = encodeURIComponent(location.pathname);
    return <Navigate to={`/signin?next=${next}`} replace />;
  }

  if (!user.isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
