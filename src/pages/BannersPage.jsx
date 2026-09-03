import { useState } from 'react';
import {
  Image,
  MousePointerClick,
  Plus,
  Eye,
  Trash2,
  Pencil,
  Megaphone,
  Link2,
  Link2Off,
  Sparkles,
  Check,
  BarChart3,
  TrendingUp,
  Target,
  ArrowUpRight,
  ArrowUpDown,
  Users,
  Bell,
  Send,
  Clock,
  Search,
} from 'lucide-react';

import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { ConfirmDialog, Modal } from '../components/ui/Modal.jsx';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/Feedback.jsx';
import { Field, Input, NumberInput, Select, Toggle } from '../components/ui/Field.jsx';
import { PageHeader } from '../components/layout/AppLayout.jsx';
import { formatDateTime, formatNumber } from '../lib/format.js';
import {
  useBanners,
  useCreateBanner,
  useDeleteBanner,
  useUpdateBanner,
  useSettings,
  useUpdateSettings,
  useBannerClicks,
  useSendBannerPush,
} from '../hooks/queries.js';

const ANIMATIONS = [
  { value: 'pan', label: 'Slow pan', hint: 'Drifts sideways. Best for a wide image.' },
  { value: 'pulse', label: 'Pulse', hint: 'Gently scales in and out.' },
  { value: 'shimmer', label: 'Shimmer', hint: 'A light sweeps across it.' },
  { value: 'fade', label: 'Fade', hint: 'Cross-fades between banners.' },
  { value: 'none', label: 'Still', hint: 'No motion at all.' },
];

const SCREENS = [
  { value: 'coins', label: 'Coins Store (Buy Coins)' },
  { value: 'rooms', label: 'Voice Rooms (Live Audio)' },
  { value: 'events', label: 'Live Events & Festival Offers' },
  { value: 'games', label: 'Games Arcade (Play & Win)' },
  { value: 'chats', label: 'Chats Inbox' },
  { value: 'leaderboard', label: 'Leaderboard' },
  { value: 'profile', label: 'User Profile' },
];

/** `datetime-local` needs "YYYY-MM-DDTHH:mm" in local time, not an ISO string. */
function toLocalInput(value) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function BannerDialog({ editing, defaultPlacement = 'home_top', onClose }) {
  const [form, setForm] = useState(() => ({
    title: editing?.title ?? '',
    note: editing?.note ?? '',
    placement: editing?.placement ?? defaultPlacement ?? 'home_top',
    animation: editing?.animation ?? 'shimmer',
    action: editing?.action ?? 'none',
    actionTarget: editing?.actionTarget ?? '',
    isActive: editing?.isActive ?? true,
    sortOrder: editing?.sortOrder ?? 0,
    startsAt: toLocalInput(editing?.startsAt),
    endsAt: toLocalInput(editing?.endsAt),
  }));

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(editing?.imageUrl ?? null);

  const create = useCreateBanner();
  const update = useUpdateBanner();
  const isSaving = create.isPending || update.isPending;

  /**
   * Made in the change handler rather than an effect, because that is the
   * event that caused it. Each object URL is revoked as it is replaced —
   * they leak until revoked, and picking several images in one sitting would
   * otherwise strand one per attempt.
   */
  function chooseImage(file) {
    setPreview((current) => {
      if (current?.startsWith('blob:')) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : (editing?.imageUrl ?? null);
    });
    setImage(file);
  }

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const needsTarget = form.action !== 'none';
  const isValid =
    form.title.trim().length >= 2 &&
    (editing || image) &&
    (!needsTarget || form.actionTarget.trim().length > 0);

  async function handleSubmit() {
    const payload = {
      ...form,
      title: form.title.trim(),
      actionTarget: form.action === 'none' ? '' : form.actionTarget.trim(),
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : '',
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : '',
      ...(image ? { image } : {}),
    };

    if (editing) await update.mutateAsync({ bannerId: editing.id, ...payload });
    else await create.mutateAsync(payload);

    onClose();
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={editing ? `Edit “${editing.title}”` : 'New banner'}
      description="Shown at the top of the home feed."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isSaving} disabled={!isValid}>
            {editing ? 'Save banner' : 'Create banner'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field
          label="Media File (Image or Short Video)"
          hint="Upload an image (PNG, JPG, WebP, 4:1 ratio) or a short video ad (MP4, WebM up to 50MB)."
        >
          <div className="space-y-2">
            {preview && (
              <div className="overflow-hidden rounded-xl border border-ink-200">
                {image?.type?.startsWith('video/') ||
                editing?.mediaType === 'video' ||
                (typeof preview === 'string' && preview.match(/\.(mp4|webm|mov|3gp)($|\?)/i)) ? (
                  <video
                    src={preview}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="aspect-[4/1] w-full object-cover"
                  />
                ) : (
                  <img src={preview} alt="" className="aspect-[4/1] w-full object-cover" />
                )}
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
              onChange={(event) => chooseImage(event.target.files?.[0] ?? null)}
              className="block w-full text-sm text-ink-600 file:mr-3 file:rounded-lg file:border-0
                         file:bg-ink-100 file:px-3 file:py-2 file:text-sm file:font-medium
                         file:text-ink-700 hover:file:bg-ink-200"
            />
          </div>
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Title" hint="Used for accessibility, not shown on the image.">
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={80} />
          </Field>

          <Field label="Banner Placement" hint="Where this banner appears in the app.">
            <Select value={form.placement} onChange={(e) => set('placement', e.target.value)}>
              <option value="home_top">Top Carousel (Home Feed Top)</option>
              <option value="home_bottom_ad">Bottom Ad Space (Below Nearby Random Call)</option>
            </Select>
          </Field>

          <Field label="Animation" hint={ANIMATIONS.find((a) => a.value === form.animation)?.hint}>
            <Select value={form.animation} onChange={(e) => set('animation', e.target.value)}>
              {ANIMATIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          {/* Page Redirection Active / Inactive Box */}
          <div className="rounded-xl border border-ink-200 bg-ink-50/60 p-4 sm:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-ink-900">
                    Page Redirection
                  </span>
                  <Badge tone={form.action !== 'none' ? 'success' : 'neutral'}>
                    {form.action !== 'none' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-ink-500">
                  {form.action !== 'none'
                    ? 'Active: Tapping this banner redirects user to selected app screen or website.'
                    : 'Inactive: Banner is display-only and will not redirect anywhere.'}
                </p>
              </div>

              <Toggle
                checked={form.action !== 'none'}
                onChange={(enabled) => {
                  if (enabled) {
                    set('action', 'screen');
                    set('actionTarget', form.actionTarget || 'coins');
                  } else {
                    set('action', 'none');
                    set('actionTarget', '');
                  }
                }}
                label={form.action !== 'none' ? 'Active' : 'Inactive'}
              />
            </div>

            {form.action !== 'none' && (
              <div className="mt-4 grid grid-cols-1 gap-4 border-t border-ink-200 pt-3.5 sm:grid-cols-2">
                <Field label="Redirection Type">
                  <Select
                    value={form.action}
                    onChange={(e) => {
                      const next = e.target.value;
                      set('action', next);
                      set('actionTarget', next === 'screen' ? 'coins' : '');
                    }}
                  >
                    <option value="screen">In-App Screen</option>
                    <option value="url">External Website Link</option>
                  </Select>
                </Field>

                {form.action === 'screen' ? (
                  <Field label="Target App Page">
                    <Select
                      value={form.actionTarget}
                      onChange={(e) => set('actionTarget', e.target.value)}
                    >
                      {SCREENS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : (
                  <Field label="Website Link (URL)" hint="Must start with http:// or https://">
                    <Input
                      value={form.actionTarget}
                      onChange={(e) => set('actionTarget', e.target.value)}
                      placeholder="https://example.com/offer"
                    />
                  </Field>
                )}
              </div>
            )}
          </div>

          <Field label="Starts" hint="Leave empty to start now.">
            <Input
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => set('startsAt', e.target.value)}
            />
          </Field>

          <Field label="Ends" hint="Leave empty to run until you turn it off.">
            <Input
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => set('endsAt', e.target.value)}
            />
          </Field>

          <Field label="Order" hint="Lower shows first.">
            <NumberInput
              value={form.sortOrder}
              min={0}
              onChange={(e) => set('sortOrder', Number(e.target.value))}
            />
          </Field>

          <div className="sm:pt-7">
            <Toggle
              checked={form.isActive}
              onChange={(value) => set('isActive', value)}
              label="Live"
              description="Turn off to hide it without deleting."
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}

function AdClickersDialog({ banner, onClose, onOpenPush }) {
  const { data, isLoading, error, refetch } = useBannerClicks(banner?.id);
  const [searchTerm, setSearchTerm] = useState('');

  const clicks = data?.clicks ?? [];
  const filteredClicks = clicks.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.userId?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`User Click Insights · ${banner?.title || 'Ad'}`}
      description="Real user activity and profiles of registered users who clicked or interacted with this ad."
      size="xl"
      footer={
        <>
          <Button
            variant="outline"
            icon={Bell}
            onClick={() => {
              onClose();
              onOpenPush(banner, 'clickers');
            }}
          >
            Send Push to Clickers
          </Button>
          <Button onClick={onClose}>Close</Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Metric Summary Bar */}
        <div className="grid grid-cols-3 gap-3 rounded-xl border border-ink-200 bg-ink-50/70 p-3 text-center">
          <div>
            <span className="text-[11px] font-medium text-ink-500">Total User Clicks</span>
            <p className="mt-0.5 text-xl font-black text-ink-900">
              {data?.totalClicks ?? banner?.taps ?? 0}
            </p>
          </div>
          <div>
            <span className="text-[11px] font-medium text-ink-500">Unique Clickers</span>
            <p className="mt-0.5 text-xl font-black text-brand-600">{data?.uniqueUsersCount ?? 0}</p>
          </div>
          <div>
            <span className="text-[11px] font-medium text-ink-500">Conversion Rate</span>
            <p className="mt-0.5 text-xl font-black text-emerald-600">
              {banner?.impressions > 0
                ? `${(((data?.uniqueUsersCount || 0) / banner.impressions) * 100).toFixed(1)}%`
                : `${banner?.tapRate || 0}%`}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        {clicks.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-400" />
            <input
              type="text"
              placeholder="Search by user name, email, or user ID…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-ink-200 bg-white py-2 pl-9 pr-3 text-xs text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none"
            />
          </div>
        )}

        {/* User Clicks List */}
        {isLoading ? (
          <LoadingState label="Loading user click logs…" />
        ) : error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : filteredClicks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink-200 p-8 text-center">
            <Users className="mx-auto h-8 w-8 text-ink-300 mb-2" />
            <p className="text-sm font-semibold text-ink-700">
              {searchTerm ? 'No users matching your search' : 'No user clicks recorded yet'}
            </p>
            <p className="mt-1 text-xs text-ink-500 max-w-sm mx-auto">
              {searchTerm
                ? 'Try searching with a different name or email address.'
                : 'When users tap this banner on mobile or web, their profile name, email ID, and click details will appear here in real time.'}
            </p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto rounded-xl border border-ink-200 divide-y divide-ink-100">
            {filteredClicks.map((click) => (
              <div
                key={click.id}
                className="flex items-center justify-between p-3 hover:bg-ink-50/60 transition gap-3"
              >
                {/* User Profile */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="h-9 w-9 shrink-0 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs overflow-hidden border border-brand-200">
                    {click.avatarUrl ? (
                      <img src={click.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      (click.name || 'U').charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-ink-900 truncate">{click.name}</span>
                      {click.nickname && (
                        <span className="text-[10px] text-ink-400 truncate">(@{click.nickname})</span>
                      )}
                      <Badge tone={click.role === 'admin' ? 'brand' : 'neutral'} size="sm">
                        {click.role}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-medium text-ink-700 select-all truncate">
                        {click.email}
                      </span>
                      <span className="text-[10px] text-ink-300">·</span>
                      <span className="text-[10px] font-mono text-ink-400 select-all truncate">
                        ID: {click.userId}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Click timestamp and action */}
                <div className="text-right shrink-0">
                  <div className="flex items-center justify-end gap-1 text-[11px] text-ink-500">
                    <Clock className="h-3 w-3" />
                    <span>{formatDateTime(click.clickedAt)}</span>
                  </div>
                  {click.actionTarget && (
                    <span className="inline-block mt-0.5 text-[10px] text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md truncate max-w-[160px]">
                      {click.actionTarget}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

function SendAdPushDialog({ banner, defaultAudience = 'all', onClose }) {
  const sendPush = useSendBannerPush();
  const [title, setTitle] = useState(`🔥 ${banner?.title || 'Special Promotion'}`);
  const [body, setBody] = useState(
    banner?.note
      ? `Special offer! ${banner.note}`
      : `Don't miss our special offer: ${banner?.title || 'Check it out'}! Tap to explore now.`,
  );
  const [audience, setAudience] = useState(defaultAudience);
  const [dispatchResult, setDispatchResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isDispatching, setIsDispatching] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setIsDispatching(true);
    setProgress(15);

    const progressTimer = setInterval(() => {
      setProgress((prev) => (prev < 85 ? prev + Math.floor(Math.random() * 15) + 10 : prev));
    }, 250);

    try {
      const res = await sendPush.mutateAsync({
        bannerId: banner.id,
        title: title.trim(),
        body: body.trim(),
        targetAudience: audience,
      });

      clearInterval(progressTimer);
      setProgress(100);
      setDispatchResult(res);
    } catch (_err) {
      clearInterval(progressTimer);
      setIsDispatching(false);
      setProgress(0);
    }
  };

  if (isDispatching || dispatchResult) {
    const isComplete = Boolean(dispatchResult);
    const sentCount = dispatchResult?.sent ?? 0;
    const failedCount = dispatchResult?.failed ?? 0;
    const unreachedCount = dispatchResult?.unregisteredDevices ?? 0;
    const totalTargeted = dispatchResult?.targetedUsers ?? 0;
    const activeDevices = dispatchResult?.activeDevices ?? 0;

    const successPct =
      totalTargeted > 0 ? Math.round((sentCount / totalTargeted) * 100) : 0;
    const failedPct =
      totalTargeted > 0 ? Math.round(((unreachedCount + failedCount) / totalTargeted) * 100) : 0;

    return (
      <Modal
        isOpen
        onClose={onClose}
        title={isComplete ? 'Push Broadcast Report' : 'Dispatching Push Notification…'}
        description={`Ad campaign: “${banner?.title}”`}
        size="md"
        footer={
          isComplete ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setDispatchResult(null);
                  setIsDispatching(false);
                  setProgress(0);
                }}
              >
                Send Another
              </Button>
              <Button onClick={onClose}>Done</Button>
            </>
          ) : null
        }
      >
        <div className="space-y-5">
          {/* Header Status */}
          <div className="text-center py-2">
            {!isComplete ? (
              <div className="flex flex-col items-center">
                <div className="h-10 w-10 animate-spin rounded-full border-3 border-brand-500 border-t-transparent mb-3" />
                <h3 className="text-base font-bold text-ink-900">Broadcasting Push Notifications</h3>
                <p className="text-xs text-ink-500 mt-0.5">Connecting to push delivery network…</p>
              </div>
            ) : sentCount > 0 ? (
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                  <Check className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-ink-900">Broadcast Completed</h3>
                <p className="text-xs text-ink-500 mt-0.5">Push tickets dispatched successfully</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-2 text-xl">
                  ⚠️
                </div>
                <h3 className="text-base font-bold text-ink-900">0 Active Devices Registered</h3>
                <p className="text-xs text-ink-500 mt-0.5">
                  Targeted {totalTargeted} users, but 0 active push device tokens found
                </p>
              </div>
            )}
          </div>

          {/* Live Progress Bar */}
          <div className="rounded-xl border border-ink-200 bg-ink-50/60 p-4">
            <div className="flex items-center justify-between text-xs font-bold text-ink-800 mb-2">
              <span>{isComplete ? 'Delivery Breakdown' : 'Dispatch Progress'}</span>
              <span>{progress}%</span>
            </div>

            {/* Split Progress Meter */}
            <div className="h-3 w-full overflow-hidden rounded-full bg-ink-200 flex">
              {isComplete ? (
                <>
                  {sentCount > 0 && (
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${Math.max(successPct, 5)}%` }}
                      title={`${sentCount} Sent`}
                    />
                  )}
                  <div
                    className="h-full bg-amber-500 transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        failedPct,
                        100 - (sentCount > 0 ? successPct : 0),
                      )}%`,
                    }}
                    title={`${unreachedCount + failedCount} Unregistered / Web users`}
                  />
                </>
              ) : (
                <div
                  className="h-full bg-brand-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              )}
            </div>

            {isComplete && (
              <div className="flex items-center justify-between text-[11px] text-ink-500 mt-2">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Sent: {sentCount} ({successPct}%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  No Push Token / Web: {unreachedCount + failedCount} ({failedPct}%)
                </span>
              </div>
            )}
          </div>

          {/* Delivery Stats Pods */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="rounded-xl border border-ink-100 bg-white p-3 shadow-sm">
              <span className="text-[11px] font-medium text-ink-500">Targeted Users</span>
              <p className="mt-1 text-lg font-black text-ink-900">{totalTargeted}</p>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
              <span className="text-[11px] font-medium text-emerald-700">Sent & Delivered</span>
              <p className="mt-1 text-lg font-black text-emerald-600">{sentCount}</p>
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3">
              <span className="text-[11px] font-medium text-amber-700">Unreached (Web/Off)</span>
              <p className="mt-1 text-lg font-black text-amber-600">
                {unreachedCount + failedCount}
              </p>
            </div>
          </div>

          {/* Explanation Callout */}
          {isComplete && activeDevices === 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900">
              <div className="flex items-center gap-1.5 font-bold text-amber-950 mb-1">
                <span>💡 Why were 0 active devices reached?</span>
              </div>
              <p className="text-[11.5px] leading-relaxed text-amber-800">
                You have <strong>{totalTargeted} real users</strong> in MongoDB, but they are currently accessing the platform via Web browsers or have not yet installed the Android APK and accepted push notification permissions.
              </p>
              <p className="mt-2 text-[11.5px] leading-relaxed text-amber-800">
                Push notifications (FCM / APNs) require a registered hardware device token from an installed mobile app. Once users launch the mobile APK, their device token will register automatically and they will receive these promotions on their lock screen!
              </p>
            </div>
          )}
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Send Push Notification for Ad"
      description={`Broadcast a live push notification promoting "${banner?.title}" directly to users' devices.`}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={sendPush.isPending}>
            Cancel
          </Button>
          <Button
            icon={Send}
            onClick={handleSubmit}
            isLoading={sendPush.isPending}
            disabled={!title.trim() || !body.trim()}
          >
            Send Push Notification
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Banner Quick Preview */}
        <div className="flex items-center gap-3 rounded-xl border border-ink-200 bg-ink-50 p-3">
          <img
            src={banner?.imageUrl}
            alt=""
            className="h-12 w-20 rounded-lg object-cover border border-ink-200"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-ink-900 truncate">{banner?.title}</p>
            <p className="text-[11px] text-ink-500 truncate">
              {banner?.action === 'url'
                ? `Link: ${banner.actionTarget}`
                : `Screen: /${banner?.actionTarget || 'coins'}`}
            </p>
          </div>
        </div>

        {/* Target Audience Radio */}
        <Field label="Target Audience" hint="Choose who will receive this push notification.">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setAudience('all')}
              className={`p-3 rounded-xl border text-left transition ${
                audience === 'all'
                  ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-500/20'
                  : 'border-ink-200 bg-white hover:border-ink-300'
              }`}
            >
              <span className="text-xs font-bold text-ink-900">All App Users</span>
              <p className="mt-0.5 text-[11px] text-ink-500">
                Broadcast this promotion to all active registered users.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setAudience('clickers')}
              className={`p-3 rounded-xl border text-left transition ${
                audience === 'clickers'
                  ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-500/20'
                  : 'border-ink-200 bg-white hover:border-ink-300'
              }`}
            >
              <span className="text-xs font-bold text-ink-900">
                Engaged Clickers ({banner?.taps || 0})
              </span>
              <p className="mt-0.5 text-[11px] text-ink-500">
                Targeted follow-up with users who clicked this ad.
              </p>
            </button>
          </div>
        </Field>

        {/* Title */}
        <Field label="Notification Title" hint="Visible on user lock screen.">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={65} required />
        </Field>

        {/* Message Body */}
        <Field label="Message Body" hint="Keep it catchy and concise.">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={180}
            className="w-full rounded-xl border border-ink-200 bg-white p-3 text-sm text-ink-900 focus:border-brand-500 focus:outline-none"
            required
          />
        </Field>

        {/* Delivery Preview */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-emerald-800">
          <div className="flex items-center gap-1.5 font-bold mb-1">
            <span>📱 User Lock Screen Preview</span>
          </div>
          <div className="rounded-lg bg-white p-2.5 shadow-sm border border-emerald-100">
            <p className="font-bold text-ink-900">{title || 'Notification Title'}</p>
            <p className="text-ink-600 mt-0.5 text-[11px]">{body || 'Notification Message'}</p>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export function BannersPage() {
  const { data: banners, isLoading, error, refetch } = useBanners();
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();

  const [dialog, setDialog] = useState(null);
  const [filterPlacement, setFilterPlacement] = useState('all');
  const [admobUnitId, setAdmobUnitId] = useState('');
  const [hasInitializedAdmobId, setHasInitializedAdmobId] = useState(false);

  const remove = useDeleteBanner();
  const update = useUpdateBanner();

  const currentAdProvider = settings?.ads?.homeBottomAdProvider ?? 'admin';
  const currentAdmobId = settings?.ads?.admobBannerUnitId ?? 'ca-app-pub-3940256099942544/6300978111';

  // Initialize input with current saved ID
  if (!hasInitializedAdmobId && settings?.ads?.admobBannerUnitId) {
    setAdmobUnitId(settings.ads.admobBannerUnitId);
    setHasInitializedAdmobId(true);
  }

  const [sortBy, setSortBy] = useState('default');

  if (isLoading) return <LoadingState label="Loading banners…" />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const allBanners = banners ?? [];
  const topBanners = allBanners.filter((b) => (b.placement || 'home_top') === 'home_top');
  const bottomAds = allBanners.filter((b) => b.placement === 'home_bottom_ad');

  // Aggregate Performance Insights
  const totalImpressions = allBanners.reduce((sum, b) => sum + (b.impressions || 0), 0);
  const totalTaps = allBanners.reduce((sum, b) => sum + (b.taps || 0), 0);
  const overallCtr =
    totalImpressions > 0 ? Number(((totalTaps / totalImpressions) * 100).toFixed(2)) : 0;
  const liveCount = allBanners.filter((b) => b.isLive).length;

  const topImpressions = topBanners.reduce((sum, b) => sum + (b.impressions || 0), 0);
  const topTaps = topBanners.reduce((sum, b) => sum + (b.taps || 0), 0);
  const topCtr =
    topImpressions > 0 ? Number(((topTaps / topImpressions) * 100).toFixed(2)) : 0;

  const bottomImpressions = bottomAds.reduce((sum, b) => sum + (b.impressions || 0), 0);
  const bottomTaps = bottomAds.reduce((sum, b) => sum + (b.taps || 0), 0);
  const bottomCtr =
    bottomImpressions > 0 ? Number(((bottomTaps / bottomImpressions) * 100).toFixed(2)) : 0;

  const displayedBanners =
    filterPlacement === 'home_top'
      ? topBanners
      : filterPlacement === 'home_bottom_ad'
        ? bottomAds
        : allBanners;

  const sortedBanners = [...displayedBanners].sort((a, b) => {
    if (sortBy === 'views') return (b.impressions || 0) - (a.impressions || 0);
    if (sortBy === 'clicks') return (b.taps || 0) - (a.taps || 0);
    if (sortBy === 'ctr') return (b.tapRate || 0) - (a.tapRate || 0);
    return (a.sortOrder || 0) - (b.sortOrder || 0);
  });

  const handleSetProvider = (provider) => {
    updateSettings.mutate({
      ads: {
        homeBottomAdProvider: provider,
      },
    });
  };

  const handleSaveAdmobId = () => {
    if (!admobUnitId.trim()) return;
    updateSettings.mutate({
      ads: {
        admobBannerUnitId: admobUnitId.trim(),
      },
    });
  };

  return (
    <>
      <PageHeader
        title="Banners & Ads"
        description="Manage top promo carousel banners, video ads, and the lower Ad space (directly below Nearby Random Call) with real-time views and clicks analytics."
        action={
          <Button
            icon={Plus}
            onClick={() =>
              setDialog({
                type: 'create',
                defaultPlacement: filterPlacement === 'home_bottom_ad' ? 'home_bottom_ad' : 'home_top',
              })
            }
          >
            New banner / ad
          </Button>
        }
      />

      {/* Campaign Performance & Analytics Insights Overview Dashboard */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Views */}
        <Card className="p-4 border-l-4 border-l-blue-500 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-500">Total Ad Views</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Eye className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-ink-900">{formatNumber(totalImpressions)}</p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-ink-500 border-t border-ink-100 pt-2">
            <span>Top: {formatNumber(topImpressions)}</span>
            <span>Bottom: {formatNumber(bottomImpressions)}</span>
          </div>
        </Card>

        {/* Total Clicks */}
        <Card className="p-4 border-l-4 border-l-emerald-500 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-500">Total Clicks</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <MousePointerClick className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-ink-900">{formatNumber(totalTaps)}</p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-ink-500 border-t border-ink-100 pt-2">
            <span>Top: {formatNumber(topTaps)}</span>
            <span>Bottom: {formatNumber(bottomTaps)}</span>
          </div>
        </Card>

        {/* Average CTR */}
        <Card className="p-4 border-l-4 border-l-amber-500 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-500">Average Click Rate</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-black text-ink-900">{overallCtr}%</p>
            <Badge tone={overallCtr > 2 ? 'success' : overallCtr > 0 ? 'brand' : 'neutral'} size="sm">
              {overallCtr > 2 ? 'High Conversion' : overallCtr > 0 ? 'Normal' : 'No clicks'}
            </Badge>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-ink-500 border-t border-ink-100 pt-2">
            <span>Top CTR: {topCtr}%</span>
            <span>Bottom CTR: {bottomCtr}%</span>
          </div>
        </Card>

        {/* Active Campaigns */}
        <Card className="p-4 border-l-4 border-l-brand-500 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-500">Active Campaigns</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-ink-900">
            {liveCount} <span className="text-sm font-normal text-ink-500">/ {allBanners.length} live</span>
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-ink-500 border-t border-ink-100 pt-2">
            <span>Carousel: {topBanners.filter((b) => b.isLive).length} live</span>
            <span>Bottom Ads: {bottomAds.filter((b) => b.isLive).length} live</span>
          </div>
        </Card>
      </div>

      {/* Home Bottom Ad Space Controller (Option A: In-House Custom Ad vs Option B: Google AdMob) */}
      <Card className="mb-6 overflow-hidden border-2 border-brand-500/25 shadow-sm">
        <div className="border-b border-ink-100 bg-gradient-to-r from-brand-500/10 via-brand-500/5 to-transparent px-5 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">📢</span>
                <h2 className="text-base font-bold text-ink-900">
                  Home Bottom Ad Space (Below Nearby Random Call)
                </h2>
                <Badge tone={currentAdProvider === 'off' ? 'neutral' : 'success'}>
                  {currentAdProvider === 'admin'
                    ? 'Option A: In-House Custom Ad'
                    : currentAdProvider === 'admob'
                      ? 'Option B: Google AdMob'
                      : 'Section Disabled'}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-ink-600">
                Choose what appears directly below the <strong>Nearby Random Call</strong> card on the home screen.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Ad Mode Selection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleSetProvider('admin')}
              className={`flex flex-col p-4 rounded-xl border text-left transition ${
                currentAdProvider === 'admin'
                  ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-500/20 shadow-sm'
                  : 'border-ink-200 hover:border-ink-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-ink-900">Option A: In-House Ad</span>
                {currentAdProvider === 'admin' && <Badge tone="success" size="sm">Active</Badge>}
              </div>
              <p className="mt-1.5 text-xs text-ink-500 leading-relaxed">
                Displays custom sponsor banners, video ads, or coin offers you upload below. Works on APK and Web with redirection.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleSetProvider('admob')}
              className={`flex flex-col p-4 rounded-xl border text-left transition ${
                currentAdProvider === 'admob'
                  ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-500/20 shadow-sm'
                  : 'border-ink-200 hover:border-ink-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-ink-900">Option B: Google AdMob</span>
                {currentAdProvider === 'admob' && <Badge tone="success" size="sm">Active</Badge>}
              </div>
              <p className="mt-1.5 text-xs text-ink-500 leading-relaxed">
                Google auto-serves live paid banner ads from its network and pays money directly to your Google AdMob account.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleSetProvider('off')}
              className={`flex flex-col p-4 rounded-xl border text-left transition ${
                currentAdProvider === 'off'
                  ? 'border-ink-400 bg-ink-100 ring-2 ring-ink-300'
                  : 'border-ink-200 hover:border-ink-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-ink-900">Turn Off Section</span>
                {currentAdProvider === 'off' && <Badge tone="neutral" size="sm">Disabled</Badge>}
              </div>
              <p className="mt-1.5 text-xs text-ink-500 leading-relaxed">
                Completely removes and hides the ad space from the mobile app.
              </p>
            </button>
          </div>

          {/* AdMob Configuration Box */}
          {currentAdProvider === 'admob' && (
            <div className="rounded-xl border border-brand-500/20 bg-brand-50/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-brand-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-ink-800">
                  Google AdMob Banner Configuration
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1">
                  <Field
                    label="Banner Ad Unit ID"
                    hint="Enter your Banner Ad Unit ID from admob.google.com (or use the pre-configured official test ID)."
                  >
                    <Input
                      value={admobUnitId}
                      onChange={(e) => setAdmobUnitId(e.target.value)}
                      placeholder="ca-app-pub-3940256099942544/6300978111"
                    />
                  </Field>
                </div>
                <Button
                  onClick={handleSaveAdmobId}
                  isLoading={updateSettings.isPending}
                  disabled={!admobUnitId.trim()}
                >
                  Save Ad Unit ID
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const testId = 'ca-app-pub-3940256099942544/6300978111';
                    setAdmobUnitId(testId);
                    updateSettings.mutate({ ads: { admobBannerUnitId: testId } });
                  }}
                >
                  Use Google Test ID
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Placement Filter Tabs & Sorting Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterPlacement('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              filterPlacement === 'all'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
            }`}
          >
            All Items ({banners?.length ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setFilterPlacement('home_top')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              filterPlacement === 'home_top'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
            }`}
          >
            Top Carousel ({topBanners.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterPlacement('home_bottom_ad')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              filterPlacement === 'home_bottom_ad'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
            }`}
          >
            Bottom Ads ({bottomAds.length})
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-500 flex items-center gap-1">
            <ArrowUpDown className="h-3 w-3" />
            Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-xs font-semibold text-ink-800 shadow-sm focus:border-brand-500 focus:outline-none"
          >
            <option value="default">Default Order</option>
            <option value="views">Most Views (Impressions)</option>
            <option value="clicks">Most Clicks (Taps)</option>
            <option value="ctr">Highest CTR %</option>
          </select>
        </div>
      </div>

      {displayedBanners.length === 0 ? (
        <Card>
          <EmptyState
            icon={Megaphone}
            title={filterPlacement === 'home_bottom_ad' ? 'No bottom ads created' : 'No banners yet'}
            description={
              filterPlacement === 'home_bottom_ad'
                ? 'Create a bottom ad banner to display in the space below the Nearby Random Call card.'
                : 'Add a banner to promote an offer, an event, or coin discounts.'
            }
            action={
              <Button
                icon={Plus}
                onClick={() =>
                  setDialog({
                    type: 'create',
                    defaultPlacement: filterPlacement === 'home_bottom_ad' ? 'home_bottom_ad' : 'home_top',
                  })
                }
              >
                Create {filterPlacement === 'home_bottom_ad' ? 'bottom ad' : 'banner'}
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {sortedBanners.map((banner) => {
            const isVideo =
              banner.mediaType === 'video' ||
              (typeof banner.imageUrl === 'string' &&
                banner.imageUrl.match(/\.(mp4|webm|mov|3gp)($|\?)/i));

            return (
              <Card key={banner.id} className="overflow-hidden">
                <div className="relative">
                  {isVideo ? (
                    <video
                      src={banner.imageUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="aspect-[4/1] w-full object-cover"
                    />
                  ) : (
                    <img src={banner.imageUrl} alt="" className="aspect-[4/1] w-full object-cover" />
                  )}
                  <div className="absolute left-2 top-2 flex gap-1.5">
                    <Badge tone={banner.placement === 'home_bottom_ad' ? 'brand' : 'neutral'}>
                      {banner.placement === 'home_bottom_ad' ? '📢 Bottom Ad Space' : 'Top Carousel'}
                    </Badge>
                    {isVideo && <Badge tone="warning">🎬 Video</Badge>}
                  </div>
                  <div className="absolute right-2 top-2 flex gap-1.5">
                    {banner.isLive ? (
                      <Badge tone="success">Live</Badge>
                    ) : (
                      <Badge tone="neutral">{banner.isActive ? 'Scheduled' : 'Off'}</Badge>
                    )}
                    <Badge tone="info">{banner.animation}</Badge>
                  </div>
                </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-900">{banner.title}</p>
                    {banner.note && <p className="mt-0.5 text-xs text-ink-500">{banner.note}</p>}
                  </div>
                </div>

                {/* Page Redirection Active / Inactive Box with 1-Click Toggle */}
                <div className="mt-3.5 rounded-xl border border-ink-200 bg-ink-50/80 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                          banner.action !== 'none'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-ink-200 text-ink-600'
                        }`}
                      >
                        {banner.action !== 'none' ? (
                          <Link2 className="h-4 w-4" />
                        ) : (
                          <Link2Off className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-ink-800">Redirection:</span>
                          <Badge tone={banner.action !== 'none' ? 'success' : 'neutral'}>
                            {banner.action !== 'none' ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="truncate text-[11px] text-ink-500 mt-0.5">
                          {banner.action === 'screen'
                            ? `Redirects to screen: /${banner.actionTarget}`
                            : banner.action === 'url'
                              ? `Redirects to link: ${banner.actionTarget}`
                              : 'No redirection (display only, tapping does nothing)'}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={banner.action !== 'none' ? 'outline' : 'primary'}
                      onClick={() => {
                        const nextAction = banner.action !== 'none' ? 'none' : 'screen';
                        const nextTarget =
                          nextAction === 'none' ? '' : banner.actionTarget || 'coins';
                        update.mutate({
                          bannerId: banner.id,
                          action: nextAction,
                          actionTarget: nextTarget,
                        });
                      }}
                    >
                      {banner.action !== 'none' ? 'Make Inactive' : 'Make Active'}
                    </Button>
                  </div>
                </div>

                {/* Rich Performance Insights Widget */}
                <div className="mt-3.5 rounded-xl border border-ink-200 bg-ink-50/50 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-ink-800">
                      <BarChart3 className="h-3.5 w-3.5 text-brand-600" />
                      <span>Campaign Performance</span>
                    </div>
                    <Badge
                      tone={banner.tapRate > 3 ? 'success' : banner.tapRate > 0 ? 'brand' : 'neutral'}
                      size="sm"
                    >
                      {banner.tapRate > 3 ? '🔥 High Engagement' : banner.tapRate > 0 ? 'Active Traffic' : 'No Clicks Yet'}
                    </Badge>
                  </div>

                  {/* 3 Metrics Pods */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-white p-2 border border-ink-100 shadow-sm">
                      <div className="flex items-center justify-center gap-1 text-[11px] text-ink-500">
                        <Eye className="h-3 w-3 text-blue-500" />
                        <span>Views</span>
                      </div>
                      <p className="mt-0.5 text-sm font-black text-ink-900">
                        {formatNumber(banner.impressions)}
                      </p>
                    </div>

                    <div
                      onClick={() => setDialog({ type: 'clickers', banner })}
                      className="rounded-lg bg-white p-2 border border-ink-100 shadow-sm cursor-pointer hover:border-brand-500 hover:shadow-sm transition"
                      title="Click to view all users who clicked this ad"
                    >
                      <div className="flex items-center justify-center gap-1 text-[11px] text-ink-500">
                        <MousePointerClick className="h-3 w-3 text-emerald-500" />
                        <span>Clicks</span>
                      </div>
                      <p className="mt-0.5 text-sm font-black text-ink-900">
                        {formatNumber(banner.taps)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-white p-2 border border-ink-100 shadow-sm">
                      <div className="flex items-center justify-center gap-1 text-[11px] text-ink-500">
                        <TrendingUp className="h-3 w-3 text-amber-500" />
                        <span>CTR</span>
                      </div>
                      <p className={`mt-0.5 text-sm font-black ${banner.tapRate > 0 ? 'text-emerald-600' : 'text-ink-400'}`}>
                        {banner.tapRate}%
                      </p>
                    </div>
                  </div>

                  {/* Visual CTR Conversion Bar */}
                  <div className="mt-2.5">
                    <div className="flex justify-between text-[10px] text-ink-500 mb-1">
                      <span>Click-Through Rate (CTR)</span>
                      <span className="font-semibold text-ink-700">{banner.tapRate}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${Math.min(Math.max((banner.tapRate || 0) * 10, 2), 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {(banner.startsAt || banner.endsAt) && (
                  <p className="mt-2 text-xs text-ink-500">
                    {banner.startsAt ? formatDateTime(banner.startsAt) : 'now'} →{' '}
                    {banner.endsAt ? formatDateTime(banner.endsAt) : 'until turned off'}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-ink-100 pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      icon={Users}
                      onClick={() => setDialog({ type: 'clickers', banner })}
                    >
                      Clickers ({banner.taps || 0})
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      icon={Bell}
                      onClick={() => setDialog({ type: 'push', banner })}
                    >
                      Send Push
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      icon={Pencil}
                      onClick={() => setDialog({ type: 'edit', banner })}
                    >
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      variant={banner.isActive ? 'ghost' : 'outline'}
                      className={
                        banner.isActive
                          ? 'text-amber-700 hover:bg-amber-50'
                          : 'text-emerald-700 hover:bg-emerald-50'
                      }
                      onClick={() =>
                        update.mutate({ bannerId: banner.id, isActive: !banner.isActive })
                      }
                    >
                      {banner.isActive ? 'Turn Off' : 'Turn On'}
                    </Button>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50"
                    aria-label={`Delete ${banner.title}`}
                    onClick={() => setDialog({ type: 'delete', banner })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
        </div>
      )}

      {(dialog?.type === 'create' || dialog?.type === 'edit') && (
        <BannerDialog
          key={dialog.banner?.id ?? 'new'}
          editing={dialog.banner}
          defaultPlacement={dialog.defaultPlacement ?? 'home_top'}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog?.type === 'clickers' && (
        <AdClickersDialog
          banner={dialog.banner}
          onClose={() => setDialog(null)}
          onOpenPush={(b, aud) =>
            setDialog({ type: 'push', banner: b, defaultAudience: aud })
          }
        />
      )}

      {dialog?.type === 'push' && (
        <SendAdPushDialog
          banner={dialog.banner}
          defaultAudience={dialog.defaultAudience || 'all'}
          onClose={() => setDialog(null)}
        />
      )}

      <ConfirmDialog
        isOpen={dialog?.type === 'delete'}
        onClose={() => setDialog(null)}
        onConfirm={async () => {
          await remove.mutateAsync(dialog.banner.id);
          setDialog(null);
        }}
        title={`Delete “${dialog?.banner?.title}”?`}
        message="The image is removed from storage too. Turn it off instead if you might use it again."
        confirmLabel="Delete banner"
        isLoading={remove.isPending}
      />

      {displayedBanners.length > 0 && (
        <p className="mt-5 flex items-center justify-center gap-2 text-xs text-ink-500">
          <Image className="h-3.5 w-3.5" aria-hidden="true" />
          Banners appear in order, and rotate automatically when there is more than one.
        </p>
      )}
    </>
  );
}
