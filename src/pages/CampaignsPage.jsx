import { useState } from 'react';
import { Bell, History, Mail, Megaphone, Pause, Play, Plus, Repeat, Send, StopCircle } from 'lucide-react';

import { Badge, StatusBadge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { CampaignComposer } from '../components/CampaignComposer.jsx';
import { ConfirmDialog } from '../components/ui/Modal.jsx';
import { EmptyState, ErrorState, SkeletonRows } from '../components/ui/Feedback.jsx';
import { PageHeader } from '../components/layout/AppLayout.jsx';
import { Pagination, TCell, THead, TRow, Table } from '../components/ui/Table.jsx';
import { formatNumber, formatRelative } from '../lib/format.js';
import { useCampaigns, useCancelCampaign, useSetCampaignSchedule } from '../hooks/queries.js';

const COLUMNS = [
  { key: 'name', label: 'Campaign' },
  { key: 'channel', label: 'Channel' },
  { key: 'audience', label: 'Audience', align: 'right', className: 'hidden lg:table-cell' },
  { key: 'delivered', label: 'Delivered', align: 'right' },
  { key: 'status', label: 'Status' },
  { key: 'schedule', label: 'Schedule', className: 'hidden md:table-cell' },
  { key: 'when', label: 'Created', align: 'right', className: 'hidden xl:table-cell' },
  { key: 'actions', label: '', align: 'right' },
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
 * Progress while a send is running. A campaign to fifty thousand people takes
 * real time, and an operator watching a static "sending" badge cannot tell the
 * difference between working and stuck.
 */
function DeliveryCell({ campaign }) {
  const { stats, status } = campaign;
  const delivered = (stats.pushSent ?? 0) + (stats.emailSent ?? 0);
  const failed = (stats.pushFailed ?? 0) + (stats.emailFailed ?? 0);
  const isSending = status === 'sending';

  const processed = delivered + failed + (stats.optedOut ?? 0);
  const percent = stats.targeted > 0 ? Math.min(100, Math.round((processed / stats.targeted) * 100)) : 0;

  return (
    <div className="min-w-[7rem]">
      <p className="font-medium text-ink-900">{formatNumber(delivered)}</p>
      {failed > 0 && <p className="text-xs text-red-600">{formatNumber(failed)} failed</p>}
      {stats.optedOut > 0 && (
        <p className="text-xs text-ink-500">{formatNumber(stats.optedOut)} opted out</p>
      )}
      {isSending && (
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-100">
          <div
            className="h-full rounded-full bg-brand-500 transition-[width] duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
}

/** Repeat rule as a sentence, with the next run when one is booked. */
function ScheduleCell({ campaign, onToggle, isToggling }) {
  const repeat = campaign.repeat;

  if (!repeat || repeat.rule === 'none') {
    return <span className="text-xs text-ink-400">Once</span>;
  }

  const time = `${String(repeat.hour).padStart(2, '0')}:${String(repeat.minute).padStart(2, '0')}`;
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const when = repeat.rule === 'daily' ? 'Daily' : days[repeat.weekday ?? 1];

  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0">
        <span className="flex items-center gap-1 text-xs font-medium text-ink-800">
          <Repeat className="h-3 w-3 shrink-0" aria-hidden="true" />
          {when} {time}
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
        size="sm"
        variant="ghost"
        className="ml-auto"
        aria-label={repeat.isEnabled ? 'Pause schedule' : 'Resume schedule'}
        title={repeat.isEnabled ? 'Pause' : 'Resume'}
        isLoading={isToggling}
        onClick={() => onToggle(campaign)}
      >
        {repeat.isEnabled ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

export function CampaignsPage() {
  const [isComposing, setIsComposing] = useState(false);
  const [page, setPage] = useState(1);
  const [cancelling, setCancelling] = useState(null);

  const { data, isLoading, error, refetch } = useCampaigns({ page, limit: 15 });
  const cancel = useCancelCampaign();
  const setSchedule = useSetCampaignSchedule();

  const campaigns = data?.items ?? [];

  if (isComposing) {
    return (
      <>
        <PageHeader
          title="New campaign"
          description="Reach your users by push notification, email, or both."
          action={
            <Button variant="ghost" onClick={() => setIsComposing(false)}>
              Back to history
            </Button>
          }
        />
        <CampaignComposer onSent={() => setIsComposing(false)} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Campaigns"
        description="Announcements, offers and win-back messages. Promotional email always carries an unsubscribe link."
        action={
          <Button icon={Plus} onClick={() => setIsComposing(true)}>
            New campaign
          </Button>
        }
      />

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
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length}>
                      <EmptyState
                        icon={Megaphone}
                        title="No campaigns yet"
                        description="Send a push notification or a promotional email to your users."
                        action={
                          <Button icon={Send} onClick={() => setIsComposing(true)}>
                            Create the first one
                          </Button>
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  campaigns.map((campaign) => (
                    <TRow key={campaign._id}>
                      <TCell>
                        <span className="font-medium text-ink-900">{campaign.name}</span>
                        {campaign.push?.title && (
                          <span className="block max-w-[16rem] truncate text-xs text-ink-500">
                            {campaign.push.title}
                          </span>
                        )}
                        {!campaign.push?.title && campaign.email?.subject && (
                          <span className="block max-w-[16rem] truncate text-xs text-ink-500">
                            {campaign.email.subject}
                          </span>
                        )}
                      </TCell>

                      <TCell>
                        <ChannelBadge channel={campaign.channel} />
                      </TCell>

                      <TCell align="right" className="hidden text-ink-600 lg:table-cell">
                        {formatNumber(campaign.stats?.targeted ?? 0)}
                      </TCell>

                      <TCell align="right">
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
                        {(campaign.status === 'sending' || campaign.status === 'queued') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={StopCircle}
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => setCancelling(campaign)}
                          >
                            Stop
                          </Button>
                        )}
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
          Counts update while a campaign is sending.
        </p>
      )}

      <ConfirmDialog
        isOpen={Boolean(cancelling)}
        onClose={() => setCancelling(null)}
        onConfirm={async () => {
          await cancel.mutateAsync(cancelling._id);
          setCancelling(null);
        }}
        title={`Stop “${cancelling?.name}”?`}
        message="Remaining recipients will not be contacted. Messages already delivered cannot be recalled."
        confirmLabel="Stop sending"
        isLoading={cancel.isPending}
      />
    </>
  );
}
