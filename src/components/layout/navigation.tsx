import type { ReactNode } from "react";
import {
  ChartIcon,
  CheckIcon,
  GuideIcon,
  PulseIcon,
  ReportIcon,
  SearchIcon,
  ShieldIcon,
  SourcesIcon,
  UsersIcon,
} from "@/components/ui/icons";
import type { Action } from "@/types/api";

export type NavItem = {
  to: string;
  label: string;
  icon: ReactNode;
  /** Only shown to users who can do this. */
  permission?: Action;
  /** Shows the number of pending approvals. */
  badge?: "approvals";
};

/** Sidebar entries, one per feature folder (src/features/*). */
export const mainNav: NavItem[] = [
  { to: "/research", label: "Research", icon: <SearchIcon /> },
  { to: "/sources", label: "Sources", icon: <SourcesIcon /> },
  { to: "/reports", label: "Reports", icon: <ReportIcon /> },
  { to: "/evaluations", label: "Evaluations", icon: <ChartIcon /> },
  { to: "/observability", label: "Observability", icon: <PulseIcon /> },
  {
    to: "/approvals",
    label: "Approvals",
    icon: <CheckIcon />,
    permission: "approval:decide",
    badge: "approvals",
  },
];

export const settingsNav: NavItem[] = [
  { to: "/guide", label: "Guide", icon: <GuideIcon /> },
  { to: "/organization", label: "Organization", icon: <UsersIcon /> },
  {
    to: "/settings/policy",
    label: "Agent policy",
    icon: <ShieldIcon />,
    permission: "policy:manage",
  },
];
