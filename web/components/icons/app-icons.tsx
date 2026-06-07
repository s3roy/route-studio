import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export function SvgIcon({
  size = 16,
  className = "",
  children,
  viewBox = "0 0 24 24",
  fill = "none",
  ...props
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={size}
      height={size}
      fill={fill}
      className={`shrink-0 ${className}`.trim()}
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

const stroke = {
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function RouteStudioMark({ size = 20, className, ...props }: IconProps) {
  return (
    <SvgIcon size={size} className={className} viewBox="0 0 32 32" {...props}>
      <circle cx="16" cy="9" r="2.8" fill="currentColor" />
      <circle cx="9" cy="23" r="2.8" fill="currentColor" />
      <circle cx="23" cy="23" r="2.8" fill="currentColor" />
      <path d="M16 11.8 9 20.2" {...stroke} />
      <path d="M16 11.8 23 20.2" {...stroke} />
      <path d="M11.8 23h8.4" {...stroke} />
    </SvgIcon>
  );
}

type LogoProps = IconProps & {
  showWordmark?: boolean;
  subtitle?: string;
};

export function RouteStudioLogo({
  size = 18,
  className = "",
  showWordmark = false,
  subtitle,
}: LogoProps) {
  return (
    <div className={`flex min-w-0 items-center gap-2 ${className}`.trim()}>
      <RouteStudioMark size={size} className="shrink-0 text-violet-500" />
      {showWordmark ? (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">Route Studio</p>
          {subtitle ? <p className="theme-muted truncate text-xs">{subtitle}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M4 10.5 12 4l8 6.5" {...stroke} />
      <path d="M6.5 9.5V19a1 1 0 0 0 1 1H10v-5h4v5h2.5a1 1 0 0 0 1-1V9.5" {...stroke} />
    </SvgIcon>
  );
}

export function GraphIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="6" cy="6" r="2.2" {...stroke} />
      <circle cx="18" cy="6" r="2.2" {...stroke} />
      <circle cx="12" cy="18" r="2.2" {...stroke} />
      <path d="M8 7.5 10.5 15.5" {...stroke} />
      <path d="M16 7.5 13.5 15.5" {...stroke} />
    </SvgIcon>
  );
}

export function FilesIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <rect x="3" y="4" width="8" height="16" rx="1" {...stroke} />
      <path d="M13 4h8v4" {...stroke} />
      <path d="M13 8h8v12H13" {...stroke} />
    </SvgIcon>
  );
}

export function GitBranchIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="6" cy="6" r="2" {...stroke} />
      <circle cx="6" cy="18" r="2" {...stroke} />
      <circle cx="18" cy="12" r="2" {...stroke} />
      <path d="M6 8v8" {...stroke} />
      <path d="M8 6h5a3 3 0 0 1 3 3v4" {...stroke} />
    </SvgIcon>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" {...stroke} />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
        {...stroke}
      />
    </SvgIcon>
  );
}

/** @deprecated Use SettingsIcon */
export function RouteDetailIcon(props: IconProps) {
  return <SettingsIcon {...props} />;
}

export function ScanIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <ellipse cx="12" cy="6" rx="7" ry="3" {...stroke} />
      <path d="M5 6v6c0 1.66 3.13 3 7 3s7-1.34 7-3V6" {...stroke} />
      <path d="M5 12v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" {...stroke} />
    </SvgIcon>
  );
}

export function FolderIcon({ open, ...props }: IconProps & { open?: boolean }) {
  if (open) {
    return (
      <SvgIcon {...props}>
        <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H9l2 2h8.5A1.5 1.5 0 0 1 21 9.5V18a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18V7.5Z" {...stroke} />
        <path d="M3 10h18" {...stroke} />
      </SvgIcon>
    );
  }
  return (
    <SvgIcon {...props}>
      <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H9l2 2h8.5A1.5 1.5 0 0 1 21 9.5V18a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18V7.5Z" {...stroke} />
    </SvgIcon>
  );
}

export function FileIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M8 4h6l4 4v12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" {...stroke} />
      <path d="M14 4v4h4" {...stroke} />
    </SvgIcon>
  );
}

export function LayoutIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" {...stroke} />
      <path d="M4 9h16" {...stroke} />
      <path d="M9 9v11" {...stroke} />
    </SvgIcon>
  );
}

export function PageIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M8 4h6l4 4v12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" {...stroke} />
      <path d="M14 4v4h4" {...stroke} />
      <path d="M9 13h6M9 16h4" {...stroke} />
    </SvgIcon>
  );
}

export function ApiRouteIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M8 7h8M8 12h8M8 17h5" {...stroke} />
      <path d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" {...stroke} />
    </SvgIcon>
  );
}

export function LoadingIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 3v3" {...stroke} />
      <path d="M12 18v3" {...stroke} />
      <path d="M18.36 5.64 16.24 7.76" {...stroke} />
      <path d="M7.76 16.24 5.64 18.36" {...stroke} />
      <path d="M21 12h-3" {...stroke} />
      <path d="M6 12H3" {...stroke} />
      <path d="M18.36 18.36 16.24 16.24" {...stroke} />
      <path d="M7.76 7.76 5.64 5.64" {...stroke} />
    </SvgIcon>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="4" {...stroke} />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        {...stroke}
      />
    </SvgIcon>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path
        d="M20 14.5A7.5 7.5 0 0 1 9.5 4 7 7 0 1 0 20 14.5Z"
        {...stroke}
      />
    </SvgIcon>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 16V6" {...stroke} />
      <path d="m8.5 9.5 3.5-3.5 3.5 3.5" {...stroke} />
      <path d="M5 18h14" {...stroke} />
    </SvgIcon>
  );
}

export function GitHubIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path
        d="M9 19c-4 1.5-4-2.5-6-3m12 5v-3.5c0-1 .4-1.4 1-2-3.2-.4-6.5-1.6-6.5-7.1 0-1.6.6-2.9 1.5-3.9-.2-.4-.7-1.9.1-4 0 0 1.2-.4 4 1.5a13.8 13.8 0 0 1 7 0c2.8-1.9 4-1.5 4-1.5.8 2.1.3 3.6.1 4 1 .9 1.5 2.2 1.5 3.9 0 5.5-3.3 6.7-6.5 7.1.5.5 1 1.2 1 2.2V21"
        {...stroke}
      />
    </SvgIcon>
  );
}

export function ShareIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="18" cy="5" r="2.2" {...stroke} />
      <circle cx="6" cy="12" r="2.2" {...stroke} />
      <circle cx="18" cy="19" r="2.2" {...stroke} />
      <path d="m8.2 10.7 7.6-3.4M8.2 13.3l7.6 3.4" {...stroke} />
    </SvgIcon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="8" {...stroke} />
      <path d="M12 8v4l2.5 2.5" {...stroke} />
    </SvgIcon>
  );
}

export function DatabaseIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <ellipse cx="12" cy="6" rx="7" ry="3" {...stroke} />
      <path d="M5 6v6c0 1.66 3.13 3 7 3s7-1.34 7-3V6" {...stroke} />
      <path d="M5 12v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" {...stroke} />
    </SvgIcon>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="8" {...stroke} />
      <path d="m8.5 12 2.2 2.2L15.8 9" {...stroke} />
    </SvgIcon>
  );
}

export function XCircleIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="8" {...stroke} />
      <path d="m9 9 6 6M15 9l-6 6" {...stroke} />
    </SvgIcon>
  );
}

export function ComponentIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z" {...stroke} />
      <path d="m4 7.5 8 4.5 8-4.5M12 12v9" {...stroke} />
    </SvgIcon>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z" {...stroke} />
      <path d="M8 4v13a3 3 0 0 0 3 3" {...stroke} />
    </SvgIcon>
  );
}

export function ExternalLinkIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M14 5h5v5" {...stroke} />
      <path d="M10 14 19 5M19 10v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h8" {...stroke} />
    </SvgIcon>
  );
}

export function SparklesIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 3v2M12 19v2M5 12H3M21 12h-2M6.3 6.3 4.9 4.9M19.1 19.1l-1.4-1.4M17.7 6.3l1.4-1.4M4.9 19.1l1.4-1.4" {...stroke} />
      <path d="M12 8.5 13.2 12 16.5 13.2 13.2 14.4 12 17.7 10.8 14.4 7.5 13.2 10.8 12 12 8.5Z" {...stroke} />
    </SvgIcon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="m6 9 6 6 6-6" {...stroke} />
    </SvgIcon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="m9 6 6 6-6 6" {...stroke} />
    </SvgIcon>
  );
}

import type { RouteFileKind } from "@/lib/analyzer";

export function RouteFileKindIcon({
  kind,
  ...props
}: IconProps & { kind?: RouteFileKind }) {
  switch (kind) {
    case "layout":
      return <LayoutIcon {...props} />;
    case "page":
      return <PageIcon {...props} />;
    case "loading":
      return <LoadingIcon {...props} />;
    case "route":
      return <ApiRouteIcon {...props} />;
    default:
      return <FileIcon {...props} />;
  }
}
