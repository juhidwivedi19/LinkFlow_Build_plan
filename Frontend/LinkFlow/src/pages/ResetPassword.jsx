import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Link2,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { apiRequest } from "../api/client";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") || "";

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("The password reset link is missing its token.");
      return;
    }

    if (!formData.password || !formData.confirmPassword) {
      setError("Please complete both password fields.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await apiRequest("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      });

      setSuccess(true);
    } catch (err) {
      setError(
        err.message || "Unable to reset your password. Request a new reset link."
      );
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
                Password reset successful
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Your password has been updated. You can now log in using your
                new password.
              </p>

              <button
                type="button"
                onClick={() => navigate("/login", { replace: true })}
                className="mt-7 w-full rounded-lg bg-indigo-500 px-4 py-3 text-sm font-semibold transition hover:bg-indigo-400"
              >
                Go to login
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold">Reset your password</h1>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Choose a new password for your LinkFlow account.
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
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    New password
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Enter your new password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={8}
                      className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((previous) => !previous)
                      }
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    Use at least 8 characters.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    Confirm new password
                  </label>

                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Re-enter your new password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      minLength={8}
                      className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((previous) => !previous)
                      }
                      aria-label={
                        showConfirmPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-3 text-sm font-semibold transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading && (
                    <Loader2 size={18} className="animate-spin" />
                  )}

                  {loading ? "Resetting password..." : "Reset password"}
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