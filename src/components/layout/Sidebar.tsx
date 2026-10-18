import { useQuery } from "@tanstack/react-query";
import { NavLink } from "react-router";
import { cn } from "@/components/ui/cn";
import { useAuth, useMe } from "@/features/auth/auth-context";
import { approvalsApi } from "@/services/governance-api";
import { Logo } from "./Logo";
import { mainNav, settingsNav, type NavItem } from "./navigation";

function NavList({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const { can } = useAuth();
  const canApprove = can("approval:decide");
  const pending = useQuery({
    queryKey: ["approvals", "count"],
    queryFn: approvalsApi.pendingCount,
    enabled: canApprove && items.some((i) => i.badge === "approvals"),
    refetchInterval: 30_000,
  });
  return (
    <ul className="space-y-1">
      {items
        .filter((item) => !item.permission || can(item.permission))
        .map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-muted hover:bg-canvas hover:text-ink",
                )
              }
            >
              {item.icon}
              {item.label}
              {item.badge === "approvals" && (pending.data ?? 0) > 0 && (
                <span className="ml-auto rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {pending.data}
                </span>
              )}
            </NavLink>
          </li>
        ))}
    </ul>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const me = useMe();
  return (
    <nav aria-label="Main" className="flex h-full flex-col gap-6 px-3 py-5">
      <div className="px-3">
        <Logo />
        <p className="text-ink-subtle mt-1 text-xs">Evaluated Research Agent</p>
      </div>

      <div className="border-line bg-canvas mx-3 rounded-lg border px-3 py-2">
        <p className="text-ink-subtle text-xs">Organization</p>
        <p className="text-ink truncate text-sm font-medium">{me.organization.name}</p>
      </div>

      <NavList items={mainNav} onNavigate={onNavigate} />

      <div className="mt-auto">
        <p className="text-ink-subtle mb-2 px-3 text-xs font-medium tracking-wide uppercase">
          Settings
        </p>
        <NavList items={settingsNav} onNavigate={onNavigate} />
      </div>
    </nav>
  );
}
