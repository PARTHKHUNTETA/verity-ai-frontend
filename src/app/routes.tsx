import { Navigate, type RouteObject } from "react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute, PublicOnlyRoute } from "@/features/auth/components/RouteGuards";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { EvaluationsPage } from "@/features/evaluations/EvaluationsPage";
import { OrganizationPage } from "@/features/organization/OrganizationPage";
import { ReportsPage } from "@/features/reports/ReportsPage";
import { ResearchPage } from "@/features/research/ResearchPage";
import { RunPage } from "@/features/research/RunPage";
import { SourcesPage } from "@/features/sources/SourcesPage";
import { NotFoundPage } from "./NotFoundPage";

/**
 * Route tree. Guards are layout routes: they render <Outlet /> (the child page) or redirect.
 *   PublicOnlyRoute → /login, /register
 *   ProtectedRoute → AppShell → every signed-in page
 */
export const routes: RouteObject[] = [
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/research" replace /> },
          { path: "/research", element: <ResearchPage /> },
          { path: "/research/runs/:runId", element: <RunPage /> },
          { path: "/sources", element: <SourcesPage /> },
          { path: "/reports", element: <ReportsPage /> },
          { path: "/evaluations", element: <EvaluationsPage /> },
          { path: "/organization", element: <OrganizationPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
];
