import type { ReactNode } from "react";
import { ChartIcon, ReportIcon, SearchIcon, SourcesIcon, UsersIcon } from "@/components/ui/icons";

export type NavItem = { to: string; label: string; icon: ReactNode };

/** Sidebar entries, one per feature folder (src/features/*). */
export const mainNav: NavItem[] = [
  { to: "/research", label: "Research", icon: <SearchIcon /> },
  { to: "/sources", label: "Sources", icon: <SourcesIcon /> },
  { to: "/reports", label: "Reports", icon: <ReportIcon /> },
  { to: "/evaluations", label: "Evaluations", icon: <ChartIcon /> },
];

export const settingsNav: NavItem[] = [
  { to: "/organization", label: "Organization", icon: <UsersIcon /> },
];
