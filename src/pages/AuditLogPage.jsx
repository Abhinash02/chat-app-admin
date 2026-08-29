import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ScrollText } from 'lucide-react';

import { Badge } from '../components/ui/Badge.jsx';
import { Card } from '../components/ui/Card.jsx';
import { EmptyState, ErrorState, SkeletonRows } from '../components/ui/Feedback.jsx';
import { Select } from '../components/ui/Field.jsx';
import { PageHeader } from '../components/layout/AppLayout.jsx';
import { Pagination, TCell, THead, TRow, Table } from '../components/ui/Table.jsx';
import { formatDateTime, formatNumber } from '../lib/format.js';
import { useAuditLog } from '../hooks/queries.js';

const COLUMNS = [
  { key: 'action', label: 'Action' },
  { key: 'admin', label: 'By' },
  { key: 'target', label: 'Target' },
  { key: 'detail', label: 'Detail' },
  { key: 'when', label: 'When', align: 'right' },
];

const ACTION_TONES = {
  'user.suspended': 'danger',
  'user.deleted': 'danger',
  'user.reactivated': 'success',
  'user.force_logged_out': 'warning',
  'coins.adjusted': 'brand',
  'coins.free_talk_reset': 'info',
  'payment.approved': 'success',
  'payment.rejected': 'danger',
};

/** Renders the metadata each action type actually carries. */
function ActionDetail({ entry }) {
  const meta = entry.metadata ?? {};

  if (entry.action === 'coins.adjusted') {
    return (
      <span className="text-ink-600">
        <span className={`font-medium ${meta.amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {meta.amount > 0 ? '+' : ''}
          {formatNumber(meta.amount)} coins
        </span>
        {meta.reason && <span className="block truncate text-xs text-ink-500">{meta.reason}</span>}
      </span>
    );
  }

  if (meta.reason) return <span className="text-xs text-ink-600">{meta.reason}</span>;

  return <span className="text-xs text-ink-400">—</span>;
}

export function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');

  const { data, isLoading, error, refetch } = useAuditLog({
    page,
    limit: 25,
    ...(action ? { action } : {}),
  });

  const entries = data?.items ?? [];

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Every privileged action, permanently recorded. Entries are never edited or removed."
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-ink-200/70 p-4">
          <Select
            value={action}
            onChange={(event) => {
              setAction(event.target.value);
              setPage(1);
            }}
            aria-label="Filter by action"
            className="w-auto"
          >
            <option value="">All actions</option>
            <option value="coins.adjusted">Coin adjustments</option>
            <option value="user.suspended">Suspensions</option>
            <option value="user.reactivated">Reactivations</option>
            <option value="user.deleted">Deletions</option>
            <option value="user.force_logged_out">Forced sign-outs</option>
            <option value="coins.free_talk_reset">Free time resets</option>
          </Select>
        </div>

        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : (
          <>
            <Table>
              <THead columns={COLUMNS} />
              <tbody>
                {isLoading ? (
                  <SkeletonRows rows={8} columns={COLUMNS.length} />
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length}>
                      <EmptyState
                        icon={ScrollText}
                        title="Nothing recorded yet"
                        description="Suspensions, coin adjustments and payment decisions all appear here."
                      />
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <TRow key={entry._id}>
                      <TCell>
                        <Badge tone={ACTION_TONES[entry.action] ?? 'neutral'}>
                          {entry.action.replace(/[._]/g, ' ')}
                        </Badge>
                      </TCell>

                      <TCell className="text-ink-700">
                        {entry.adminId?.name ?? 'Unknown'}
                        {entry.adminId?.email && (
                          <span className="block truncate text-xs text-ink-500">{entry.adminId.email}</span>
                        )}
                      </TCell>

                      <TCell>
                        {entry.targetType === 'user' && entry.targetId ? (
                          <Link
                            to={`/users/${entry.targetId}`}
                            className="font-mono text-xs text-brand-600 hover:underline"
                          >
                            {entry.targetId.slice(-8)}
                          </Link>
                        ) : (
                          <span className="text-xs text-ink-400">—</span>
                        )}
                      </TCell>

                      <TCell>
                        <ActionDetail entry={entry} />
                      </TCell>

                      <TCell align="right" className="whitespace-nowrap text-xs text-ink-500">
                        {formatDateTime(entry.createdAt)}
                      </TCell>
                    </TRow>
                  ))
                )}
              </tbody>
            </Table>

            <Pagination meta={data?.meta} page={page} onPageChange={setPage} />
          </>
        )}
      </Card>
    </>
  );
}
