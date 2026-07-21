import { cn } from "@/lib/utils";

interface KPICardProps {
  readonly title: string;
  readonly value: number;
  readonly icon?: React.ReactNode;
  readonly variant?: "default" | "success" | "warning" | "danger";
}

const variantConfig = {
  default: {
    accent: "border-l-[var(--status-blue-fg)]",
    iconBg: "bg-[var(--status-blue-bg)]",
    iconColor: "text-[var(--status-blue-fg)]",
  },
  success: {
    accent: "border-l-[var(--status-green-fg)]",
    iconBg: "bg-[var(--status-green-bg)]",
    iconColor: "text-[var(--status-green-fg)]",
  },
  warning: {
    accent: "border-l-[var(--status-amber-fg)]",
    iconBg: "bg-[var(--status-amber-bg)]",
    iconColor: "text-[var(--status-amber-fg)]",
  },
  danger: {
    accent: "border-l-[var(--status-red-fg)]",
    iconBg: "bg-[var(--status-red-bg)]",
    iconColor: "text-[var(--status-red-fg)]",
  },
};

export default function KPICard({
  title,
  value,
  icon,
  variant = "default",
}: KPICardProps) {
  const config = variantConfig[variant];

  return (
    <div
      className={cn(
        "bg-card rounded-xl border border-border shadow-sm border-l-4 p-5",
        config.accent
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-2 tabular-nums">{value}</p>
        </div>
        {icon && (
          <div className={cn("p-3 rounded-xl", config.iconBg, config.iconColor)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
