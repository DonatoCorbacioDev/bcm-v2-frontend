interface KPICardProps {
  title: string;
  value: number;
  icon?: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
}

export default function KPICard({
  title,
  value,
  icon,
  variant = "default",
}: KPICardProps) {
  const variantStyles = {
    default: "bg-blue-50 border-blue-200 text-blue-700",
    success: "bg-green-50 border-green-200 text-green-700",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-700",
    danger: "bg-red-50 border-red-200 text-red-700",
  };

  return (
    <div
      className={`rounded-lg border-2 p-6 ${variantStyles[variant]} dark:bg-opacity-10`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        {icon && <div className="text-4xl opacity-50">{icon}</div>}
      </div>
    </div>
  );
}