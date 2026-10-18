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
  discovery: boolean;
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
  title: string | null;
  status: "draft" | "final" | "superseded";
  contentMd: string;
};

/** A passage the model could cite as [number]. */
export type Citation = {
  number: number;
  evidenceId: string;
  chunkId: string | null;
  sourceId: string;
  sourceTitle: string;
  quote: string;
  stance: "supports" | "contradicts" | "neutral" | null;
  confidence: number | null;
  note: string | null;
  subQuestionId: string | null;
  pageStart: number | null;
  pageEnd: number | null;
};

export type SubQuestion = {
  id: string;
  position: number;
  text: string;
  rationale: string | null;
  searchQueries: string[];
  coverage: "pending" | "answered" | "partial" | "unanswered";
  evidenceCount: number;
};

export type AgentStep = {
  seq: number;
  stage: RunStage | null;
  type: "llm_call" | "tool_call" | "observation" | "stage_change" | "error";
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  model: string | null;
  tokensInput: number | null;
  tokensOutput: number | null;
  costUsd: number | null;
  durationMs: number | null;
  createdAt: string;
};

export type ToolCallRecord = {
  id: string;
  stage: RunStage | null;
  tool: string;
  args: { purpose?: string; code?: string; url?: string; query?: string };
  status: "proposed" | "denied" | "awaiting_approval" | "running" | "succeeded" | "failed";
  /** For run_code: the sandbox outcome. */
  result: { ok?: boolean; result?: unknown; error?: string; logs?: string[] } | null;
  error: string | null;
  durationMs: number | null;
  createdAt: string;
};

export type RunSourceStatus = "candidate" | "acquired" | "used" | "rejected" | "blocked";

/** A source a run found through web or academic search, and what happened to it. */
export type DiscoveredSource = {
  id: string;
  url: string;
  title: string | null;
  provider: string;
  discoveredVia: "web_search" | "academic_search";
  rank: number;
  status: RunSourceStatus;
  reason: string | null;
  sourceId: string | null;
};

/** GET /research/runs/:id, and the SSE "snapshot" event. */
export type RunDetail = {
  run: Run;
  task: Task;
  report: Report | null;
  citations: Citation[];
  discovered: DiscoveredSource[];
  subQuestions: SubQuestion[];
  steps: AgentStep[];
  toolCalls: ToolCallRecord[];
  approvals: RunApproval[];
  decisions: PolicyDecision[];
};

// --- Policies & approvals (Phase 8) ---------------------------------------------------

export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired";

export type RunApproval = {
  id: string;
  kind: "tool_call" | "budget";
  summary: string;
  status: ApprovalStatus;
  comment: string | null;
  createdAt: string;
  decidedAt: string | null;
};

export type PolicyDecision = {
  id: string;
  tool: string | null;
  args: Record<string, unknown> | null;
  decision: "allow" | "deny" | "require_approval";
  matchedRule: string;
  reason: string;
  policyVersion: number | null;
  createdAt: string;
};

/** GET /approvals */
export type ApprovalRequest = RunApproval & {
  runId: string;
  details: {
    tool?: string;
    args?: { purpose?: string; code?: string; url?: string };
    reason?: string;
    limit?: "maxSteps" | "maxTokens" | "maxCostUsd";
    max?: number;
    used?: number;
  };
  expiresAt: string;
  question: string;
  requestedByEmail: string | null;
};

export type PolicyRules = {
  tools: {
    search: { enabled: boolean };
    fetch: { enabled: boolean; maxPerRun: number };
    rag: { enabled: boolean };
    run_code: { enabled: boolean; requireApproval: boolean; maxPerRun: number };
  };
  domains: { blocked: string[]; allowed: string[] };
  budget: {
    maxCostUsd: number;
    maxTokens: number;
    maxSteps: number;
    onExceed: "fail" | "require_approval";
  };
};

export type Policy = {
  id: string;
  version: number;
  rules: PolicyRules;
  createdBy: string | null;
  createdAt: string;
};

/** GET /research/capabilities */
export type ResearchCapabilities = { webSearch: string | null; academicSearch: string[] };

// --- Knowledge base (Phase 5) ---------------------------------------------------------

export type CollectionVisibility = "private" | "organization";
export type SourceStatus = "pending" | "processing" | "ready" | "failed";

export type Collection = {
  id: string;
  name: string;
  description: string | null;
  visibility: CollectionVisibility;
  createdBy: string | null;
  createdAt: string;
  sourceCount: number;
  readyCount: number;
};

export type Source = {
  id: string;
  type: "upload" | "web" | "paper";
  title: string;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  authors: string[] | null;
  url: string | null;
  domain: string | null;
  publishedAt: string | null;
  status: SourceStatus;
  error: string | null;
  pageCount: number | null;
  tokenCount: number | null;
  createdAt: string;
};

export type CollectionDetail = Omit<Collection, "sourceCount" | "readyCount"> & {
  canEdit: boolean;
  sources: Array<Source & { addedAt: string }>;
};

export type SourceDetail = Source & {
  collections: Array<{ id: string; name: string }>;
  chunkCount: number;
};

export type Chunk = {
  id: string;
  chunkIndex: number;
  content: string;
  tokenCount: number;
  pageStart: number | null;
  pageEnd: number | null;
};

export type SearchHit = {
  chunkId: string;
  sourceId: string;
  sourceTitle: string;
  content: string;
  pageStart: number | null;
  pageEnd: number | null;
  score: number;
  vectorRank: number | null;
  keywordRank: number | null;
};

// --- Observability (Phase 9) ----------------------------------------------------------

export type TraceSpan = {
  spanId: string;
  traceId: string;
  parentSpanId: string | null;
  name: string;
  kind: "internal" | "client";
  status: "ok" | "error";
  attributes: Record<string, unknown>;
  errorMessage: string | null;
  startTime: string;
  endTime: string | null;
  durationMs: number | null;
};

export type TraceSummary = {
  totalMs: number;
  llm: {
    calls: number;
    ms: number;
    costUsd: number | null;
    tokensInput: number;
    tokensOutput: number;
  };
  tools: { calls: number; ms: number; denied: number; failed: number; cached: number };
  stages: Array<{
    stage: string;
    ms: number;
    llmMs: number;
    toolMs: number;
    costUsd: number | null;
  }>;
  slowest: Array<{ spanId: string; name: string; ms: number; detail: string | null }>;
  errors: Array<{ spanId: string; name: string; message: string | null }>;
};

export type RunTrace = { traceId: string; spans: TraceSpan[]; summary: TraceSummary };

export type Metrics = {
  window: { days: number; since: string };
  runs: {
    total: number;
    completed: number;
    failed: number;
    cancelled: number;
    awaitingApproval: number;
    p50Ms: number | null;
    p95Ms: number | null;
    avgCostUsd: number | null;
    totalCostUsd: number;
    totalTokens: number;
  };
  failures: Array<{ code: string; count: number }>;
  llm: Array<{
    name: string;
    calls: number;
    p50Ms: number | null;
    p95Ms: number | null;
    errorRate: number;
    costUsd: number;
  }>;
  stages: Array<{ name: string; calls: number; p50Ms: number | null; p95Ms: number | null }>;
  tools: Array<{
    tool: string;
    calls: number;
    succeeded: number;
    failed: number;
    denied: number;
    awaiting: number;
    avgMs: number | null;
    errorRate: number;
  }>;
  denials: Array<{ decision: string; rule: string; count: number }>;
  daily: Array<{ day: string; runs: number; failed: number; costUsd: number }>;
};
