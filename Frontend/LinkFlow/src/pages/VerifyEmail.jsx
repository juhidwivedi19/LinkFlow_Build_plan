
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Link2,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { apiRequest } from "../api/client";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState(
    "Please wait while we verify your email."
  );

  useEffect(() => {
    let cancelled = false;

    async function verifyEmail() {
      if (!token) {
        setStatus("error");
        setMessage(
          "The verification token is missing. Please open the verification link from your email."
        );
        return;
      }

      try {
        const response = await apiRequest(
          "/api/auth/emailverification",
          {
            method: "POST",
            body: JSON.stringify({
              verificationToken: token,
            }),
          }
        );

        if (!cancelled) {
          setStatus("success");
          setMessage(
            response?.message ||
              "Your email has been verified successfully. You can now sign in."
          );
        }
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          setMessage(
            error.message ||
              "Email verification failed. The link may be invalid or expired."
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
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8 text-white">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-xl">
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-3 text-2xl font-bold tracking-tight"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600">
            <Link2 size={26} />
          </span>

          <span>
            Link<span className="text-blue-500">Flow</span>
          </span>
        </Link>

        <div className="mt-8">
          {status === "loading" && (
            <Loader2
              size={48}
              className="mx-auto animate-spin text-blue-400"
            />
          )}

          {status === "success" && (
            <CheckCircle
              size={48}
              className="mx-auto text-green-400"
            />
          )}

          {status === "error" && (
            <XCircle
              size={48}
              className="mx-auto text-red-400"
            />
          )}
        </div>

        <h1 className="mt-6 text-2xl font-bold">
          {status === "loading" && "Verifying your email"}
          {status === "success" && "Email verified successfully"}
          {status === "error" && "Verification unsuccessful"}
        </h1>

        <p
          role={status === "error" ? "alert" : "status"}
          className="mt-3 break-words text-sm leading-6 text-slate-400"
        >
          {message}
        </p>

        {status !== "loading" && (
          <Link
            to="/login"
            className="mt-6 inline-block w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold transition hover:bg-indigo-500"
          >
            {status === "success"
              ? "Continue to login"
              : "Back to login"}
          </Link>
        )}
      </section>
    </main>
  );
}

