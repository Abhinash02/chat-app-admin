import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';

import { Button } from './Button.jsx';
import { DotsLoader, InlineSpinner, PageLoader, TableSkeleton } from './Loader.jsx';

export function Spinner({ className = '' }) {
  return <InlineSpinner className={className} />;
}

export function LoadingState({ label = 'Loading…', className = '' }) {
  return (
    <div className={className}>
      <PageLoader label={label} />
    </div>
  );
}

export { DotsLoader };

/**
 * Skeleton rows keep the table's height stable between loading and loaded, so
 * the page does not jump under the operator's cursor.
 */
export function SkeletonRows({ rows = 5, columns = 4 }) {
  return <TableSkeleton rows={rows} columns={columns} />;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-16 text-center ${className}`}>
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-ink-100">
        <Icon className="h-5 w-5 text-ink-400" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-ink-800">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-ink-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/**
 * A failed panel must say what broke and offer a way forward — an operator
 * cannot act on a blank screen or a spinner that never stops.
 */
export function ErrorState({ error, onRetry, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-16 text-center ${className}`}>
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-red-50">
        <AlertTriangle className="h-5 w-5 text-red-500" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-ink-800">{error?.message ?? 'Something went wrong'}</p>
      {error?.code && <p className="mt-1 font-mono text-[11px] text-ink-400">{error.code}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" icon={RefreshCw} className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
