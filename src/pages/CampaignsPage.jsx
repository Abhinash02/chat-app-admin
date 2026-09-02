import { useState } from 'react';
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Copy,
  History,
  Mail,
  Megaphone,
  Pause,
  Pencil,
  Play,
  Plus,
  Repeat,
  RotateCw,
  Send,
  StopCircle,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Badge, StatusBadge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { CampaignComposer } from '../components/CampaignComposer.jsx';
import { ConfirmDialog } from '../components/ui/Modal.jsx';
import { EmptyState, ErrorState, SkeletonRows } from '../components/ui/Feedback.jsx';
import { PageHeader } from '../components/layout/AppLayout.jsx';
import { Pagination, TCell, THead, TRow, Table } from '../components/ui/Table.jsx';
import { formatNumber, formatRelative } from '../lib/format.js';
import {
  useCampaigns,
  useCancelCampaign,
  useDeleteCampaign,
  useSendCampaign,
  useSetCampaignSchedule,
} from '../hooks/queries.js';

const COLUMNS = [
  { key: 'name', label: 'Campaign' },
  { key: 'channel', label: 'Channel' },
  { key: 'audience', label: 'Audience', align: 'right', className: 'hidden lg:table-cell' },
  { key: 'delivered', label: 'Live Delivery Status' },
  { key: 'status', label: 'Status' },
  { key: 'schedule', label: 'Schedule', className: 'hidden md:table-cell' },
  { key: 'when', label: 'Created', align: 'right', className: 'hidden xl:table-cell' },
  { key: 'actions', label: 'Actions', align: 'right' },
];

function ChannelBadge({ channel }) {
  if (channel === 'both') {
    return (
      <span className="flex items-center gap-1">
        <Badge tone="info">
          <Bell className="h-3 w-3" aria-hidden="true" />
          Push
        </Badge>
        <Badge tone="purple">
          <Mail className="h-3 w-3" aria-hidden="true" />
          Email
        </Badge>
      </span>
    );
  }

  return channel === 'push' ? (
    <Badge tone="info">
      <Bell className="h-3 w-3" aria-hidden="true" />
      Push
    </Badge>
  ) : (
    <Badge tone="purple">
      <Mail className="h-3 w-3" aria-hidden="true" />
      Email
    </Badge>
  );
}

/**
 * Live Progress Line with detailed Success / Failure / Target counts
 */
function DeliveryCell({ campaign }) {
  const { stats, status } = campaign;
  const pushSent = stats?.pushSent ?? 0;
  const pushFailed = stats?.pushFailed ?? 0;
  const emailSent = stats?.emailSent ?? 0;
  const emailFailed = stats?.emailFailed ?? 0;

  const delivered = pushSent + emailSent;
  const failed = pushFailed + emailFailed;
  const isSending = status === 'sending' || status === 'queued';

  const processed = delivered + failed + (stats?.optedOut ?? 0);
  const targeted = stats?.targeted ?? 0;
  const percent = targeted > 0 ? Math.min(100, Math.round((processed / targeted) * 100)) : delivered > 0 ? 100 : 0;

  return (
    <div className="min-w-[11rem] space-y-1.5 py-1">
      {/* Numbers Breakdown */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {formatNumber(delivered)} Success
        </span>

        {failed > 0 && (
          <span className="inline-flex items-center gap-1 font-semibold text-red-600">
            <AlertCircle className="h-3.5 w-3.5" />
            {formatNumber(failed)} Failed
          </span>
        )}

        {stats?.optedOut > 0 && (
          <span className="text-[11px] text-ink-400">
            {formatNumber(stats.optedOut)} opt-out
          </span>
        )}
      </div>

      {/* Live Processing Line / Progress Bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-ink-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            failed > 0 && delivered === 0
              ? 'bg-red-500'
              : isSending
                ? 'bg-gradient-to-r from-brand-500 to-emerald-400 animate-pulse'
                : 'bg-emerald-500'
          }`}
          style={{ width: `${Math.max(percent, isSending ? 15 : 0)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[10px] text-ink-500">
        <span>
          {targeted > 0 ? `${formatNumber(processed)} / ${formatNumber(targeted)}` : `${formatNumber(delivered)} sent`}
        </span>
        <span className="font-bold text-ink-700">{percent}%</span>
      </div>
    </div>
  );
}

/** Repeat rule as a sentence, with the next run when one is booked. */
function ScheduleCell({ campaign, onToggle, isToggling }) {
  const repeat = campaign.repeat;

  if (!repeat || repeat.rule === 'none') {
    return <span className="text-xs text-ink-400">Once</span>;
  }

  const times =
    Array.isArray(repeat.times) && repeat.times.length > 0
      ? repeat.times
      : [{ hour: repeat.hour ?? 9, minute: repeat.minute ?? 0 }];

  const timeStr = times
    .map((t) => `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`)
    .join(', ');

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const when =
    repeat.rule === 'daily'
      ? 'Daily'
      : Array.isArray(repeat.weekdays) && repeat.weekdays.length > 0
        ? repeat.weekdays.map((d) => days[d]).join(', ')
        : days[repeat.weekday ?? 1];

  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0">
        <span className="flex items-center gap-1 text-xs font-semibold text-ink-800">
          <Repeat className="h-3 w-3 shrink-0 text-brand-500" aria-hidden="true" />
          {when} @ {timeStr}
        </span>
        <span className="block text-[11px] text-ink-500">
          {repeat.isEnabled
            ? repeat.nextRunAt
              ? `next ${formatRelative(repeat.nextRunAt)}`
              : 'no run booked'
            : 'paused'}
          {repeat.runCount > 0 ? ` · ${repeat.runCount} sent` : ''}
        </span>
      </div>

      <Button
        size="xs"
        variant="ghost"
        className="ml-auto"
        aria-label={repeat.isEnabled ? 'Pause schedule' : 'Resume schedule'}
        title={repeat.isEnabled ? 'Pause' : 'Resume'}
        isLoading={isToggling}
        onClick={() => onToggle(campaign)}
      >
        {repeat.isEnabled ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
      </Button>
    </div>
  );
}

export function CampaignsPage() {
  const [isComposing, setIsComposing] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [page, setPage] = useState(1);
  const [cancelling, setCancelling] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data, isLoading, error, refetch, isFetching } = useCampaigns({ page, limit: 15 });
  const cancel = useCancelCampaign();
  const deleteCampaign = useDeleteCampaign();
  const sendCampaign = useSendCampaign();
  const setSchedule = useSetCampaignSchedule();

  const campaigns = data?.items ?? [];

  if (isComposing || editingCampaign) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={editingCampaign ? `Edit Campaign: ${editingCampaign.name}` : 'New Campaign'}
          subtitle="Reach your users instantly by push notification, email, or live in-app broadcast."
        >
          <Button
            variant="secondary"
            onClick={() => {
              setIsComposing(false);
              setEditingCampaign(null);
            }}
          >
            Back to Campaigns
          </Button>
        </PageHeader>
        <CampaignComposer
          initialCampaign={editingCampaign}
          onCancel={() => {
            setIsComposing(false);
            setEditingCampaign(null);
          }}
          onSent={() => {
            setIsComposing(false);
            setEditingCampaign(null);
            refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns & Broadcasts"
        subtitle="Live announcements, push notifications, festival offers, and email campaigns."
      >
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            icon={RotateCw}
            isLoading={isFetching}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
          <Button size="sm" icon={Plus} onClick={() => setIsComposing(true)}>
            New Campaign
          </Button>
        </div>
      </PageHeader>

      <Card>
        {error ? (
          <ErrorState message="Could not load campaigns." onRetry={refetch} />
        ) : (
          <>
            <Table>
              <THead columns={COLUMNS} />
              <tbody>
                {isLoading ? (
                  <SkeletonRows rows={6} columns={COLUMNS.length} />
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length}>
                      <EmptyState
                        icon={Megaphone}
                        title="No campaigns created yet"
                        description="Send a push notification or an email broadcast to your users."
                        action={
                          <Button icon={Send} onClick={() => setIsComposing(true)}>
                            Create Campaign
                          </Button>
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  campaigns.map((campaign) => (
                    <TRow key={campaign._id}>
                      <TCell>
                        <span className="font-semibold text-ink-900">{campaign.name}</span>
                        {campaign.push?.title && (
                          <span className="block max-w-[16rem] truncate text-xs text-ink-500">
                            🔔 {campaign.push.title}
                          </span>
                        )}
                        {!campaign.push?.title && campaign.email?.subject && (
                          <span className="block max-w-[16rem] truncate text-xs text-ink-500">
                            ✉️ {campaign.email.subject}
                          </span>
                        )}
                      </TCell>

                      <TCell>
                        <ChannelBadge channel={campaign.channel} />
                      </TCell>

                      <TCell align="right" className="hidden text-ink-600 lg:table-cell">
                        {formatNumber(campaign.stats?.targeted ?? 0)}
                      </TCell>

                      <TCell>
                        <DeliveryCell campaign={campaign} />
                      </TCell>

                      <TCell>
                        <StatusBadge status={campaign.status} />
                      </TCell>

                      <TCell className="hidden md:table-cell">
                        <ScheduleCell
                          campaign={campaign}
                          isToggling={setSchedule.isPending && setSchedule.variables?.campaignId === campaign._id}
                          onToggle={(target) =>
                            setSchedule.mutate({
                              campaignId: target._id,
                              repeat: { ...target.repeat, isEnabled: !target.repeat.isEnabled },
                            })
                          }
                        />
                      </TCell>

                      <TCell align="right" className="hidden text-xs text-ink-500 xl:table-cell">
                        {formatRelative(campaign.createdAt)}
                      </TCell>

                      <TCell align="right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Resend button if draft/sent/cancelled */}
                          {campaign.status !== 'sending' && (
                            <Button
                              size="xs"
                              variant="ghost"
                              icon={Send}
                              title="Send now"
                              isLoading={sendCampaign.isPending && sendCampaign.variables?.campaignId === campaign._id}
                              onClick={async () => {
                                await sendCampaign.mutateAsync({ campaignId: campaign._id });
                                toast.success(`Campaign "${campaign.name}" dispatched!`);
                                refetch();
                              }}
                            >
                              Send
                            </Button>
                          )}

                          {/* Edit button */}
                          {campaign.status !== 'sending' && (
                            <Button
                              size="xs"
                              variant="ghost"
                              icon={Pencil}
                              title="Edit campaign"
                              onClick={() => setEditingCampaign(campaign)}
                            />
                          )}

                          {/* Stop button */}
                          {(campaign.status === 'sending' || campaign.status === 'queued') && (
                            <Button
                              size="xs"
                              variant="ghost"
                              icon={StopCircle}
                              className="text-red-600 hover:bg-red-50"
                              title="Stop campaign"
                              onClick={() => setCancelling(campaign)}
                            />
                          )}

                          {/* Delete button */}
                          {campaign.status !== 'sending' && (
                            <Button
                              size="xs"
                              variant="ghost"
                              icon={Trash2}
                              className="text-red-600 hover:bg-red-50"
                              title="Delete campaign"
                              onClick={() => setDeleting(campaign)}
                            />
                          )}
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

      {!isLoading && campaigns.length > 0 && (
        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-ink-500">
          <History className="h-3.5 w-3.5" aria-hidden="true" />
          Live progress counters update in real time as push notifications and emails are delivered.
        </p>
      )}

      {/* Stop Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(cancelling)}
        onClose={() => setCancelling(null)}
        onConfirm={async () => {
          await cancel.mutateAsync(cancelling._id);
          setCancelling(null);
          refetch();
        }}
        title={`Stop “${cancelling?.name}”?`}
        message="Remaining recipients will not be contacted. Messages already delivered cannot be recalled."
        confirmLabel="Stop sending"
        isLoading={cancel.isPending}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          await deleteCampaign.mutateAsync(deleting._id);
          setDeleting(null);
          refetch();
        }}
        title={`Delete “${deleting?.name}”?`}
        message="Are you sure you want to delete this campaign? This cannot be undone."
        confirmLabel="Delete Campaign"
        isLoading={deleteCampaign.isPending}
      />
    </div>
  );
}
