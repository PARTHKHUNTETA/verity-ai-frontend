import { useQuery } from "@tanstack/react-query";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth, useMe } from "@/features/auth/auth-context";
import { errorMessage } from "@/services/api-client";
import { organizationApi } from "@/services/organization-api";

/** Read-only member list for now. Adding members and changing roles gets a UI later. */
export function OrganizationPage() {
  const me = useMe();
  const { can } = useAuth();
  const members = useQuery({
    queryKey: ["organization", me.organization.id, "members"],
    queryFn: organizationApi.listMembers,
  });

  return (
    <>
      <PageHeader
        title={me.organization.name}
        description={`Organization · ${me.organization.slug}`}
      />

      <Card>
        <div className="border-line flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-ink text-sm font-semibold">Members</h2>
          {can("member:manage") && (
            <span className="text-ink-muted text-xs">Member management UI coming soon</span>
          )}
        </div>

        {members.isPending && (
          <div className="text-brand-600 flex justify-center py-10">
            <Spinner />
          </div>
        )}
        {members.isError && (
          <div className="p-5">
            <Alert>{errorMessage(members.error)}</Alert>
          </div>
        )}
        {members.isSuccess && (
          <ul className="divide-line divide-y">
            {members.data.map((m) => (
              <li key={m.userId} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-ink truncate text-sm font-medium">
                    {m.name ?? m.email}
                    {m.userId === me.user.id && <span className="text-ink-subtle"> (you)</span>}
                  </p>
                  {m.name && <p className="text-ink-muted truncate text-xs">{m.email}</p>}
                </div>
                <span className="bg-canvas text-ink-muted rounded-full px-2.5 py-1 text-xs font-medium capitalize">
                  {m.role}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
