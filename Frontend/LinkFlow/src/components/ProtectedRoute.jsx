
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Link2 } from "lucide-react";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  // Wait until authentication status is determined
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/20">
            <Link2 size={30} className="text-white" />
          </div>

          <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />

          <div className="text-center">
            <p className="text-sm font-medium text-white">
              Loading your workspace
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Checking your authentication...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect unauthenticated users to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Allow authenticated users to access protected routes
  return <Outlet />;
}

