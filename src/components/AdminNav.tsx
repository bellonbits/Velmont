import { NavLink, Link } from "react-router-dom";

export function AdminNav() {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 md:px-8">
        <Link to="/admin" className="text-lg font-semibold tracking-tight text-neutral-900">
          Velmont Admin
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) => (isActive ? "text-neutral-900" : "text-neutral-500")}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/inventory"
            className={({ isActive }) => (isActive ? "text-neutral-900" : "text-neutral-500")}
          >
            Inventory
          </NavLink>
          <Link to="/home" className="text-neutral-400">
            Back to store
          </Link>
        </nav>
      </div>
    </header>
  );
}
