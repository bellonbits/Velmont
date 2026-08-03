import { Link, NavLink } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { ThemeToggle } from "./ThemeToggle";

const items = [
  { to: "/home", label: "Home", icon: HomeIcon },
  { to: "/favourites", label: "Favourites", icon: HeartIcon },
  { to: "/stores", label: "Stores", icon: PinIcon },
  { to: "/cart", label: "Cart", icon: BagIcon, showBadge: true },
  { to: "/chat", label: "Chat", icon: ChatIcon },
];

export function BottomNav() {
  return (
    <>
      <ThemeToggle className="fixed right-4 top-4 z-20 bg-white/90 backdrop-blur dark:bg-neutral-950/90 md:hidden" />
      <MobileTabBar />
      <DesktopHeader />
    </>
  );
}

function MobileTabBar() {
  const { itemCount } = useCart();

  return (
    <nav className="sticky bottom-0 z-20 border-t border-neutral-200 bg-white/95 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95 md:hidden">
      <ul className="mx-auto flex max-w-md items-center justify-between">
        {items.map(({ to, label, icon: Icon, showBadge }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-1 px-3 py-1 text-[11px] font-medium ${
                  isActive ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-400 dark:text-neutral-500"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icon active={isActive} />
                    {showBadge && itemCount > 0 && (
                      <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-700 px-1 text-[9px] font-semibold text-white">
                        {itemCount}
                      </span>
                    )}
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function DesktopHeader() {
  const { itemCount } = useCart();
  const { user } = useAuth();

  return (
    <header className="fixed inset-x-0 top-0 z-20 hidden border-b border-neutral-200 bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95 md:block">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-8 py-4">
        <Link to="/home" className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Velmont
        </Link>

        <ul className="flex items-center gap-8">
          {items.map(({ to, label, icon: Icon, showBadge }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `relative flex items-center gap-2 text-sm font-medium transition ${
                    isActive
                      ? "text-neutral-900 dark:text-neutral-100"
                      : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="relative">
                      <Icon active={isActive} />
                      {showBadge && itemCount > 0 && (
                        <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-700 px-1 text-[9px] font-semibold text-white">
                          {itemCount}
                        </span>
                      )}
                    </span>
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            to={user ? "/account" : "/signin"}
            className="flex items-center gap-2 rounded-full border border-neutral-200 py-1.5 pl-1.5 pr-4 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 dark:border-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-600"
          >
            <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-neutral-200 text-xs font-semibold text-neutral-500 dark:bg-neutral-700 dark:text-neutral-300">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                user?.name?.[0]?.toUpperCase() ?? <PersonIcon />
              )}
            </span>
            {user ? user.name.split(" ")[0] : "Sign in"}
          </Link>
        </div>
      </div>
    </header>
  );
}

function PersonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" strokeLinecap="round" />
    </svg>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}>
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 10v9.5a1 1 0 0 0 1 1H17.5a1 1 0 0 0 1-1V10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.6}>
      <path d="M12 20s-7-4.35-9.5-8.6C.9 8.1 2.2 4.5 5.7 4A4.9 4.9 0 0 1 12 7a4.9 4.9 0 0 1 6.3-3c3.5.5 4.8 4.1 3.2 7.4C19 15.65 12 20 12 20Z" strokeLinejoin="round" />
    </svg>
  );
}

function PinIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}>
      <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" strokeLinejoin="round" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function BagIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}>
      <path d="M6 8h12l1 12.5a1 1 0 0 1-1 1.5H6a1 1 0 0 1-1-1.5L6 8Z" strokeLinejoin="round" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" strokeLinecap="round" />
    </svg>
  );
}

function ChatIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}>
      <path
        d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8c-1.1 0-2.1-.2-3-.6L4 20l1.1-4.4A7.9 7.9 0 0 1 4 12Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
