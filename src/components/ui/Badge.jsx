const TONES = {
  neutral: 'bg-ink-100 text-ink-700',
  brand: 'bg-brand-100 text-brand-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-sky-100 text-sky-700',
  purple: 'bg-violet-100 text-violet-700',
};

export function Badge({ tone = 'neutral', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium
                  whitespace-nowrap ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/** A green dot is the product's own language for "online", so it is reused here. */
export function PresenceDot({ isOnline, className = '' }) {
  return (
    <span
      title={isOnline ? 'Online' : 'Offline'}
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${
        isOnline ? 'bg-emerald-500 ring-2 ring-emerald-500/25' : 'bg-ink-300'
      } ${className}`}
    />
  );
}

const STATUS_TONES = {
  active: 'success',
  pending_verification: 'warning',
  suspended: 'danger',
  deleted: 'neutral',
  paid: 'success',
  created: 'neutral',
  awaiting_verification: 'warning',
  failed: 'danger',
  rejected: 'danger',
  expired: 'neutral',
  open: 'warning',
  reviewing: 'info',
  actioned: 'success',
  dismissed: 'neutral',
  live: 'success',
  closed: 'neutral',
};

/** Renders any backend status enum consistently, wherever it appears. */
export function StatusBadge({ status }) {
  if (!status) return null;
  const label = String(status).replace(/_/g, ' ');
  return <Badge tone={STATUS_TONES[status] ?? 'neutral'}>{label}</Badge>;
}
