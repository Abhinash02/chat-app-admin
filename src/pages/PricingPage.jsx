import { useState } from 'react';
import { Coins, MessageSquare, Pencil, Plus, Save, Star, Timer, Trash2 } from 'lucide-react';

import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import { ConfirmDialog, Modal } from '../components/ui/Modal.jsx';
import { ErrorState, LoadingState } from '../components/ui/Feedback.jsx';
import { Field, Input, NumberInput, Textarea, Toggle } from '../components/ui/Field.jsx';
import { PageHeader } from '../components/layout/AppLayout.jsx';
import { formatNumber, formatPaise } from '../lib/format.js';
import {
  useCreatePackage,
  useDeletePackage,
  usePackages,
  useSettings,
  useUpdatePackage,
  useUpdateSettings,
} from '../hooks/queries.js';

const EMPTY_PACKAGE = {
  name: '',
  description: '',
  priceInPaise: 5000,
  coins: 60,
  bonusCoins: 0,
  badge: '',
  isPopular: false,
  isActive: true,
  sortOrder: 0,
};

/**
 * Mounted only while open and keyed by the pack being edited, so the form state
 * initialises once from props. That removes the "reset the form when the dialog
 * opens" effect entirely — the component simply does not exist between uses.
 */
function PackageDialog({ onClose, editing }) {
  const [form, setForm] = useState(() =>
    editing
      ? {
          name: editing.name,
          description: editing.description ?? '',
          priceInPaise: editing.priceInPaise,
          coins: editing.coins,
          bonusCoins: editing.bonusCoins ?? 0,
          badge: editing.badge ?? '',
          isPopular: editing.isPopular ?? false,
          isActive: editing.isActive ?? true,
          sortOrder: editing.sortOrder ?? 0,
        }
      : EMPTY_PACKAGE,
  );

  const create = useCreatePackage();
  const update = useUpdatePackage();
  const isSaving = create.isPending || update.isPending;

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit() {
    const payload = {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      badge: form.badge.trim(),
    };

    if (editing) await update.mutateAsync({ packageId: editing._id, ...payload });
    else await create.mutateAsync(payload);

    onClose();
  }

  const rupees = form.priceInPaise / 100;
  const totalCoins = Number(form.coins) + Number(form.bonusCoins);
  // The number a buyer actually compares packs on.
  const coinsPerRupee = rupees > 0 ? (totalCoins / rupees).toFixed(1) : '—';
  const isValid = form.name.trim().length >= 2 && form.priceInPaise >= 100 && form.coins >= 1;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={editing ? `Edit “${editing.name}”` : 'New coin pack'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button icon={Save} onClick={handleSubmit} isLoading={isSaving} disabled={!isValid}>
            {editing ? 'Save pack' : 'Create pack'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Name" className="sm:col-span-2">
          <Input value={form.name} onChange={(event) => set('name', event.target.value)} placeholder="e.g. Popular" maxLength={60} />
        </Field>

        <Field label="Description" className="sm:col-span-2" hint="One line shown under the price.">
          <Textarea
            rows={2}
            value={form.description}
            onChange={(event) => set('description', event.target.value)}
            maxLength={160}
            placeholder="e.g. Best value for everyday chatting."
          />
        </Field>

        <Field label="Price" hint="What the buyer pays.">
          <NumberInput
            value={rupees}
            min={1}
            step={1}
            suffix="₹"
            // Prices are stored in paise so no float rounding reaches the gateway.
            onChange={(event) => set('priceInPaise', Math.round(Number(event.target.value) * 100))}
          />
        </Field>

        <Field label="Coins" hint="The base amount credited.">
          <NumberInput value={form.coins} min={1} suffix="coins" onChange={(event) => set('coins', Number(event.target.value))} />
        </Field>

        <Field label="Bonus coins" hint="Shown separately as a sweetener.">
          <NumberInput
            value={form.bonusCoins}
            min={0}
            suffix="coins"
            onChange={(event) => set('bonusCoins', Number(event.target.value))}
          />
        </Field>

        <Field label="Badge" hint="Optional ribbon, e.g. “Best value”.">
          <Input value={form.badge} onChange={(event) => set('badge', event.target.value)} maxLength={24} />
        </Field>

        <Field label="Sort order" hint="Lower numbers appear first.">
          <NumberInput value={form.sortOrder} min={0} onChange={(event) => set('sortOrder', Number(event.target.value))} />
        </Field>

        <div className="space-y-3 sm:pt-7">
          <Toggle
            checked={form.isPopular}
            onChange={(value) => set('isPopular', value)}
            label="Highlight as popular"
          />
          <Toggle
            checked={form.isActive}
            onChange={(value) => set('isActive', value)}
            label="Available to buy"
            description="Turn off to retire a pack without deleting it."
          />
        </div>

        <div className="rounded-xl bg-ink-50 p-4 sm:col-span-2">
          <p className="text-sm text-ink-600">
            Buyers pay <span className="font-semibold text-ink-900">{formatPaise(form.priceInPaise)}</span> for{' '}
            <span className="font-semibold text-ink-900">{formatNumber(totalCoins)} coins</span>
            {form.bonusCoins > 0 && ` (${form.coins} + ${form.bonusCoins} bonus)`} —{' '}
            <span className="font-semibold text-ink-900">{coinsPerRupee}</span> coins per rupee.
          </p>
        </div>
      </div>
    </Modal>
  );
}

function CoinRulesCard({ settings }) {
  const saved = settings.coins;

  const [form, setForm] = useState(saved);
  const [syncedWith, setSyncedWith] = useState(saved);
  const update = useUpdateSettings();

  // See SettingsPage: adjusting during render keeps the form in step with a
  // save made elsewhere without committing a stale draft first.
  if (syncedWith !== saved) {
    setSyncedWith(saved);
    setForm(saved);
  }

  const hasChanges = JSON.stringify(form) !== JSON.stringify(saved);

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <Card>
      <CardHeader
        title="Coin rules"
        description="How messages are charged. Changes apply to the next message anyone sends."
        action={
          <Button
            size="sm"
            icon={Save}
            disabled={!hasChanges}
            isLoading={update.isPending}
            onClick={() =>
              update.mutate({
                coins: {
                  freeTalkMinutes: Number(form.freeTalkMinutes),
                  messagesPerBlock: Number(form.messagesPerBlock),
                  coinsPerBlock: Number(form.coinsPerBlock),
                  dailyBonusCoins: Number(form.dailyBonusCoins),
                  dailyBonusIntervalHours: Number(form.dailyBonusIntervalHours),
                  signupBonusCoins: Number(form.signupBonusCoins),
                },
              })
            }
          >
            Save rules
          </Button>
        }
      />
      <CardBody className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Free chat on signup" hint="One-off allowance for paying accounts.">
            <NumberInput
              value={form.freeTalkMinutes}
              min={0}
              max={1440}
              suffix="min"
              onChange={(event) => set('freeTalkMinutes', event.target.value)}
            />
          </Field>

          <Field label="Signup bonus" hint="Coins credited once, at registration.">
            <NumberInput
              value={form.signupBonusCoins}
              min={0}
              suffix="coins"
              onChange={(event) => set('signupBonusCoins', event.target.value)}
            />
          </Field>

          <Field label="Messages per charge">
            <NumberInput
              value={form.messagesPerBlock}
              min={1}
              suffix="msgs"
              onChange={(event) => set('messagesPerBlock', event.target.value)}
            />
          </Field>

          <Field label="Coins per charge">
            <NumberInput
              value={form.coinsPerBlock}
              min={0}
              suffix="coins"
              onChange={(event) => set('coinsPerBlock', event.target.value)}
            />
          </Field>

          <Field label="Daily bonus">
            <NumberInput
              value={form.dailyBonusCoins}
              min={0}
              suffix="coins"
              onChange={(event) => set('dailyBonusCoins', event.target.value)}
            />
          </Field>

          <Field label="Bonus interval">
            <NumberInput
              value={form.dailyBonusIntervalHours}
              min={1}
              max={720}
              suffix="hrs"
              onChange={(event) => set('dailyBonusIntervalHours', event.target.value)}
            />
          </Field>
        </div>

        {/* Restating the rule in plain language catches transposed numbers
            before they reach a paying user. */}
        <div className="flex flex-wrap gap-3 rounded-xl bg-ink-50 p-4 text-sm text-ink-600">
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-ink-400" aria-hidden="true" />
            <strong className="text-ink-900">{form.messagesPerBlock}</strong> messages cost{' '}
            <strong className="text-ink-900">{form.coinsPerBlock}</strong> coins
          </span>
          <span className="text-ink-300">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Timer className="h-4 w-4 text-ink-400" aria-hidden="true" />
            first <strong className="text-ink-900">{form.freeTalkMinutes}</strong> minutes free
          </span>
          <span className="text-ink-300">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Coins className="h-4 w-4 text-ink-400" aria-hidden="true" />
            <strong className="text-ink-900">{form.dailyBonusCoins}</strong> coins every{' '}
            <strong className="text-ink-900">{form.dailyBonusIntervalHours}</strong> hours
          </span>
        </div>

        <p className="text-xs text-ink-500">
          Girls chat free and unlimited — they are never charged and do not receive the daily bonus.
          That rule is set by <code className="rounded bg-ink-100 px-1 py-0.5">chargedGenders</code> and is
          intentionally not editable here.
        </p>
      </CardBody>
    </Card>
  );
}

export function PricingPage() {
  const packagesQuery = usePackages();
  const settingsQuery = useSettings();

  const [dialog, setDialog] = useState(null);
  const remove = useDeletePackage();

  if (packagesQuery.isLoading || settingsQuery.isLoading) return <LoadingState label="Loading pricing…" />;
  if (packagesQuery.error) return <ErrorState error={packagesQuery.error} onRetry={packagesQuery.refetch} />;
  if (settingsQuery.error) return <ErrorState error={settingsQuery.error} onRetry={settingsQuery.refetch} />;

  const packages = packagesQuery.data ?? [];

  return (
    <>
      <PageHeader
        title="Pricing & coins"
        description="What coins cost to buy, and what they buy. Everything here is live immediately."
        action={
          <Button icon={Plus} onClick={() => setDialog({ type: 'package' })}>
            New pack
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {packages.map((coinPackage) => (
          <Card key={coinPackage._id} className={`p-5 ${coinPackage.isActive ? '' : 'opacity-60'}`}>
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink-900">{coinPackage.name}</p>
                {coinPackage.description && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-ink-500">{coinPackage.description}</p>
                )}
              </div>
              {coinPackage.isPopular && (
                <Badge tone="brand">
                  <Star className="h-3 w-3" aria-hidden="true" />
                  Popular
                </Badge>
              )}
            </div>

            <p className="text-2xl font-semibold tracking-tight text-ink-900">
              {formatPaise(coinPackage.priceInPaise)}
            </p>

            <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-600">
              <Coins className="h-4 w-4 text-amber-500" aria-hidden="true" />
              {formatNumber(coinPackage.coins + (coinPackage.bonusCoins ?? 0))} coins
              {coinPackage.bonusCoins > 0 && (
                <span className="text-xs text-emerald-600">+{coinPackage.bonusCoins} bonus</span>
              )}
            </p>

            <div className="mt-4 flex items-center gap-2">
              {!coinPackage.isActive && <Badge tone="neutral">Hidden</Badge>}
              <Button
                size="sm"
                variant="outline"
                icon={Pencil}
                className="ml-auto"
                onClick={() => setDialog({ type: 'package', editing: coinPackage })}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600 hover:bg-red-50"
                aria-label={`Delete ${coinPackage.name}`}
                onClick={() => setDialog({ type: 'delete', coinPackage })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}

        {packages.length === 0 && (
          <Card className="p-8 text-center sm:col-span-2 xl:col-span-4">
            <p className="text-sm text-ink-500">No coin packs yet. Create one so users can buy coins.</p>
          </Card>
        )}
      </div>

      <CoinRulesCard settings={settingsQuery.data} />

      {dialog?.type === 'package' && (
        <PackageDialog
          key={dialog.editing?._id ?? 'new'}
          onClose={() => setDialog(null)}
          editing={dialog.editing}
        />
      )}

      <ConfirmDialog
        isOpen={dialog?.type === 'delete'}
        onClose={() => setDialog(null)}
        onConfirm={async () => {
          await remove.mutateAsync(dialog.coinPackage._id);
          setDialog(null);
        }}
        title={`Delete “${dialog?.coinPackage?.name}”?`}
        message="Existing orders keep the price they were placed at, but nobody will be able to buy this pack again. Consider hiding it instead."
        confirmLabel="Delete pack"
        isLoading={remove.isPending}
      />
    </>
  );
}
