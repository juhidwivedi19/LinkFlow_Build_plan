import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Link2, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { apiRequest } from "../api/client";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function verifyEmail() {
      if (!token) {
        setStatus("error");
        setMessage("The verification link is missing its token.");
        return;
      }

      try {
        // Your backend route is POST /api/auth/emailverification.
        await apiRequest("/api/auth/emailverification", {
          method: "POST",
          body: JSON.stringify({ token }),
        });

        if (!cancelled) {
          setStatus("success");
          setMessage("Your email has been verified successfully.");
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setMessage(
            err.message || "This verification link is invalid or has expired."
          );
        }
      }
    }

    verifyEmail();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500">
            <Link2 size={24} />
          </div>
          <span className="text-2xl font-bold tracking-tight">LinkFlow</span>
        </Link>

        <div className="rounded-2xl border border-white/10 bg-slate-900 p-8 text-center shadow-2xl">
          {status === "loading" && (
            <>
              <Loader2
                size={42}
                className="mx-auto animate-spin text-indigo-400"
              />
              <h1 className="mt-5 text-2xl font-bold">Verifying your email</h1>
              <p className="mt-2 text-sm text-slate-400">
                Please wait while we verify your email address.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle
                size={42}
                className="mx-auto text-emerald-400"
              />
              <h1 className="mt-5 text-2xl font-bold">Email verified!</h1>
              <p className="mt-2 text-sm text-slate-400">{message}</p>

              <Link
                to="/login"
                className="mt-7 flex w-full justify-center rounded-lg bg-indigo-500 px-4 py-3 text-sm font-semibold transition hover:bg-indigo-400"
              >
                Continue to login
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle size={42} className="mx-auto text-red-400" />
              <h1 className="mt-5 text-2xl font-bold">
                Verification unsuccessful
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {message}
              </p>

              <Link
                to="/login"
                className="mt-7 flex w-full justify-center rounded-lg bg-indigo-500 px-4 py-3 text-sm font-semibold transition hover:bg-indigo-400"
              >
                Back to login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}