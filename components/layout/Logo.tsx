interface LogoMarkProps {
  readonly className?: string;
}

/**
 * Standalone icon: a document with a folded corner and a checkmark,
 * representing a verified/tracked contract. Original mark, no external
 * reference — colors come from the design tokens (currentColor + primary-foreground).
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
      <path
        d="M11 8h7l5 5v11a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2Z"
        className="fill-primary-foreground"
        opacity="0.92"
      />
      <path d="M18 8v5h5" className="stroke-primary" strokeWidth="1.4" strokeLinejoin="round" />
      <path
        d="M12.5 18.5l2.6 2.6 5.4-6"
        className="stroke-primary"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
