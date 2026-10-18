import { Navigate, Outlet, useLocation } from "react-router";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { useAuth } from "../auth-context";

/** Renders child routes only for signed-in users; otherwise sends them to /login and back after. */
export function ProtectedRoute() {
  const { state } = useAuth();
  const location = useLocation();

  if (state.status === "loading") return <FullPageSpinner />;
  if (state.status === "anonymous") {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}

/** For /login and /register: signed-in users go straight into the app. */
export function PublicOnlyRoute() {
  const { state } = useAuth();
  if (state.status === "loading") return <FullPageSpinner />;
  if (state.status === "authenticated") return <Navigate to="/" replace />;
  return <Outlet />;
}
