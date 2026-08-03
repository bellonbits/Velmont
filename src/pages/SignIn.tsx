import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth, ApiError } from "../context/AuthContext";

export function SignIn() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate(params.get("next") || "/home");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-neutral-950">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6"
      >
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Welcome back</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Sign in to continue to Velmont.</p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <Field label="Email">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-800 dark:text-neutral-100 dark:focus:border-neutral-600"
              placeholder="you@example.com"
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-800 dark:text-neutral-100 dark:focus:border-neutral-600"
              placeholder="••••••••"
            />
          </Field>
          <Link
            to="/forgot-password"
            className="-mt-2 self-end text-xs font-medium text-neutral-500 underline dark:text-neutral-400"
          >
            Forgot password?
          </Link>

          {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-full bg-neutral-900 py-4 text-sm font-semibold text-white transition disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
          >
            {submitting ? "Signing in…" : "Sign In"}
          </motion.button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Don't have an account?{" "}
          <Link to="/signup" className="font-semibold text-neutral-900 underline dark:text-neutral-100">
            Sign up
          </Link>
        </p>
        <Link to="/home" className="mt-4 block text-center text-xs text-neutral-400 dark:text-neutral-500">
          Continue browsing without an account
        </Link>
      </motion.div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {label}
      </span>
      {children}
    </label>
  );
}
