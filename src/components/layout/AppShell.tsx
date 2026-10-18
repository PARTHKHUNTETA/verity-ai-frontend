import { useState } from "react";
import { Outlet } from "react-router";
import { MenuIcon } from "@/components/ui/icons";
import { Sidebar } from "./Sidebar";
import { UserMenu } from "./UserMenu";

/** Layout for every signed-in page: sidebar (a drawer on small screens), header, page content. */
export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-full">
      <aside className="border-line bg-surface hidden w-64 shrink-0 border-r lg:block">
        <Sidebar />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="bg-ink/30 absolute inset-0"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="bg-surface absolute inset-y-0 left-0 w-64 shadow-xl">
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-line bg-surface flex h-16 shrink-0 items-center justify-between gap-4 border-b px-4 sm:px-6">
          <button
            type="button"
            aria-label="Open menu"
            className="text-ink-muted hover:bg-canvas rounded-lg p-2 lg:hidden"
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon />
          </button>
          <p className="text-ink-muted hidden text-sm lg:block">
            Research with evidence. Answers with confidence.
          </p>
          <UserMenu />
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
