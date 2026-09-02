import { useState } from 'react';
import { Calendar, CheckCircle2, Megaphone, Plus, Radio, Send, Trash2, Zap } from 'lucide-react';

import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { ConfirmDialog, Modal } from '../components/ui/Modal.jsx';
import { EmptyState, ErrorState, SkeletonRows } from '../components/ui/Feedback.jsx';
import { Field, Input, Select, Textarea } from '../components/ui/Field.jsx';
import { PageHeader } from '../components/layout/AppLayout.jsx';
import { Pagination, TCell, THead, TRow, Table } from '../components/ui/Table.jsx';
import { formatRelative } from '../lib/format.js';
import {
  useBroadcastEvent,
  useCreateEvent,
  useDeleteEvent,
  useEvents,
  useUpdateEvent,
} from '../hooks/queries.js';

const COLUMNS = [
  { key: 'title', label: 'Event & Offer' },
  { key: 'type', label: 'Type' },
  { key: 'target', label: 'Target Audience' },
  { key: 'perks', label: 'Perks / Discounts' },
  { key: 'timing', label: 'Schedule' },
  { key: 'status', label: 'Live' },
  { key: 'actions', label: '', align: 'right' },
];

function EventFormModal({ isOpen, onClose, onBroadcastStarted, initialData = null }) {
  const isEditing = Boolean(initialData);
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();

  const [form, setForm] = useState(() => ({
    title: initialData?.title || '',
    description: initialData?.description || '',
    type: initialData?.type || 'offer',
    badgeText: initialData?.badgeText || 'HOT',
    targetGender: initialData?.targetGender || 'all',
    rewardCoins: initialData?.rewardCoins || 0,
    rewardFreeMinutes: initialData?.rewardFreeMinutes || 0,
    discountPercent: initialData?.discountPercent || 0,
    actionUrl: initialData?.actionUrl || 'coins',
    startsAt: initialData?.startsAt ? new Date(initialData.startsAt).toISOString().slice(0, 16) : '',
    endsAt: initialData?.endsAt ? new Date(initialData.endsAt).toISOString().slice(0, 16) : '',
    isActive: initialData?.isActive !== false,
    sendPush: true,
    sendEmail: true,
  }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;

    if (isEditing) {
      await updateEvent.mutateAsync({
        eventId: initialData.id,
        ...form,
        rewardCoins: Number(form.rewardCoins) || 0,
        rewardFreeMinutes: Number(form.rewardFreeMinutes) || 0,
        discountPercent: Number(form.discountPercent) || 0,
      });
      onClose();
    } else {
      onClose();
      onBroadcastStarted?.({
        title: form.title,
        status: 'sending',
        pushSent: 0,
        emailsSent: 0,
      });

      try {
        const res = await createEvent.mutateAsync({
          ...form,
          rewardCoins: Number(form.rewardCoins) || 0,
          rewardFreeMinutes: Number(form.rewardFreeMinutes) || 0,
          discountPercent: Number(form.discountPercent) || 0,
        });

        onBroadcastStarted?.({
          title: form.title,
          status: 'completed',
          pushSent: res?.broadcast?.pushSent ?? 0,
          emailsSent: res?.broadcast?.emailsSent ?? 0,
        });
      } catch (err) {
        onBroadcastStarted?.({
          title: form.title,
          status: 'failed',
          error: err?.message || 'Failed to broadcast event',
        });
      }
    }
  }

  const isSaving = createEvent.isPending || updateEvent.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Event / Offer' : '🚀 Post New Event & Offer'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Event Title" hint="e.g. Diwali Mega Coins Offer / Happy Hours">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Weekend Free Chat for Boys"
              required
              autoFocus
            />
          </Field>

          <Field label="Event Category">
            <Select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="offer">Special Offer / Sale</option>
              <option value="free_chat">Free Chat Time for Boys</option>
              <option value="bonus_coins">Free Bonus Coins</option>
              <option value="festival">Festival Celebration</option>
              <option value="announcement">Important Announcement</option>
            </Select>
          </Field>
        </div>

        <Field label="Description & Details">
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe the offer details, terms, and why users should participate…"
            rows={3}
            required
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Target Audience">
            <Select
              value={form.targetGender}
              onChange={(e) => setForm({ ...form, targetGender: e.target.value })}
            >
              <option value="all">👥 All Users (Everyone)</option>
              <option value="male">👦 Boys Only (Male)</option>
              <option value="female">👧 Girls Only (Female)</option>
            </Select>
          </Field>

          <Field label="Badge Tag">
            <Input
              value={form.badgeText}
              onChange={(e) => setForm({ ...form, badgeText: e.target.value })}
              placeholder="e.g. HOT, 50% OFF, LIMITED"
              maxLength={20}
            />
          </Field>

          <Field label="Tapping Action">
            <Select
              value={form.actionUrl}
              onChange={(e) => setForm({ ...form, actionUrl: e.target.value })}
            >
              <option value="coins">Open Coins Store (Get Coins)</option>
              <option value="rooms">Open Voice & Text Rooms</option>
              <option value="chats">Open Messages</option>
            </Select>
          </Field>
        </div>

        {/* Perks & Discount Options */}
        <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-900">
            🎁 Associated Perks & Price Reduction
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Free Coins Reward" hint="0 = None">
              <Input
                type="number"
                min="0"
                value={form.rewardCoins}
                onChange={(e) => setForm({ ...form, rewardCoins: e.target.value })}
              />
            </Field>

            <Field label="Free Chat Mins" hint="For male talk time">
              <Input
                type="number"
                min="0"
                value={form.rewardFreeMinutes}
                onChange={(e) => setForm({ ...form, rewardFreeMinutes: e.target.value })}
              />
            </Field>

            <Field label="Discount % on Packs" hint="Reduces package price">
              <Input
                type="number"
                min="0"
                max="100"
                value={form.discountPercent}
                onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
              />
            </Field>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Starts At" hint="Leave empty to start immediately">
            <Input
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
            />
          </Field>

          <Field label="Ends At" hint="Leave empty for ongoing">
            <Input
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
            />
          </Field>
        </div>

        {!isEditing && (
          <div className="rounded-xl border border-ink-200 bg-ink-50/60 p-3.5 space-y-2">
            <p className="text-xs font-semibold text-ink-900 uppercase tracking-wider">
              📢 Instant Multi-Channel Alerts
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-medium text-ink-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.sendPush}
                  onChange={(e) => setForm({ ...form, sendPush: e.target.checked })}
                  className="rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                />
                <span>📱 Send Instant Push Notification to Target Users</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.sendEmail}
                  onChange={(e) => setForm({ ...form, sendEmail: e.target.checked })}
                  className="rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                />
                <span>📧 Send Email Announcement to Target Users</span>
              </label>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="brand" type="submit" isLoading={isSaving}>
            {isEditing ? 'Save Changes' : 'Publish & Broadcast Event'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function EventsPage() {
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [broadcastTarget, setBroadcastTarget] = useState(null);
  const [broadcastProgress, setBroadcastProgress] = useState(null);

  const { data, isLoading, error, refetch } = useEvents({ page, limit: 10 });
  const deleteEvent = useDeleteEvent();
  const broadcastEvent = useBroadcastEvent();
  const updateEvent = useUpdateEvent();

  const events = data?.items ?? [];

  async function handleConfirmBroadcast() {
    if (!broadcastTarget) return;
    const target = broadcastTarget;
    setBroadcastTarget(null);
    setBroadcastProgress({
      title: target.title,
      status: 'sending',
      pushSent: 0,
      emailsSent: 0,
    });

    try {
      const res = await broadcastEvent.mutateAsync({
        eventId: target.id,
        sendPush: true,
        sendEmail: true,
      });

      setBroadcastProgress({
        title: target.title,
        status: 'completed',
        pushSent: res?.pushSent ?? 0,
        emailsSent: res?.emailsSent ?? 0,
      });
    } catch (err) {
      setBroadcastProgress({
        title: target.title,
        status: 'failed',
        error: err?.message || 'Broadcast failed',
      });
    }
  }

  return (
    <>
      <PageHeader
        title="Events & Offers"
        subtitle="Post special offers, festival celebrations, free chat hours, and bonus coin drops with automated instant push and email delivery."
      >
        <Button variant="brand" icon={Plus} onClick={() => setIsCreateOpen(true)}>
          Post New Event
        </Button>
      </PageHeader>

      {/* Live Broadcast Progress Banner if Active */}
      {broadcastProgress && (
        <Card className="mb-6 border-brand-200 bg-brand-50/50 p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${
                    broadcastProgress.status === 'sending'
                      ? 'animate-ping bg-brand-500'
                      : broadcastProgress.status === 'completed'
                      ? 'bg-emerald-500'
                      : 'bg-red-500'
                  }`}
                />
                <h4 className="text-sm font-bold text-ink-900">
                  {broadcastProgress.status === 'sending'
                    ? `📢 Dispatching Event: "${broadcastProgress.title}"...`
                    : broadcastProgress.status === 'completed'
                    ? `✓ Broadcast Complete: "${broadcastProgress.title}"`
                    : `✕ Broadcast Failed: "${broadcastProgress.title}"`}
                </h4>
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-md bg-white px-2 py-0.5 font-semibold text-emerald-700 shadow-xs">
                  ✓ {broadcastProgress.pushSent ?? 0} Push Tokens Reached
                </span>
                <span className="rounded-md bg-white px-2 py-0.5 font-semibold text-indigo-700 shadow-xs">
                  ✉️ {broadcastProgress.emailsSent ?? 0} Emails Dispatched
                </span>
                <span className="rounded-md bg-white px-2 py-0.5 font-semibold text-purple-700 shadow-xs">
                  ⚡ Live In-App Announcement Broadcasted
                </span>
              </div>
            </div>

            {/* Progress Bar & Dismiss Button */}
            <div className="flex items-center gap-3">
              {broadcastProgress.status === 'sending' ? (
                <div className="w-32">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-ink-200">
                    <div className="h-full w-2/3 animate-pulse rounded-full bg-brand-500" />
                  </div>
                  <span className="text-[10px] text-ink-500">Processing live queue...</span>
                </div>
              ) : (
                <Button size="xs" variant="secondary" onClick={() => setBroadcastProgress(null)}>
                  Dismiss
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      <Card>
        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : (
          <>
            <Table>
              <THead columns={COLUMNS} />
              <tbody>
                {isLoading ? (
                  <SkeletonRows rows={6} columns={COLUMNS.length} />
                ) : events.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length}>
                      <EmptyState
                        icon={Calendar}
                        title="No events posted yet"
                        description="Click 'Post New Event' to publish offers, free chat hours, or discount events to your users."
                      />
                    </td>
                  </tr>
                ) : (
                  events.map((event) => (
                    <TRow key={event.id}>
                      <TCell>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink-900">{event.title}</span>
                          {event.badgeText && (
                            <span className="rounded-md bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
                              {event.badgeText}
                            </span>
                          )}
                        </div>
                        <p className="max-w-md truncate text-xs text-ink-500 mt-0.5">
                          {event.description}
                        </p>
                      </TCell>

                      <TCell>
                        <Badge
                          tone={
                            event.type === 'free_chat'
                              ? 'success'
                              : event.type === 'offer'
                              ? 'brand'
                              : 'info'
                          }
                        >
                          {event.type === 'free_chat'
                            ? 'Free Chat'
                            : event.type === 'bonus_coins'
                            ? 'Bonus Coins'
                            : event.type === 'festival'
                            ? 'Festival'
                            : 'Offer'}
                        </Badge>
                      </TCell>

                      <TCell>
                        <Badge tone={event.targetGender === 'all' ? 'neutral' : 'warning'}>
                          {event.targetGender === 'male'
                            ? '👦 Boys Only'
                            : event.targetGender === 'female'
                            ? '👧 Girls Only'
                            : '👥 Everyone'}
                        </Badge>
                      </TCell>

                      <TCell>
                        <div className="text-xs">
                          {event.rewardCoins > 0 && (
                            <span className="block font-semibold text-amber-600">
                              🪙 +{event.rewardCoins} Coins
                            </span>
                          )}
                          {event.discountPercent > 0 && (
                            <span className="block font-semibold text-emerald-600">
                              🏷️ {event.discountPercent}% OFF
                            </span>
                          )}
                          {event.rewardFreeMinutes > 0 && (
                            <span className="block text-indigo-600">
                              ⏱️ +{event.rewardFreeMinutes}m Free
                            </span>
                          )}
                          {!event.rewardCoins &&
                            !event.discountPercent &&
                            !event.rewardFreeMinutes && (
                              <span className="text-ink-400">—</span>
                            )}
                        </div>
                      </TCell>

                      <TCell className="text-xs text-ink-600">
                        <span>{formatRelative(event.startsAt)}</span>
                        {event.endsAt && (
                          <span className="block text-[11px] text-ink-400">
                            Until {new Date(event.endsAt).toLocaleDateString()}
                          </span>
                        )}
                      </TCell>

                      <TCell>
                        <button
                          type="button"
                          onClick={() =>
                            updateEvent.mutate({ eventId: event.id, isActive: !event.isActive })
                          }
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                            event.isActive
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              event.isActive ? 'bg-emerald-500' : 'bg-ink-400'
                            }`}
                          />
                          {event.isActive ? 'Active' : 'Paused'}
                        </button>
                      </TCell>

                      <TCell align="right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            icon={Send}
                            onClick={() => setBroadcastTarget(event)}
                            title="Re-broadcast push & email alerts"
                          >
                            Alert
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingEvent(event)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => setDeleteTarget(event)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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

      {/* Create / Edit Modal */}
      {(isCreateOpen || editingEvent) && (
        <EventFormModal
          isOpen
          onClose={() => {
            setIsCreateOpen(false);
            setEditingEvent(null);
          }}
          onBroadcastStarted={(progress) => setBroadcastProgress(progress)}
          initialData={editingEvent}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          await deleteEvent.mutateAsync(deleteTarget.id);
          setDeleteTarget(null);
        }}
        title="Delete this event?"
        message={deleteTarget ? `Are you sure you want to remove "${deleteTarget.title}"?` : ''}
        confirmLabel="Yes, Delete Event"
        variant="danger"
        isLoading={deleteEvent.isPending}
      />

      {/* Re-broadcast Modal */}
      <ConfirmDialog
        isOpen={Boolean(broadcastTarget)}
        onClose={() => setBroadcastTarget(null)}
        onConfirm={handleConfirmBroadcast}
        title="📢 Re-broadcast Event Alerts?"
        message={
          broadcastTarget
            ? `This will immediately send push notifications and email announcements for "${broadcastTarget.title}" to ${
                broadcastTarget.targetGender === 'male'
                  ? 'all boys (male accounts)'
                  : broadcastTarget.targetGender === 'female'
                  ? 'all girls (female accounts)'
                  : 'all active users'
              }.`
            : ''
        }
        confirmLabel="Send Broadcast Now"
        variant="brand"
        isLoading={broadcastEvent.isPending}
      />
    </>
  );
}
