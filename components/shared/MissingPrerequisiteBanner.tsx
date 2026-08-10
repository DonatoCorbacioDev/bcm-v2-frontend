import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PrerequisiteAction {
  readonly label: string;
  readonly href: string;
}

interface MissingPrerequisiteBannerProps {
  readonly message: string;
  readonly actions: readonly PrerequisiteAction[];
}

/**
 * Guides the user toward the record(s) that must exist before a dependent
 * section (e.g. Budget needs a business area) becomes usable, instead of
 * letting them open a form with an empty, unexplained select.
 */
export function MissingPrerequisiteBanner({ message, actions }: MissingPrerequisiteBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-[var(--status-amber-fg)]/30 bg-[var(--status-amber-fg)]/5 p-4"
    >
      <AlertTriangle
        className="h-5 w-5 text-[var(--status-amber-fg)] shrink-0 mt-0.5"
        aria-hidden="true"
      />
      <div className="flex-1 space-y-3">
        <p className="text-sm text-foreground">{message}</p>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button key={action.href} asChild size="sm" variant="outline">
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
