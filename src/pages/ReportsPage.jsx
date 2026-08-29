import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Flag, ShieldCheck } from 'lucide-react';

import { Badge, StatusBadge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { EmptyState, ErrorState, SkeletonRows } from '../components/ui/Feedback.jsx';
import { Field, Select, Textarea } from '../components/ui/Field.jsx';
import { PageHeader } from '../components/layout/AppLayout.jsx';
import { Pagination, TCell, THead, TRow, Table } from '../components/ui/Table.jsx';
import { formatDateTime, formatRelative } from '../lib/format.js';
import { useReports, useReviewReport } from '../hooks/queries.js';

const COLUMNS = [
  { key: 'reported', label: 'Reported' },
  { key: 'reason', label: 'Reason' },
  { key: 'reporter', label: 'Reported by' },
  { key: 'status', label: 'Status' },
  { key: 'when', label: 'Filed', align: 'right' },
];

const REASON_TONES = {
  harassment: 'danger',
  sexual_content: 'danger',
  underage: 'danger',
  scam: 'warning',
  spam: 'warning',
  fake_profile: 'info',
  other: 'neutral',
};

function ReviewDialog({ report, onClose }) {
  const [status, setStatus] = useState('actioned');
  const [note, setNote] = useState('');
  const review = useReviewReport();

  if (!report) return null;

  async function handleSubmit() {
    await review.mutateAsync({ reportId: report.id, status, reviewNote: note.trim() });
    onClose();
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Report against ${report.reportedUser.nickname ?? 'user'}`}
      description={`${report.reason.replace(/_/g, ' ')} · filed ${formatDateTime(report.createdAt)}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={review.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={review.isPending}>
            Save decision
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {report.details && (
          <div>
            <p className="mb-1 text-xs font-medium text-ink-500">What they said</p>
            <p className="rounded-xl bg-ink-50 px-3.5 py-2.5 text-sm text-ink-700">{report.details}</p>
          </div>
        )}

        {report.messageSnapshots?.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium text-ink-500">
              Messages from the reported account, captured when the report was filed
            </p>
            {/* Snapshots, not live messages: the sender can delete the originals
                and a moderator still needs to see what was reported. */}
            <ul className="scrollbar-thin max-h-56 space-y-2 overflow-y-auto rounded-xl bg-ink-50 p-3">
              {report.messageSnapshots.map((snapshot, index) => (
                <li key={snapshot.messageId ?? index} className="text-sm">
                  <p className="text-ink-800">{snapshot.text}</p>
                  <p className="text-[11px] text-ink-500">{formatDateTime(snapshot.sentAt)}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Link to={`/users/${report.reportedUser.id}`}>
            <Button variant="outline" size="sm">
              Open reported account
            </Button>
          </Link>
          {report.reporter?.id && (
            <Link to={`/users/${report.reporter.id}`}>
              <Button variant="ghost" size="sm">
                Open reporter
              </Button>
            </Link>
          )}
        </div>

        <Field label="Decision">
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="reviewing">Still looking into it</option>
            <option value="actioned">Action taken</option>
            <option value="dismissed">No action needed</option>
          </Select>
        </Field>

        <Field label="Note" hint="Internal only. Kept with the report.">
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="e.g. Suspended for 7 days, second offence"
            maxLength={500}
          />
        </Field>

        <p className="text-xs text-ink-500">
          Marking a report actioned does not suspend anyone by itself — do that from the account page.
        </p>
      </div>
    </Modal>
  );
}

export function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [reviewing, setReviewing] = useState(null);

  const status = searchParams.get('status') ?? 'open';

  const { data, isLoading, error, refetch } = useReports({
    page,
    limit: 20,
    ...(status ? { status } : {}),
  });

  const reports = data?.items ?? [];

  return (
    <>
      <PageHeader
        title="Reports"
        description="What users have flagged. Reporting also blocks the account for the reporter automatically."
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-ink-200/70 p-4">
          <Select
            value={status}
            onChange={(event) => {
              const next = new URLSearchParams(searchParams);
              if (event.target.value) next.set('status', event.target.value);
              else next.delete('status');
              setSearchParams(next, { replace: true });
              setPage(1);
            }}
            aria-label="Filter by status"
            className="w-auto"
          >
            <option value="open">Open</option>
            <option value="reviewing">Being reviewed</option>
            <option value="actioned">Actioned</option>
            <option value="dismissed">Dismissed</option>
            <option value="">All reports</option>
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
                  <SkeletonRows rows={6} columns={COLUMNS.length} />
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length}>
                      <EmptyState
                        icon={status === 'open' ? ShieldCheck : Flag}
                        title={status === 'open' ? 'Nothing needs review' : 'No reports here'}
                        description={
                          status === 'open'
                            ? 'Every open report has been dealt with.'
                            : 'Try a different status filter.'
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <TRow key={report.id} onClick={() => setReviewing(report)}>
                      <TCell>
                        <span className="font-medium text-ink-900">
                          {report.reportedUser.nickname ?? 'Unknown'}
                        </span>
                        {report.reportedUser.status && (
                          <span className="ml-2">
                            <StatusBadge status={report.reportedUser.status} />
                          </span>
                        )}
                      </TCell>

                      <TCell>
                        <Badge tone={REASON_TONES[report.reason] ?? 'neutral'}>
                          {report.reason.replace(/_/g, ' ')}
                        </Badge>
                        {report.details && (
                          <span className="mt-1 block max-w-[18rem] truncate text-xs text-ink-500">
                            {report.details}
                          </span>
                        )}
                      </TCell>

                      <TCell className="text-ink-600">{report.reporter.nickname ?? '—'}</TCell>

                      <TCell>
                        <StatusBadge status={report.status} />
                      </TCell>

                      <TCell align="right" className="text-xs text-ink-500">
                        {formatRelative(report.createdAt)}
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

      <ReviewDialog report={reviewing} onClose={() => setReviewing(null)} />
    </>
  );
}
