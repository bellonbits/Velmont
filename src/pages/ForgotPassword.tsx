import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api, ApiError } from "../lib/api";

export function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFindAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.post<{ question: string }>("/auth/security-question", { email });
      setQuestion(res.question);
      setStep("reset");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/auth/reset-password", { email, answer, newPassword });
      navigate("/signin");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6"
      >
        <h1 className="text-2xl font-semibold text-neutral-900">Reset your password</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {step === "email"
            ? "Enter your account email to continue."
            : "Answer your security question to set a new password."}
        </p>

        {step === "email" ? (
          <form onSubmit={handleFindAccount} className="mt-8 flex flex-col gap-4">
            <Field label="Email">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-400"
                placeholder="you@example.com"
              />
            </Field>

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-full bg-neutral-900 py-4 text-sm font-semibold text-white transition disabled:opacity-50"
            >
              {submitting ? "Checking…" : "Continue"}
            </motion.button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="mt-8 flex flex-col gap-4">
            <Field label="Security question">
              <p className="text-sm text-neutral-700">{question}</p>
            </Field>
            <Field label="Answer">
              <input
                type="text"
                required
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-400"
              />
            </Field>
            <Field label="New password">
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-400"
                placeholder="At least 8 characters"
              />
            </Field>

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-full bg-neutral-900 py-4 text-sm font-semibold text-white transition disabled:opacity-50"
            >
              {submitting ? "Resetting…" : "Reset password"}
            </motion.button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-neutral-500">
          <Link to="/signin" className="font-semibold text-neutral-900 underline">
            Back to sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </span>
      {children}
    </label>
  );
}
