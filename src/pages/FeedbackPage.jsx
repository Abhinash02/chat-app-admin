import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MessageSquareHeart, Star, Sparkles, CheckCircle, Mail, Bell } from 'lucide-react';

import { Badge, StatusBadge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { EmptyState, ErrorState, SkeletonRows } from '../components/ui/Feedback.jsx';
import { Field, Select, Textarea } from '../components/ui/Field.jsx';
import { PageHeader } from '../components/layout/AppLayout.jsx';
import { Pagination, TCell, THead, TRow, Table } from '../components/ui/Table.jsx';
import { formatDateTime, formatRelative } from '../lib/format.js';
import { useFeedback, useUpdateFeedbackStatus } from '../hooks/queries.js';

const COLUMNS = [
  { key: 'user', label: 'User' },
  { key: 'category', label: 'Category' },
  { key: 'rating', label: 'Rating', className: 'hidden sm:table-cell' },
  { key: 'message', label: 'Feedback Message' },
  { key: 'status', label: 'Status' },
  { key: 'when', label: 'Received', align: 'right', className: 'hidden sm:table-cell' },
];

const CATEGORY_MAP = {
  suggestion: { label: '💡 Suggestion', tone: 'info' },
  bug: { label: '🐛 Bug Issue', tone: 'danger' },
  compliment: { label: '❤️ Compliment', tone: 'brand' },
  other: { label: '❓ Other', tone: 'neutral' },
};

function FeedbackModal({ item, onClose }) {
  const [status, setStatus] = useState(item?.status ?? 'resolved');
  const [adminNote, setAdminNote] = useState(item?.adminNote ?? '');
  const updateStatus = useUpdateFeedbackStatus();

  if (!item) return null;

  async function handleSubmit() {
    await updateStatus.mutateAsync({
      feedbackId: item.id,
      status,
      adminNote: adminNote.trim(),
    });
    onClose();
  }

  const categoryMeta = CATEGORY_MAP[item.category] ?? { label: item.category, tone: 'neutral' };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Feedback from ${item.user?.nickname ?? item.user?.name ?? 'Guest User'}`}
      description={`${categoryMeta.label} · Submitted ${formatDateTime(item.createdAt)}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={updateStatus.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={updateStatus.isPending}>
            Update Status & Notify User
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* User Info */}
        <div className="flex items-center justify-between rounded-xl bg-ink-50 p-3.5">
          <div className="min-w-0">
            <p className="font-semibold text-ink-900">{item.user?.nickname ?? item.user?.name ?? 'Anonymous'}</p>
            <p className="text-xs text-ink-500">{item.user?.email ?? 'No email on account'}</p>
          </div>
          {item.user?.id && (
            <Link to={`/users/${item.user.id}`}>
              <Button variant="outline" size="sm">
                View Profile
              </Button>
            </Link>
          )}
        </div>

        {/* Rating & Category */}
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={categoryMeta.tone}>{categoryMeta.label}</Badge>
          <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            <span>{item.rating} / 5 Stars</span>
          </div>
          {item.deviceInfo && (
            <span className="text-xs text-ink-400">Device: {item.deviceInfo}</span>
          )}
        </div>

        {/* Original Message */}
        <div>
          <p className="mb-1 text-xs font-medium text-ink-500">User's Feedback</p>
          <div className="rounded-xl border border-ink-200/70 bg-white p-3.5 text-sm leading-relaxed text-ink-800 shadow-sm">
            {item.message}
          </div>
        </div>

        {/* Status Form */}
        <div className="border-t border-ink-200/70 pt-4 space-y-4">
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="new">🟡 New / Pending</option>
              <option value="reviewed">🔵 Under Review</option>
              <option value="resolved">🟢 Resolved ✓</option>
              <option value="rejected">⚪ Rejected / Closed</option>
            </Select>
          </Field>

          <Field
            label="Response Note (Sent to User)"
            hint="This note will be included in the user's Push Notification & Email update."
          >
            <Textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="e.g. Thank you! We fixed this bug in the latest app build."
              maxLength={500}
            />
          </Field>

          <div className="flex items-center gap-4 rounded-xl bg-violet-50/70 p-3 text-xs text-violet-700">
            <div className="flex items-center gap-1.5 font-medium">
              <Bell className="h-3.5 w-3.5" /> Push Notification
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <Mail className="h-3.5 w-3.5" /> Email Notification
            </div>
            <span className="ml-auto text-violet-500">Automatically dispatched on save</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function FeedbackPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [activeFeedback, setActiveFeedback] = useState(null);

  const status = searchParams.get('status') ?? '';
  const category = searchParams.get('category') ?? '';

  const { data, isLoading, error, refetch } = useFeedback({
    page,
    limit: 20,
    ...(status ? { status } : {}),
    ...(category ? { category } : {}),
  });

  const feedbackList = data?.items ?? [];

  return (
    <>
      <PageHeader
        title="User Feedback"
        description="Suggestions, bug reports, and compliments submitted by users. Updating status notifies the user in real-time."
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
            <option value="">All statuses</option>
            <option value="new">🟡 New</option>
            <option value="reviewed">🔵 Under Review</option>
            <option value="resolved">🟢 Resolved</option>
            <option value="rejected">⚪ Rejected</option>
          </Select>

          <Select
            value={category}
            onChange={(event) => {
              const next = new URLSearchParams(searchParams);
              if (event.target.value) next.set('category', event.target.value);
              else next.delete('category');
              setSearchParams(next, { replace: true });
              setPage(1);
            }}
            aria-label="Filter by category"
            className="w-auto"
          >
            <option value="">All categories</option>
            <option value="suggestion">💡 Suggestions</option>
            <option value="bug">🐛 Bugs</option>
            <option value="compliment">❤️ Compliments</option>
            <option value="other">❓ Other</option>
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
                ) : feedbackList.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length}>
                      <EmptyState
                        icon={MessageSquareHeart}
                        title="No feedback found"
                        description="User feedback and feature suggestions will appear here."
                      />
                    </td>
                  </tr>
                ) : (
                  feedbackList.map((item) => {
                    const catMeta = CATEGORY_MAP[item.category] ?? {
                      label: item.category,
                      tone: 'neutral',
                    };
                    return (
                      <TRow key={item.id} onClick={() => setActiveFeedback(item)}>
                        <TCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-ink-900">
                              {item.user?.nickname ?? item.user?.name ?? 'Guest'}
                            </span>
                            {item.user?.email && (
                              <span className="text-xs text-ink-400">({item.user.email})</span>
                            )}
                          </div>
                        </TCell>

                        <TCell>
                          <Badge tone={catMeta.tone}>{catMeta.label}</Badge>
                        </TCell>

                        <TCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                            <span>{item.rating}</span>
                          </div>
                        </TCell>

                        <TCell>
                          <span className="block max-w-[20rem] truncate text-sm text-ink-700">
                            {item.message}
                          </span>
                          {item.adminNote && (
                            <span className="block max-w-[20rem] truncate text-xs text-emerald-600">
                              Reply: {item.adminNote}
                            </span>
                          )}
                        </TCell>

                        <TCell>
                          <StatusBadge status={item.status} />
                        </TCell>

                        <TCell align="right" className="hidden text-xs text-ink-500 sm:table-cell">
                          {formatRelative(item.createdAt)}
                        </TCell>
                      </TRow>
                    );
                  })
                )}
              </tbody>
            </Table>

            <Pagination meta={data?.meta} page={page} onPageChange={setPage} />
          </>
        )}
      </Card>

      <FeedbackModal item={activeFeedback} onClose={() => setActiveFeedback(null)} />
    </>
  );
}
