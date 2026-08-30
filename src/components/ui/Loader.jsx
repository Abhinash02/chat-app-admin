/**
 * Loading states for the panel.
 *
 * Three shapes for three different waits: dots for something inline and quick,
 * a skeleton for content whose shape is already known, and a full-page state
 * for a screen that has nothing to show yet. Using a skeleton where the layout
 * is predictable makes the wait feel shorter than a spinner does, because the
 * page stops jumping when the data lands.
 */

export function DotsLoader({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} role="status" aria-label="Loading">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="h-1.5 w-1.5 rounded-full bg-brand-500"
          style={{
            animation: 'dot-bounce 1.2s infinite ease-in-out',
            // Staggering is what makes it a wave rather than three dots
            // blinking in unison.
            animationDelay: `${index * 0.16}s`,
          }}
        />
      ))}
    </span>
  );
}

export function Shimmer({ className = '', style }) {
  return <span className={`block rounded-md shimmer ${className}`} style={style} aria-hidden="true" />;
}

/** Skeleton rows sized to the table they stand in for. */
export function TableSkeleton({ rows = 6, columns = 4 }) {
  return Array.from({ length: rows }).map((_, rowIndex) => (
    <tr key={rowIndex} className="border-b border-ink-100 last:border-0">
      {Array.from({ length: columns }).map((__, columnIndex) => (
        <td key={columnIndex} className="px-4 py-3.5">
          <Shimmer
            className="h-3.5"
            // Varying the widths stops the placeholder reading as a grid of
            // identical grey bars.
            style={{ width: `${45 + ((rowIndex * 3 + columnIndex * 7) % 5) * 11}%` }}
          />
        </td>
      ))}
    </tr>
  ));
}

export function CardSkeleton({ className = '' }) {
  return (
    <div className={`card p-5 ${className}`}>
      <Shimmer className="h-3 w-1/3" />
      <Shimmer className="mt-3 h-7 w-1/2" />
      <Shimmer className="mt-2 h-3 w-2/3" />
    </div>
  );
}

/**
 * The full-page state. The mark scales gently rather than spinning, because a
 * spinner next to a brand mark reads as two things loading, not one.
 */
export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20" role="status">
      <div className="relative grid h-14 w-14 place-items-center">
        <span
          className="absolute inset-0 rounded-2xl bg-brand-500/15"
          style={{ animation: 'dot-bounce 1.6s infinite ease-in-out' }}
        />
        <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 text-lg font-bold text-white">
          V
        </span>
      </div>

      <p className="text-sm text-ink-500">{label}</p>
      <DotsLoader />
    </div>
  );
}

/** A small inline spinner, for buttons and toolbars. */
export function InlineSpinner({ className = '' }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-ink-300 border-t-brand-500 ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
