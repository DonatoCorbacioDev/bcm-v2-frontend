export default function KPICardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm border-l-4 border-l-gray-200 dark:border-l-gray-700 p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-9 w-16 bg-gray-200 dark:bg-gray-700 rounded mt-3" />
        </div>
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
    </div>
  );
}
