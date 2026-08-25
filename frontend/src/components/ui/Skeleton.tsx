/** Skeleton shimmer block for loading states */
function Block({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-border-subtle animate-pulse rounded-md ${className}`}
      aria-hidden="true"
    />
  )
}

/** A single table row skeleton */
function TableRow() {
  return (
    <tr className="border-b border-border-subtle">
      <td className="px-4 py-3"><Block className="h-4 w-32" /></td>
      <td className="px-4 py-3"><Block className="h-4 w-20" /></td>
      <td className="px-4 py-3"><Block className="h-4 w-24" /></td>
      <td className="px-4 py-3"><Block className="h-4 w-24" /></td>
      <td className="px-4 py-3"><Block className="h-4 w-16" /></td>
      <td className="px-4 py-3"><Block className="h-6 w-20 rounded-full" /></td>
      <td className="px-4 py-3"><Block className="h-4 w-10" /></td>
    </tr>
  )
}

/** Full table skeleton (8 rows) */
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i} />
      ))}
    </tbody>
  )
}

/** Metric card skeleton */
export function MetricSkeleton() {
  return (
    <div className="bg-surface rounded-xl border border-border p-5">
      <Block className="h-3 w-24 mb-3" />
      <Block className="h-7 w-32" />
    </div>
  )
}

/** Generic block skeleton */
export default Block
