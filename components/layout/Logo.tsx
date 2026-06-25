interface LogoMarkProps {
  readonly className?: string;
}

/**
 * Standalone icon: two interlocking rings, representing an agreement
 * binding two parties. Original mark, no external reference — colors
 * come from the design tokens (fill-primary + stroke-primary-foreground).
 */
export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <circle cx="13" cy="16" r="7" className="stroke-primary-foreground" strokeWidth="2.4" />
      <circle cx="19" cy="16" r="7" className="stroke-primary-foreground" strokeWidth="2.4" />
    </svg>
  );
}

interface LogoProps {
  readonly className?: string;
  readonly iconClassName?: string;
  readonly showWordmark?: boolean;
}

export default function Logo({ className, iconClassName, showWordmark = true }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <LogoMark className={iconClassName ?? "h-8 w-8"} />
      {showWordmark && (
        <span className="text-xl font-bold text-foreground tracking-tight">BCM</span>
      )}
    </span>
  );
}
