export default function KPICardSkeleton() {
  return (
    <div className="rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* Title skeleton */}
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          {/* Value skeleton */}
          <div className="h-9 w-16 bg-gray-200 dark:bg-gray-700 rounded mt-3"></div>
        </div>
        {/* Icon skeleton */}
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>
    </div>
  );
}