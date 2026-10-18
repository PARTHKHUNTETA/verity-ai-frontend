import { useEffect, useRef, useState } from "react";
import { LogoutIcon } from "@/components/ui/icons";
import { useAuth, useMe } from "@/features/auth/auth-context";

function initials(nameOrEmail: string) {
  const parts = nameOrEmail.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function UserMenu() {
  const me = useMe();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const displayName = me.user.name ?? me.user.email;

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="hover:bg-canvas flex items-center gap-3 rounded-lg px-2 py-1.5"
      >
        <span className="bg-brand-600 flex size-8 items-center justify-center rounded-full text-xs font-semibold text-white">
          {initials(displayName)}
        </span>
        <span className="hidden text-left sm:block">
          <span className="text-ink block max-w-40 truncate text-sm font-medium">
            {displayName}
          </span>
          <span className="text-ink-muted block text-xs capitalize">{me.role}</span>
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="border-line bg-surface absolute right-0 z-20 mt-2 w-64 rounded-xl border p-2 shadow-lg"
        >
          <div className="px-3 py-2">
            <p className="text-ink truncate text-sm font-medium">{displayName}</p>
            <p className="text-ink-muted truncate text-xs">{me.user.email}</p>
            <p className="text-ink-muted mt-1 text-xs">
              <span className="capitalize">{me.role}</span> · {me.organization.name}
            </p>
          </div>
          <div className="border-line my-1 border-t" />
          <button
            type="button"
            role="menuitem"
            onClick={() => void logout()}
            className="text-ink-muted hover:bg-canvas hover:text-ink flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm"
          >
            <LogoutIcon />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
