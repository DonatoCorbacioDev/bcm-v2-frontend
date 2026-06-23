export default function KPICardSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm border-l-4 border-l-muted p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-4 w-28 bg-muted rounded" />
          <div className="h-9 w-16 bg-muted rounded mt-3" />
        </div>
        <div className="w-12 h-12 bg-muted rounded-xl" />
      </div>
    </div>
  );
}
