import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth, ApiError } from "../context/AuthContext";
import { SECURITY_QUESTIONS } from "../data/securityQuestions";

export function SignUp() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signUp(name, email, password, securityQuestion, securityAnswer);
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
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Create your account</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Save favourites, addresses, and track your orders.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <Field label="Name">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-800 dark:text-neutral-100 dark:focus:border-neutral-600"
              placeholder="Charlie Njoroge"
            />
          </Field>
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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-800 dark:text-neutral-100 dark:focus:border-neutral-600"
              placeholder="At least 8 characters"
            />
          </Field>
          <Field label="Security question">
            <select
              required
              value={securityQuestion}
              onChange={(e) => setSecurityQuestion(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-800 dark:text-neutral-100 dark:focus:border-neutral-600"
            >
              {SECURITY_QUESTIONS.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Answer">
            <input
              type="text"
              required
              minLength={2}
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-800 dark:text-neutral-100 dark:focus:border-neutral-600"
              placeholder="Used to reset your password"
            />
          </Field>

          {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-full bg-neutral-900 py-4 text-sm font-semibold text-white transition disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
          >
            {submitting ? "Creating account…" : "Sign Up"}
          </motion.button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Already have an account?{" "}
          <Link to="/signin" className="font-semibold text-neutral-900 underline dark:text-neutral-100">
            Sign in
          </Link>
        </p>
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
