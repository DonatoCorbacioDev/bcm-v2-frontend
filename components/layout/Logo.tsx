import { useId } from "react";

interface LogoMarkProps {
  readonly className?: string;
  /** Size in pixels for width/height (square tile). Default 32. */
  readonly size?: number;
}

/**
 * BCM logo mark: a solid seal with a checkmark cut through it — the
 * checkmark's long stroke breaks past the seal's own edge instead of
 * staying contained, so the silhouette itself is distinctive, not just
 * the checkmark inside it.
 */
export function LogoMark({ className, size = 32 }: LogoMarkProps) {
  // Desktop and mobile sidebars can both be mounted at once (one hidden via
  // CSS, not unmounted) — a fixed mask id would collide and silently break
  // the second instance's mask.
  const maskId = `bcm-seal-mask-${useId()}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <mask id={maskId}>
        <circle cx="50" cy="50" r="40" fill="white" />
        <path
          d="M28 52 L43 67 L82 20"
          stroke="black"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </mask>
      <circle cx="50" cy="50" r="40" fill="#2563eb" mask={`url(#${maskId})`} />
    </svg>
  );
}

interface LogoProps {
  readonly className?: string;
  readonly size?: number;
  readonly showWordmark?: boolean;
}

export default function Logo({ className, size = 32, showWordmark = true }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <LogoMark size={size} />
      {showWordmark && (
        <span className="text-[15px] font-bold text-foreground tracking-tight leading-tight">
          Business Contracts Manager
        </span>
      )}
    </span>
  );
}
