import { Navigate, type RouteObject } from "react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute, PublicOnlyRoute } from "@/features/auth/components/RouteGuards";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { ComparePage } from "@/features/evaluations/ComparePage";
import { DatasetPage } from "@/features/evaluations/DatasetPage";
import { EvalRunPage } from "@/features/evaluations/EvalRunPage";
import { EvaluationsPage } from "@/features/evaluations/EvaluationsPage";
import { OrganizationPage } from "@/features/organization/OrganizationPage";
import { GuidePage } from "@/features/guide/GuidePage";
import { ReportPage } from "@/features/reports/ReportPage";
import { ReportsPage } from "@/features/reports/ReportsPage";
import { ResearchPage } from "@/features/research/ResearchPage";
import { RunPage } from "@/features/research/RunPage";
import { CollectionPage } from "@/features/sources/CollectionPage";
import { SourcePage } from "@/features/sources/SourcePage";
import { SourcesPage } from "@/features/sources/SourcesPage";
import { ApprovalsPage } from "@/features/approvals/ApprovalsPage";
import { ObservabilityPage } from "@/features/observability/ObservabilityPage";
import { PolicyPage } from "@/features/settings/PolicyPage";
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
          { path: "/sources/collections/:collectionId", element: <CollectionPage /> },
          { path: "/sources/:sourceId", element: <SourcePage /> },
          { path: "/guide", element: <GuidePage /> },
          { path: "/reports", element: <ReportsPage /> },
          { path: "/reports/:reportId", element: <ReportPage /> },
          { path: "/evaluations", element: <EvaluationsPage /> },
          { path: "/evaluations/datasets/:datasetId", element: <DatasetPage /> },
          { path: "/evaluations/runs/:evalRunId", element: <EvalRunPage /> },
          { path: "/evaluations/compare", element: <ComparePage /> },
          { path: "/organization", element: <OrganizationPage /> },
          { path: "/approvals", element: <ApprovalsPage /> },
          { path: "/observability", element: <ObservabilityPage /> },
          { path: "/settings/policy", element: <PolicyPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
];
