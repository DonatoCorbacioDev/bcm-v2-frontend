interface LogoMarkProps {
  readonly className?: string;
  /** Size in pixels for width/height (square tile). Default 32. */
  readonly size?: number;
}

/**
 * BCM logo mark: white document page with folded corner, "BCM" lettering,
 * and a signature flourish, on a primary-blue rounded tile.
 */
export function LogoMark({ className, size = 32 }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <rect width="32" height="32" rx="8" fill="#2563eb" />
      {/* Document body */}
      <path
        d="M10 4h9l6 6v15a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z"
        fill="white"
      />
      {/* Folded corner */}
      <path
        d="M19 4v5a2 2 0 0 0 2 2h5z"
        fill="#2563eb"
        opacity="0.22"
      />
      {/* BCM text */}
      <text
        x="14"
        y="20"
        fontSize="5"
        fontWeight="800"
        fill="#2563eb"
        textAnchor="middle"
        fontFamily="system-ui, sans-serif"
        letterSpacing="0.4"
      >
        BCM
      </text>
      {/* Signature flourish */}
      <path
        d="M8.5 25c1.5-1.5 2.5-1.5 3.5-.3.7.8 1.4.9 2 .2.5-.5 1.2-.6 2-.2"
        fill="none"
        stroke="#2563eb"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface LogoProps {
  readonly className?: string;
  readonly size?: number;
  /** @deprecated use size prop instead */
  readonly iconClassName?: string;
  readonly showWordmark?: boolean;
}

export default function Logo({ className, size = 32, iconClassName, showWordmark = true }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <LogoMark size={size} className={iconClassName} />
      {showWordmark && (
        <span className="text-[15px] font-bold text-foreground tracking-tight leading-tight">
          Business Contracts
        </span>
      )}
    </span>
  );
}
