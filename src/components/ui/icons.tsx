import type { SVGProps } from "react";

/** Small inline icon set (stroke icons, 24×24 grid) so we don't need an icon library yet. */
function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-5"
      {...props}
    >
      {children}
    </svg>
  );
}

export const SearchIcon = () => (
  <Icon>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Icon>
);

export const SourcesIcon = () => (
  <Icon>
    <path d="M4 5a2 2 0 0 1 2-2h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
    <path d="M14 3v5h5M8 13h8M8 17h5" />
  </Icon>
);

export const ReportIcon = () => (
  <Icon>
    <path d="M5 4h14v16H5z" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </Icon>
);

export const ChartIcon = () => (
  <Icon>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </Icon>
);

export const UsersIcon = () => (
  <Icon>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18.5 20a6.5 6.5 0 0 0-3-5.5" />
  </Icon>
);

export const LogoutIcon = () => (
  <Icon>
    <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />
  </Icon>
);

export const MenuIcon = () => (
  <Icon>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Icon>
);

export const CheckIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12 3 3 5-6" />
  </Icon>
);

export const ShieldIcon = () => (
  <Icon>
    <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z" />
  </Icon>
);

export const PulseIcon = () => (
  <Icon>
    <path d="M3 12h4l3-7 4 14 3-7h4" />
  </Icon>
);

export const ThumbUpIcon = ({ filled = false }: { filled?: boolean }) => (
  <Icon className="size-4" fill={filled ? "currentColor" : "none"}>
    <path d="M7 10v10H4V10zM7 10l4-7a2 2 0 0 1 2 2v4h5.5a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.3 20H7" />
  </Icon>
);

export const ThumbDownIcon = ({ filled = false }: { filled?: boolean }) => (
  <Icon className="size-4" fill={filled ? "currentColor" : "none"}>
    <path d="M7 14V4H4v10zM7 14l4 7a2 2 0 0 0 2-2v-4h5.5a2 2 0 0 0 2-2.3l-1.2-7A2 2 0 0 0 17.3 4H7" />
  </Icon>
);
