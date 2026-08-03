import { NavLink, Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";

export function AdminNav() {
  return (
    <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 md:px-8">
        <Link to="/admin" className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Velmont Admin
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              isActive ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-500 dark:text-neutral-400"
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/inventory"
            className={({ isActive }) =>
              isActive ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-500 dark:text-neutral-400"
            }
          >
            Inventory
          </NavLink>
          <Link to="/home" className="text-neutral-400 dark:text-neutral-500">
            Back to store
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
