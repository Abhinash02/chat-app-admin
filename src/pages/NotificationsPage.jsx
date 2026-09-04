import { useRef, useState } from 'react';
import {
  Bell,
  Clock,
  ExternalLink,
  Image as ImageIcon,
  Megaphone,
  Radio,
  Send,
  Sparkles,
  Trash2,
  Upload,
  Users,
  Volume2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import { ConfirmDialog } from '../components/ui/Modal.jsx';
import { EmptyState, SkeletonRows } from '../components/ui/Feedback.jsx';
import { Field, Input, Select, Textarea, Toggle } from '../components/ui/Field.jsx';
import { PageHeader } from '../components/layout/AppLayout.jsx';
import { Pagination, TCell, THead, TRow, Table } from '../components/ui/Table.jsx';
import { formatRelative } from '../lib/format.js';
import {
  useBroadcastNotification,
  useDeleteInAppNotification,
  useInAppNotifications,
} from '../hooks/queries.js';

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All Users (Everyone)', hint: 'Broadcasts to all active members.' },
  { value: 'boys', label: 'Boys Only', hint: 'Delivered only to male users.' },
  { value: 'girls', label: 'Girls Only', hint: 'Delivered only to female users.' },
  { value: 'online', label: 'Online Users Now', hint: 'Real-time alert for currently active members.' },
];

const ACTION_SUGGESTIONS = [
  { label: 'None', value: '' },
  { label: '🪙 Coins Store', value: '/coins' },
  { label: '🎙️ Voice Rooms', value: '/rooms' },
  { label: '🎉 Festival Events & Offers', value: '/events' },
  { label: '🎮 Games Arcade', value: '/games' },
  { label: '💬 Messages Inbox', value: '/(tabs)/chats' },
  { label: '🎧 Customer Support', value: '/support' },
];

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');
  const [actionUrl, setActionUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [playSound, setPlaySound] = useState(true);
  const [sendPush, setSendPush] = useState(true);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fileInputRef = useRef(null);

  const { data, isLoading } = useInAppNotifications({
    skip: (page - 1) * 15,
    limit: 15,
  });

  const broadcastMutation = useBroadcastNotification();
  const deleteMutation = useDeleteInAppNotification();

  const notifications = data?.items || [];
  const total = data?.total || 0;

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageUrl('');
  }

  function handleRemoveImage() {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    setImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const effectivePreview = imagePreview || imageUrl || null;
  const isFormValid = title.trim().length >= 2 && body.trim().length >= 2;

  async function handleBroadcast(e) {
    e.preventDefault();
    if (!isFormValid) {
      toast.error('Please provide a valid title and message');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('body', body.trim());
      formData.append('targetAudience', targetAudience);
      if (actionUrl) formData.append('actionUrl', actionUrl.trim());
      formData.append('sound', playSound ? 'default' : 'none');
      formData.append('sendPush', sendPush ? 'true' : 'false');

      if (imageFile) {
        formData.append('image', imageFile);
      } else if (imageUrl.trim()) {
        formData.append('imageUrl', imageUrl.trim());
      }

      await broadcastMutation.mutateAsync(formData);

      // Reset form on success
      setTitle('');
      setBody('');
      setActionUrl('');
      handleRemoveImage();
      toast.success('Real-time notification broadcasted successfully!');
    } catch (err) {
      toast.error(err?.message || 'Failed to broadcast notification');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget._id || deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to delete notification');
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Broadcast Notifications"
        description="Post instant announcements with real-time sound chimes, in-app top alerts, and 24-hour home feed cards for users."
      />

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        {/* Left Form Composer */}
        <div className="xl:col-span-7">
          <Card>
            <CardHeader
              title="Compose Broadcast Announcement"
              description="Sends an immediate push + in-app realtime sound alert to all connected mobile devices."
            />
            <CardBody>
              <form onSubmit={handleBroadcast} className="space-y-5">
                <Field label="Notification Title *" hint="Catchy title (max 100 chars)">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. 🎁 Weekend Coin Festival & Extra Bonus!"
                    maxLength={100}
                    required
                  />
                </Field>

                <Field label="Notification Message / Text *" hint="Announcement details for users">
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Write your announcement message here..."
                    rows={4}
                    maxLength={500}
                    required
                  />
                  <div className="mt-1 text-right text-xs text-ink-400">
                    {body.length} / 500 characters
                  </div>
                </Field>

                {/* Image Upload / URL */}
                <div className="space-y-3 rounded-xl border border-ink-200 bg-ink-50/50 p-4 dark:border-ink-800 dark:bg-ink-900/40">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-ink-700 dark:text-ink-300 flex items-center gap-1.5">
                      <ImageIcon className="h-4 w-4 text-brand-500" />
                      Announcement Image (Optional)
                    </label>
                    {effectivePreview && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 font-medium"
                      >
                        <X className="h-3.5 w-3.5" /> Remove Image
                      </button>
                    )}
                  </div>

                  {effectivePreview ? (
                    <div className="relative overflow-hidden rounded-xl border border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-950">
                      <img
                        src={effectivePreview}
                        alt="Notification preview"
                        className="h-44 w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-300 p-4 text-center transition hover:border-brand-500 dark:border-ink-700 dark:hover:border-brand-400"
                      >
                        <Upload className="h-6 w-6 text-brand-500 mb-1" />
                        <span className="text-xs font-medium text-ink-700 dark:text-ink-300">
                          Upload Image File
                        </span>
                        <span className="text-[11px] text-ink-400">PNG, JPG, WebP up to 5MB</span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>

                      <div className="flex flex-col justify-center gap-1.5">
                        <span className="text-xs font-medium text-ink-600 dark:text-ink-400">
                          Or enter Image URL:
                        </span>
                        <Input
                          value={imageUrl}
                          onChange={(e) => {
                            setImageUrl(e.target.value);
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          placeholder="https://example.com/banner.jpg"
                          className="text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Target Audience & Action link */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Target Audience" hint="Who should receive this?">
                    <Select
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                    >
                      {AUDIENCE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Action / Deep Link" hint="Opens when user taps">
                    <Select
                      value={actionUrl}
                      onChange={(e) => setActionUrl(e.target.value)}
                    >
                      {ACTION_SUGGESTIONS.map((sug) => (
                        <option key={sug.value} value={sug.value}>
                          {sug.label} {sug.value ? `(${sug.value})` : ''}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-xl border border-ink-200 bg-white p-4 dark:border-ink-800 dark:bg-ink-950">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-ink-900 dark:text-ink-100 flex items-center gap-1.5">
                        <Volume2 className="h-4 w-4 text-emerald-500" />
                        Play Audio Chime 🔔
                      </p>
                      <p className="text-[11px] text-ink-500">Instant sound alert on user device</p>
                    </div>
                    <Toggle checked={playSound} onChange={setPlaySound} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-ink-900 dark:text-ink-100 flex items-center gap-1.5">
                        <Radio className="h-4 w-4 text-indigo-500" />
                        Mobile Push
                      </p>
                      <p className="text-[11px] text-ink-500">Send push to background devices</p>
                    </div>
                    <Toggle checked={sendPush} onChange={setSendPush} />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!isFormValid || broadcastMutation.isPending}
                  isLoading={broadcastMutation.isPending}
                  className="w-full bg-gradient-to-r from-brand-500 via-purple-600 to-pink-500 text-white font-bold py-3 text-sm shadow-lg shadow-brand-500/25 hover:opacity-95"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Broadcast Notification Now
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>

        {/* Right Live Mobile Mockup Preview */}
        <div className="xl:col-span-5">
          <div className="sticky top-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-500 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Live Mobile Preview
              </span>
              <Badge tone="info">Real-Time Mockup</Badge>
            </div>

            {/* Phone Screen Mockup Frame */}
            <div className="mx-auto max-w-[340px] rounded-[36px] border-[6px] border-ink-900 bg-ink-950 p-3 shadow-2xl">
              {/* Phone Speaker Notch */}
              <div className="mx-auto mb-3 h-3.5 w-24 rounded-full bg-ink-800" />

              <div className="space-y-3 rounded-[24px] bg-ink-900 p-3 text-white min-h-[460px]">
                {/* 1. Real-time Top Notification Alert Banner (Appears on chime) */}
                <div className="rounded-2xl border border-white/15 bg-white/10 p-3.5 shadow-xl backdrop-blur-md transition-all">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="grid h-5 w-5 place-items-center rounded-md bg-gradient-to-tr from-brand-500 to-pink-500 text-[10px] font-bold text-white shadow">
                      V
                    </div>
                    <span className="text-[11px] font-bold tracking-wide text-ink-200">
                      Vibe Live Announcement
                    </span>
                    <span className="ml-auto text-[10px] text-ink-400">Just now</span>
                  </div>

                  {effectivePreview && (
                    <div className="mb-2 overflow-hidden rounded-xl border border-white/10">
                      <img
                        src={effectivePreview}
                        alt="Preview"
                        className="h-28 w-full object-cover"
                      />
                    </div>
                  )}

                  <p className="text-sm font-extrabold text-white line-clamp-1">
                    {title || 'Special Notification Title 🎉'}
                  </p>
                  <p className="mt-1 text-xs text-white/90 line-clamp-2 leading-relaxed">
                    {body || 'Your real-time announcement message appears here with instant chime sound.'}
                  </p>

                  {actionUrl && (
                    <div className="mt-2.5 flex items-center justify-end">
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/30 px-2.5 py-1 text-[10px] font-bold text-white border border-brand-400/40">
                        Open action <ExternalLink className="h-2.5 w-2.5" />
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. 24-Hour Home Section Card Preview */}
                <div className="pt-2">
                  <div className="flex items-center justify-between pb-1.5 px-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-300">
                      Home Feed Section (24h Active)
                    </span>
                    <span className="text-[9px] text-emerald-400 font-bold">● Visible</span>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-brand-500/40 bg-gradient-to-br from-brand-950/80 to-purple-950/60 p-3.5">
                    <div className="flex items-start gap-2.5">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-500/30 text-brand-300">
                        <Bell className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">
                          {title || 'Announcement Title'}
                        </p>
                        <p className="text-[11px] text-white/80 line-clamp-2 mt-0.5 leading-snug">
                          {body || 'Announcement message in the 24-hour home feed card.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Note */}
                <div className="pt-4 text-center">
                  <p className="text-[10px] text-ink-400">
                    🔔 Sound will chime on user phone immediately upon broadcast.
                  </p>
                  <p className="text-[9px] text-ink-500 mt-1">
                    Card remains active on home screen for 24 hours.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History Table */}
      <Card>
        <CardHeader
          title="Past Broadcast Notifications"
          description="History of all sent notifications across users."
        />
        <CardBody className="p-0">
          <Table>
            <THead>
              <TRow>
                <TCell isHeader>Image</TCell>
                <TCell isHeader>Title & Message</TCell>
                <TCell isHeader>Target Audience</TCell>
                <TCell isHeader>Action Link</TCell>
                <TCell isHeader>Sent At</TCell>
                <TCell isHeader align="right">Actions</TCell>
              </TRow>
            </THead>
            <tbody>
              {isLoading ? (
                <SkeletonRows count={5} columns={6} />
              ) : notifications.length === 0 ? (
                <TRow>
                  <TCell colSpan={6} className="py-12 text-center">
                    <EmptyState
                      icon={Megaphone}
                      title="No notifications broadcasted yet"
                      description="Create and broadcast your first notification to all users above."
                    />
                  </TCell>
                </TRow>
              ) : (
                notifications.map((item) => (
                  <TRow key={item._id || item.id}>
                    <TCell>
                      {item.imageUrl ? (
                        <a
                          href={item.imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block h-12 w-16 overflow-hidden rounded-lg border border-ink-200 bg-ink-100 hover:opacity-90 dark:border-ink-800 dark:bg-ink-900"
                        >
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </a>
                      ) : (
                        <div className="grid h-12 w-16 place-items-center rounded-lg border border-ink-200 bg-ink-100 text-ink-400 dark:border-ink-800 dark:bg-ink-900">
                          <Bell className="h-5 w-5 opacity-40" />
                        </div>
                      )}
                    </TCell>
                    <TCell className="max-w-md">
                      <div className="space-y-1">
                        <p className="font-bold text-sm text-ink-950 dark:text-white truncate">
                          {item.title}
                        </p>
                        <p className="text-xs font-normal text-ink-800 dark:text-ink-200 line-clamp-2 leading-relaxed">
                          {item.body}
                        </p>
                      </div>
                    </TCell>
                    <TCell>
                      <Badge
                        tone={
                          item.targetAudience === 'boys'
                            ? 'info'
                            : item.targetAudience === 'girls'
                              ? 'pink'
                              : item.targetAudience === 'online'
                                ? 'success'
                                : 'purple'
                        }
                      >
                        {item.targetAudience === 'boys'
                          ? 'Boys only'
                          : item.targetAudience === 'girls'
                            ? 'Girls only'
                            : item.targetAudience === 'online'
                              ? 'Online users'
                              : 'Everyone'}
                      </Badge>
                    </TCell>
                    <TCell>
                      {item.actionUrl ? (
                        <code className="rounded bg-ink-100 px-1.5 py-0.5 text-xs text-ink-700 dark:bg-ink-800 dark:text-ink-300">
                          {item.actionUrl}
                        </code>
                      ) : (
                        <span className="text-xs text-ink-400">—</span>
                      )}
                    </TCell>
                    <TCell className="text-xs text-ink-500 whitespace-nowrap">
                      {item.createdAt ? formatRelative(item.createdAt) : '—'}
                    </TCell>
                    <TCell align="right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(item)}
                        className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TCell>
                  </TRow>
                ))
              )}
            </tbody>
          </Table>

          {total > 15 && (
            <div className="border-t border-ink-200 px-6 py-4 dark:border-ink-800">
              <Pagination
                page={page}
                pageSize={15}
                total={total}
                onPageChange={setPage}
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Notification"
        description="Are you sure you want to delete this notification record? Users will no longer see it in their inbox."
        confirmText="Delete Notification"
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
