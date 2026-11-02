
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Mail, CheckCircle2, LoaderCircle, ArrowLeft } from "lucide-react";
import { resendVerificationEmail } from "../api/auth.api";

export default function CheckEmail() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email")?.trim() || "";

  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleResendVerification() {
    if (!email || resending) return;

    setResending(true);
    setMessage("");
    setError("");

    try {
     
    await resendVerificationEmail(email);

      setMessage("If your account requires verification, a new email has been requested.");
    } catch (err) {
      setError(
        err.message || "Unable to request another verification email. Please try again."
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8 text-white">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
          <Mail size={32} className="text-blue-400" />
        </div>

        <h1 className="mt-6 text-2xl font-bold">
          Check your email
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          Your registration request was submitted. Check your inbox
          for the verification email and follow its instructions to
          activate your account.
        </p>

        {email && (
          <p className="mt-4 break-all font-medium text-blue-400">
            {email}
          </p>
        )}

        <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-left">
          <p className="text-sm font-medium text-slate-200">
            What should you do next?
          </p>

          <ul className="mt-2 space-y-2 text-sm leading-5 text-slate-400">
            <li>1. Open your email inbox.</li>
            <li>2. Find the LinkFlow verification message.</li>
            <li>3. Click the verification link in that message.</li>
            <li>4. Return to LinkFlow and sign in.</li>
          </ul>
        </div>

        {message && (
          <div
            role="status"
            className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-left text-sm text-emerald-300"
          >
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <p>{message}</p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-left text-sm text-red-300"
          >
            {error}
          </div>
        )}

        {email && (
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resending}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resending ? (
              <>
                <LoaderCircle size={17} className="animate-spin" />
                Requesting email...
              </>
            ) : (
              "Resend verification email"
            )}
          </button>
        )}

        <p className="mt-4 text-sm text-slate-400">
          Can't find the message? Check your spam or junk folder.
        </p>

        <Link
          to="/login"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-500"
        >
          <ArrowLeft size={17} />
          Back to login
        </Link>
      </section>
    </main>
  );
}

