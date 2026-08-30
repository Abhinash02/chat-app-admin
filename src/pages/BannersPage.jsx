import { useState } from 'react';
import { Image, MousePointerClick, Plus, Eye, Trash2, Pencil, Megaphone } from 'lucide-react';

import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { ConfirmDialog, Modal } from '../components/ui/Modal.jsx';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/Feedback.jsx';
import { Field, Input, NumberInput, Select, Toggle } from '../components/ui/Field.jsx';
import { PageHeader } from '../components/layout/AppLayout.jsx';
import { formatDateTime, formatNumber } from '../lib/format.js';
import { useBanners, useCreateBanner, useDeleteBanner, useUpdateBanner } from '../hooks/queries.js';

const ANIMATIONS = [
  { value: 'pan', label: 'Slow pan', hint: 'Drifts sideways. Best for a wide image.' },
  { value: 'pulse', label: 'Pulse', hint: 'Gently scales in and out.' },
  { value: 'shimmer', label: 'Shimmer', hint: 'A light sweeps across it.' },
  { value: 'fade', label: 'Fade', hint: 'Cross-fades between banners.' },
  { value: 'none', label: 'Still', hint: 'No motion at all.' },
];

const SCREENS = ['coins', 'rooms', 'games', 'chats', 'leaderboard'];

/** `datetime-local` needs "YYYY-MM-DDTHH:mm" in local time, not an ISO string. */
function toLocalInput(value) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function BannerDialog({ editing, onClose }) {
  const [form, setForm] = useState(() => ({
    title: editing?.title ?? '',
    note: editing?.note ?? '',
    animation: editing?.animation ?? 'pan',
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
          label="Image"
          hint="Wide and short works best — roughly 3:1. JPEG, PNG or WebP, up to 5 MB."
        >
          <div className="space-y-2">
            {preview && (
              <div className="overflow-hidden rounded-xl border border-ink-200">
                <img src={preview} alt="" className="h-28 w-full object-cover" />
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
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

          <Field label="Animation" hint={ANIMATIONS.find((a) => a.value === form.animation)?.hint}>
            <Select value={form.animation} onChange={(e) => set('animation', e.target.value)}>
              {ANIMATIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Tapping it">
            <Select
              value={form.action}
              onChange={(e) => {
                set('action', e.target.value);
                set('actionTarget', '');
              }}
            >
              <option value="none">Does nothing</option>
              <option value="screen">Opens a screen</option>
              <option value="url">Opens a link</option>
            </Select>
          </Field>

          {form.action === 'screen' && (
            <Field label="Which screen">
              <Select value={form.actionTarget} onChange={(e) => set('actionTarget', e.target.value)}>
                <option value="">Choose…</option>
                {SCREENS.map((screen) => (
                  <option key={screen} value={screen}>
                    {screen}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          {form.action === 'url' && (
            <Field label="Link" hint="Must start with http:// or https://">
              <Input
                value={form.actionTarget}
                onChange={(e) => set('actionTarget', e.target.value)}
                placeholder="https://example.com/offer"
              />
            </Field>
          )}

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

export function BannersPage() {
  const { data: banners, isLoading, error, refetch } = useBanners();
  const [dialog, setDialog] = useState(null);
  const remove = useDeleteBanner();

  if (isLoading) return <LoadingState label="Loading banners…" />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <>
      <PageHeader
        title="Banners"
        description="The promo strip at the top of the home feed. Schedule one for a match, a festival or a weekend offer and it turns itself on and off."
        action={
          <Button icon={Plus} onClick={() => setDialog({ type: 'create' })}>
            New banner
          </Button>
        }
      />

      {banners.length === 0 ? (
        <Card>
          <EmptyState
            icon={Megaphone}
            title="No banners yet"
            description="Add one to promote an offer, an event or a new feature."
            action={
              <Button icon={Plus} onClick={() => setDialog({ type: 'create' })}>
                Create the first one
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {banners.map((banner) => (
            <Card key={banner.id} className="overflow-hidden">
              <div className="relative">
                <img src={banner.imageUrl} alt="" className="h-32 w-full object-cover" />
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
                <p className="text-sm font-semibold text-ink-900">{banner.title}</p>
                {banner.note && <p className="mt-0.5 text-xs text-ink-500">{banner.note}</p>}

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    {formatNumber(banner.impressions)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MousePointerClick className="h-3.5 w-3.5" aria-hidden="true" />
                    {formatNumber(banner.taps)}
                  </span>
                  {banner.impressions > 0 && (
                    <span className="font-medium text-ink-700">{banner.tapRate}% tapped</span>
                  )}
                </div>

                {(banner.startsAt || banner.endsAt) && (
                  <p className="mt-2 text-xs text-ink-500">
                    {banner.startsAt ? formatDateTime(banner.startsAt) : 'now'} →{' '}
                    {banner.endsAt ? formatDateTime(banner.endsAt) : 'until turned off'}
                  </p>
                )}

                <div className="mt-4 flex items-center gap-2">
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
                    variant="ghost"
                    className="ml-auto text-red-600 hover:bg-red-50"
                    aria-label={`Delete ${banner.title}`}
                    onClick={() => setDialog({ type: 'delete', banner })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {(dialog?.type === 'create' || dialog?.type === 'edit') && (
        <BannerDialog
          key={dialog.banner?.id ?? 'new'}
          editing={dialog.banner}
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

      {banners.length > 0 && (
        <p className="mt-5 flex items-center justify-center gap-2 text-xs text-ink-500">
          <Image className="h-3.5 w-3.5" aria-hidden="true" />
          Banners appear in order, and rotate automatically when there is more than one.
        </p>
      )}
    </>
  );
}
