import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-neutral-950">
        <p className="text-sm text-neutral-400 dark:text-neutral-500">Loading…</p>
      </div>
    );
  }

  if (!user) {
    const next = encodeURIComponent(location.pathname);
    return <Navigate to={`/signin?next=${next}`} replace />;
  }

  return <>{children}</>;
}
