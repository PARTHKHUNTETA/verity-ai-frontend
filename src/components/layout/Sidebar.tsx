import { NavLink } from "react-router";
import { cn } from "@/components/ui/cn";
import { useMe } from "@/features/auth/auth-context";
import { Logo } from "./Logo";
import { mainNav, settingsNav, type NavItem } from "./navigation";

function NavList({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  return (
    <ul className="space-y-1">
      {items.map((item) => (
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
