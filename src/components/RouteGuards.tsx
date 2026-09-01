import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ROUTES } from "../domain";
import { useApp } from "../app/AppContext";
import { LoadingView } from "./Status";

export function RequireAuth() {
  const { session, authLoading, dataLoading, bundle } = useApp();
  const location = useLocation();
  if (authLoading) return <LoadingView label="Opening your team..." />;
  if (!session) return <Navigate to={ROUTES.signIn} replace state={{ from: location.pathname }} />;
  if (!session.profile.onboardingComplete && session.membership.role === "athlete" && location.pathname !== ROUTES.onboarding) {
    return <Navigate to={ROUTES.onboarding} replace />;
  }
  if (dataLoading && !bundle) return <LoadingView />;
  return <Outlet />;
}

export function RequireAthlete() {
  const { session } = useApp();
  if (!session) return null;
  if (session.membership.role !== "athlete") return <Navigate to={ROUTES.coach} replace />;
  return <Outlet />;
}

export function RequireCoach() {
  const { session } = useApp();
  if (!session) return null;
  if (!["coach", "admin"].includes(session.membership.role)) return <Navigate to={ROUTES.today} replace />;
  return <Outlet />;
}

export function RequireAdmin() {
  const { session } = useApp();
  if (!session) return null;
  if (session.membership.role !== "admin") return <Navigate to={ROUTES.coach} replace />;
  return <Outlet />;
}
