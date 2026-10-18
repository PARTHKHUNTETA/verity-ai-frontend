/** Types mirroring the backend's JSON responses (verity-ai-backend/src/modules/*). */

export type MemberRole = "owner" | "admin" | "researcher" | "viewer";

export type Action =
  | "report:read"
  | "run:create"
  | "run:manage"
  | "source:create"
  | "collection:manage"
  | "approval:decide"
  | "policy:manage"
  | "eval:manage"
  | "member:read"
  | "member:manage";

export type UserSummary = { id: string; email: string; name: string | null };
export type OrganizationSummary = { id: string; name: string; slug: string };

/** POST /auth/register · /auth/login · /auth/refresh */
export type SessionResponse = {
  tokenType: "Bearer";
  accessToken: string;
  expiresIn: number;
  user: UserSummary;
  organization: OrganizationSummary;
  role: MemberRole;
};

/** GET /me */
export type Me = {
  user: UserSummary & { lastLoginAt: string | null };
  organization: OrganizationSummary;
  role: MemberRole;
  permissions: Action[];
  memberships: Array<{ organizationId: string; name: string; slug: string; role: MemberRole }>;
};

/** GET /organization/members */
export type Member = {
  userId: string;
  email: string;
  name: string | null;
  role: MemberRole;
  joinedAt: string;
};

/** Every backend error has this shape (verity-ai-backend/src/middleware/error-handler.ts). */
export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: Array<{ path: string; message: string }> | unknown;
    requestId?: string;
  };
};

// --- Research (Phase 4) ---------------------------------------------------------------

export type RunStatus =
  "queued" | "running" | "awaiting_approval" | "completed" | "failed" | "cancelled";

export type RunStage =
  | "planning"
  | "discovering"
  | "acquiring"
  | "retrieving"
  | "extracting"
  | "analyzing"
  | "synthesizing"
  | "evaluating";

export type Run = {
  id: string;
  taskId: string;
  status: RunStatus;
  stage: RunStage | null;
  model: string;
  promptVersion: string;
  tokensInput: number;
  tokensOutput: number;
  /** null = unknown (model missing from the backend's price table). */
  costUsd: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  startedBy: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
};

export type Task = {
  id: string;
  question: string;
  instructions: string | null;
  createdBy: string | null;
  createdAt: string;
};

export type TaskSummary = Task & { latestRun: Run | null };

export type Report = {
  id: string;
  version: number;
  status: "draft" | "final" | "superseded";
  contentMd: string;
};

/** GET /research/runs/:id, and the SSE "snapshot" event. */
export type RunDetail = { run: Run; task: Task; report: Report | null };
