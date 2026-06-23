import { cn } from "@/lib/utils";

interface KPICardProps {
  readonly title: string;
  readonly value: number;
  readonly icon?: React.ReactNode;
  readonly variant?: "default" | "success" | "warning" | "danger";
}

const variantConfig = {
  default: {
    accent: "border-l-primary",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  success: {
    accent: "border-l-green-500",
    iconBg: "bg-green-50 dark:bg-green-900/20",
    iconColor: "text-green-600 dark:text-green-400",
  },
  warning: {
    accent: "border-l-amber-500",
    iconBg: "bg-amber-50 dark:bg-amber-900/20",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  danger: {
    accent: "border-l-red-500",
    iconBg: "bg-red-50 dark:bg-red-900/20",
    iconColor: "text-red-600 dark:text-red-400",
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
        "bg-card rounded-xl border border-border shadow-sm border-l-4 p-6",
        config.accent
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
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
