import { useState } from "react";
import { Link } from "react-router-dom";
import { Link2, Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { apiRequest } from "../api/client";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: trimmedEmail }),
      });

      setSuccess(true);
    } catch (err) {
      setError(err.message || "Unable to process your request. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500">
            <Link2 size={24} />
          </div>

          <span className="text-2xl font-bold tracking-tight">LinkFlow</span>
        </Link>

        <div className="rounded-2xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
          {success ? (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <CheckCircle size={30} />
              </div>

              <h1 className="mt-5 text-2xl font-bold">
                Check your email
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                If an account exists for{" "}
                <span className="font-medium text-slate-200">{email}</span>,
                you should receive instructions to reset your password.
              </p>

              <Link
                to="/login"
                className="mt-7 flex w-full items-center justify-center rounded-lg bg-indigo-500 px-4 py-3 text-sm font-semibold transition hover:bg-indigo-400"
              >
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold">Forgot your password?</h1>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Enter your registered email address and we'll send you
                instructions to reset your password.
              </p>

              {error && (
                <div
                  role="alert"
                  className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    Email address
                  </label>

                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />

                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      className="w-full rounded-lg border border-white/10 bg-slate-950 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-3 text-sm font-semibold transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading && (
                    <Loader2 size={18} className="animate-spin" />
                  )}

                  {loading ? "Sending..." : "Send reset instructions"}
                </button>
              </form>

              <Link
                to="/login"
                className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400 transition hover:text-white"
              >
                <ArrowLeft size={16} />
                Back to login
              </Link>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Secure link management, all in one place.
        </p>
      </div>
    </div>
  );
}