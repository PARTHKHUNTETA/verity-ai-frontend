/** Types mirroring the backend's JSON responses (verity-ai-backend/src/modules/*). */

export type MemberRole = "owner" | "admin" | "researcher" | "viewer";

export type Action =
  | "report:read"
  | "run:create"
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
