const rupeeFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('en-IN');

export function formatRupees(amount) {
  return rupeeFormatter.format(amount ?? 0);
}

export function formatPaise(paise) {
  return rupeeFormatter.format((paise ?? 0) / 100);
}

export function formatNumber(value) {
  return numberFormatter.format(value ?? 0);
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** "3 minutes ago" / "in 4 hours" — the unit is chosen by magnitude. */
export function formatRelative(value) {
  if (!value) return 'never';

  const deltaMs = new Date(value).getTime() - Date.now();
  const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  const units = [
    ['year', 365 * 24 * 60 * 60 * 1000],
    ['month', 30 * 24 * 60 * 60 * 1000],
    ['day', 24 * 60 * 60 * 1000],
    ['hour', 60 * 60 * 1000],
    ['minute', 60 * 1000],
  ];

  for (const [unit, unitMs] of units) {
    if (Math.abs(deltaMs) >= unitMs) return relative.format(Math.round(deltaMs / unitMs), unit);
  }

  return 'just now';
}

/** Countdown rendering for the daily-bonus timer: "23h 14m" / "4m 08s". */
export function formatDuration(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor((milliseconds ?? 0) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  return `${seconds}s`;
}

export function initialsOf(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
