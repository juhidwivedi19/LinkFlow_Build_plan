
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Dashboard from "./Dashboard";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import CheckEmail from "./pages/CheckEmail";

import ProtectedRoute from "./components/ProtectedRoute";
import WorkspaceSettings from "./pages/WorkspaceSettings";
import WorkspaceLinks from "./pages/WorkspaceLinks";
import CreateLink from "./pages/CreateLink";
import EditLink from "./pages/EditLink";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public authentication routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/check-email" element={<CheckEmail />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected application routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
        
        <Route
  path="/workspaces/:workspaceId/settings"
  element={<WorkspaceSettings />}
/>

<Route
  path="/workspaces/:workspaceId/links"
  element={<WorkspaceLinks />}
/>

<Route
  path="/workspaces/:workspaceId/links/create"
  element={<CreateLink />}
/>

<Route
  path="/workspaces/:workspaceId/links/:linkId"
  element={<EditLink />}
/>

</Route>

        {/* Default route */}
        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        {/* Unknown routes */}
        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />

        
      </Routes>
    </BrowserRouter>
  );
}

