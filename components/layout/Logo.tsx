/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import { useId } from "react";

interface LogoMarkProps {
  readonly className?: string;
  /** Size in pixels for width/height (square tile). Default 32. */
  readonly size?: number;
}

/**
 * BCM logo mark: the round seal with its check, whose long stroke leaves the
 * seal and runs on as a line, going all the way. A circle with a tail is a
 * rarer silhouette than a check in a rounded square (checked on TMview,
 * 2026-11-25). Drawn for BCM, not taken from another mark; one colour, the
 * same in light and dark mode.
 */
export function LogoMark({ className, size = 32 }: LogoMarkProps) {
  // Desktop and mobile sidebars can both be mounted at once (one hidden via
  // CSS, not unmounted): a fixed mask id would collide and break the second.
  const maskId = `bcm-mark-mask-${useId()}`;

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
        <rect width="100" height="100" fill="white" />
        <path d="M18 52 L32 66 L56 40 L94 40" stroke="black" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
      </mask>
      <circle cx="42" cy="52" r="38" fill="#2563eb" mask={`url(#${maskId})`} />
      <path d="M18 52 L32 66 L56 40 L92 40" stroke="#2563eb" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
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
