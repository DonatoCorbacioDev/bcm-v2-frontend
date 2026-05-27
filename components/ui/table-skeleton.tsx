export interface TableSkeletonProps {
  readonly rows?: number;
  readonly columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 6 }: TableSkeletonProps) {
  return (
    <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-800">
      <div className="animate-pulse">
        {/* Table Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-6 py-4">
          <div className="flex gap-4">
            {Array.from({ length: columns }, (_, i) => `header-col-${i}`).map((colKey) => (
              <div
                key={colKey}
                className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1"
              />
            ))}
          </div>
        </div>

        {/* Table Body */}
        {Array.from({ length: rows }, (_, i) => `skeleton-row-${i}`).map((rowKey) => (
          <div
            key={rowKey}
            className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 last:border-0"
          >
            <div className="flex gap-4 items-center">
              {Array.from({ length: columns }, (_, i) => `${rowKey}-col-${i}`).map((colKey, colIndex) => (
                <div
                  key={colKey}
                  className={`h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1 ${colIndex === 0 ? "w-20" : ""
                    }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}