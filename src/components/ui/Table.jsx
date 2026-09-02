import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from './Button.jsx';

export function Table({ children, className = '' }) {
  return (
    /*
     * Horizontal scroll is the fallback, not the plan. Low-priority columns are
     * marked `hidden md:table-cell` by each page so a phone shows the three or
     * four that matter, and the minimum width is small enough that what remains
     * fits a 360px screen without scrolling at all.
     */
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full min-w-[320px] border-collapse text-sm">{children}</table>
    </div>
  );
}

export function THead({ columns, children }) {
  if (children) {
    return <thead>{children}</thead>;
  }
  if (!Array.isArray(columns)) return null;
  return (
    <thead>
      <tr className="border-b border-ink-200 bg-ink-50/60">
        {columns.map((column) => (
          <th
            key={column.key ?? column.label}
            scope="col"
            className={`px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500
                        sm:px-4 ${column.align === 'right' ? 'text-right' : ''} ${column.className ?? ''}`}
          >
            {column.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function TRow({ onClick, children, className = '' }) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-ink-100 last:border-0 transition
                  ${onClick ? 'cursor-pointer hover:bg-ink-50' : ''} ${className}`}
    >
      {children}
    </tr>
  );
}

export function TCell({ align, className = '', children, ...props }) {
  return (
    <td
      className={`px-3 py-3.5 align-middle text-ink-700 sm:px-4
                  ${align === 'right' ? 'text-right' : ''} ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}

export function Pagination({ meta, page, onPageChange }) {
  if (!meta || meta.totalPages <= 1) return null;

  const from = (page - 1) * meta.limit + 1;
  const to = Math.min(page * meta.limit, meta.total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-200/70 px-4 py-3">
      <p className="text-xs text-ink-500">
        Showing <span className="font-medium text-ink-700">{from}</span>–
        <span className="font-medium text-ink-700">{to}</span> of{' '}
        <span className="font-medium text-ink-700">{meta.total}</span>
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-2 text-xs font-medium text-ink-600" aria-live="polite">
          {page} / {meta.totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= meta.totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
