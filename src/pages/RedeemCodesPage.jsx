import { useState } from 'react';
import { Gift, Plus, Tag, Trash2, Users } from 'lucide-react';

import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { ConfirmDialog, Modal } from '../components/ui/Modal.jsx';
import { EmptyState, ErrorState, SkeletonRows } from '../components/ui/Feedback.jsx';
import { Field, Input, Select, Textarea } from '../components/ui/Field.jsx';
import { PageHeader } from '../components/layout/AppLayout.jsx';
import { Pagination, TCell, THead, TRow, Table } from '../components/ui/Table.jsx';
import { formatNumber, formatRelative } from '../lib/format.js';
import {
  useCreateRedeemCode,
  useDeleteRedeemCode,
  useRedeemCodes,
} from '../hooks/queries.js';

const COLUMNS = [
  { key: 'code', label: 'Promo Code' },
  { key: 'type', label: 'Reward / Discount' },
  { key: 'target', label: 'Target Scope' },
  { key: 'usage', label: 'Redeemed / Limit' },
  { key: 'expiry', label: 'Expires' },
  { key: 'created', label: 'Created' },
  { key: 'actions', label: '', align: 'right' },
];

function CreateRedeemCodeModal({ isOpen, onClose }) {
  const createCode = useCreateRedeemCode();

  const [form, setForm] = useState({
    code: '',
    description: '',
    rewardType: 'free_coins',
    coins: 50,
    discountPercent: 30,
    discountAmountInRupees: 50,
    targetType: 'all',
    targetUserEmail: '',
    maxUsesTotal: 1000,
    maxUsesPerUser: 1,
    expiresAt: '',
    sendPush: true,
    sendEmail: true,
  });

  function generateRandomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm((f) => ({ ...f, code: `VIBE-${result}` }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.code.trim()) return;

    await createCode.mutateAsync({
      ...form,
      code: form.code.trim().toUpperCase(),
      coins: form.rewardType === 'free_coins' ? Number(form.coins) : 0,
      discountPercent: form.rewardType === 'discount_percent' ? Number(form.discountPercent) : 0,
      discountAmountInRupees: form.rewardType === 'discount_flat' ? Number(form.discountAmountInRupees) : 0,
      maxUsesTotal: Number(form.maxUsesTotal) || 1000,
      maxUsesPerUser: Number(form.maxUsesPerUser) || 1,
      targetUserEmail: form.targetType === 'single_user' ? form.targetUserEmail.trim() : null,
    });
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🎁 Generate New Redeem Code / Coupon" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Field label="Promo Code" hint="Unique uppercase string">
              <div className="flex gap-2">
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. DIWALI100 or WELCOME50"
                  required
                  autoFocus
                  className="font-mono font-bold tracking-wider uppercase"
                />
                <Button type="button" variant="outline" size="sm" onClick={generateRandomCode}>
                  Generate
                </Button>
              </div>
            </Field>
          </div>

          <Field label="Reward / Voucher Type">
            <Select
              value={form.rewardType}
              onChange={(e) => setForm({ ...form, rewardType: e.target.value })}
            >
              <option value="free_coins">🪙 Free Coins Voucher</option>
              <option value="discount_percent">🏷️ % Discount on Packs</option>
              <option value="discount_flat">💰 Flat ₹ Discount on Packs</option>
            </Select>
          </Field>
        </div>

        {/* Dynamic Reward Field */}
        <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-3.5">
          {form.rewardType === 'free_coins' && (
            <Field label="Coins to Credit to Wallet" hint="Amount of free coins given on code redemption">
              <Input
                type="number"
                min="1"
                max="100000"
                value={form.coins}
                onChange={(e) => setForm({ ...form, coins: e.target.value })}
                required
              />
            </Field>
          )}

          {form.rewardType === 'discount_percent' && (
            <Field label="Discount Percentage (%)" hint="Reduces package prices by this % (e.g. 50% OFF)">
              <Input
                type="number"
                min="1"
                max="100"
                value={form.discountPercent}
                onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                required
              />
            </Field>
          )}

          {form.rewardType === 'discount_flat' && (
            <Field label="Flat Discount Amount (₹)" hint="Reduces package price by ₹ amount (e.g. ₹50 OFF)">
              <Input
                type="number"
                min="1"
                max="10000"
                value={form.discountAmountInRupees}
                onChange={(e) => setForm({ ...form, discountAmountInRupees: e.target.value })}
                required
              />
            </Field>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Target Audience Scope">
            <Select
              value={form.targetType}
              onChange={(e) => setForm({ ...form, targetType: e.target.value })}
            >
              <option value="all">👥 All Users (Everyone)</option>
              <option value="male">👦 Boys Only (Male Users)</option>
              <option value="female">👧 Girls Only (Female Users)</option>
              <option value="single_user">👤 Single Specific User</option>
            </Select>
          </Field>

          {form.targetType === 'single_user' && (
            <Field label="Target User Email" hint="Enter user's registered email">
              <Input
                type="email"
                value={form.targetUserEmail}
                onChange={(e) => setForm({ ...form, targetUserEmail: e.target.value })}
                placeholder="user@example.com"
                required
              />
            </Field>
          )}

          <Field label="Max Uses Per User">
            <Input
              type="number"
              min="1"
              max="100"
              value={form.maxUsesPerUser}
              onChange={(e) => setForm({ ...form, maxUsesPerUser: e.target.value })}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Total Usage Limit" hint="Total times this code can be claimed across all users">
            <Input
              type="number"
              min="1"
              value={form.maxUsesTotal}
              onChange={(e) => setForm({ ...form, maxUsesTotal: e.target.value })}
            />
          </Field>

          <Field label="Expiry Date" hint="Leave empty for no expiry">
            <Input
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Internal Note / Description">
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="e.g. VIP Gift code / Special promotional campaign"
            rows={2}
          />
        </Field>

        <div className="rounded-xl border border-ink-200 bg-ink-50/60 p-3.5 space-y-2">
          <p className="text-xs font-semibold text-ink-900 uppercase tracking-wider">
            📢 Automated Alerts
          </p>
          <div className="flex flex-wrap gap-4 text-xs font-medium text-ink-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.sendPush}
                onChange={(e) => setForm({ ...form, sendPush: e.target.checked })}
                className="rounded border-ink-300 text-brand-600 focus:ring-brand-500"
              />
              <span>📱 Send Instant Push Notification</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.sendEmail}
                onChange={(e) => setForm({ ...form, sendEmail: e.target.checked })}
                className="rounded border-ink-300 text-brand-600 focus:ring-brand-500"
              />
              <span>📧 Send Instant Email with Promo Code</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="brand" type="submit" isLoading={createCode.isPending}>
            Generate & Send Code
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function RedeemCodesPage() {
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedCodeDetails, setSelectedCodeDetails] = useState(null);

  const { data, isLoading, error, refetch } = useRedeemCodes({ page, limit: 10 });
  const deleteCode = useDeleteRedeemCode();

  const codes = data?.items ?? [];

  return (
    <>
      <PageHeader
        title="Redeem Codes & Vouchers"
        description="Generate coin gift vouchers and discount coupons assigned to everyone, boys only, or specific users with instant alerts."
        action={
          <Button variant="brand" icon={Plus} onClick={() => setIsCreateOpen(true)}>
            Generate Redeem Code
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
                ) : codes.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length}>
                      <EmptyState
                        icon={Gift}
                        title="No redeem codes generated yet"
                        description="Click 'Generate Redeem Code' to create free coin vouchers or discount coupons for your users."
                      />
                    </td>
                  </tr>
                ) : (
                  codes.map((item) => (
                    <TRow key={item._id}>
                      <TCell>
                        <span className="font-mono font-bold text-ink-900 bg-ink-100 px-2 py-0.5 rounded text-sm tracking-wide">
                          {item.code}
                        </span>
                        {item.description && (
                          <p className="max-w-xs truncate text-xs text-ink-500 mt-1">
                            {item.description}
                          </p>
                        )}
                      </TCell>

                      <TCell>
                        {item.rewardType === 'free_coins' && (
                          <span className="font-semibold text-amber-600 text-xs">
                            🪙 +{formatNumber(item.coins)} Free Coins
                          </span>
                        )}
                        {item.rewardType === 'discount_percent' && (
                          <span className="font-semibold text-emerald-600 text-xs">
                            🏷️ {item.discountPercent}% OFF
                          </span>
                        )}
                        {item.rewardType === 'discount_flat' && (
                          <span className="font-semibold text-emerald-600 text-xs">
                            💰 ₹{item.discountAmountInRupees} OFF
                          </span>
                        )}
                      </TCell>

                      <TCell>
                        <Badge
                          tone={
                            item.targetType === 'single_user'
                              ? 'purple'
                              : item.targetType === 'male'
                              ? 'warning'
                              : 'neutral'
                          }
                        >
                          {item.targetType === 'single_user'
                            ? `👤 ${item.targetUserEmail || 'Single User'}`
                            : item.targetType === 'male'
                            ? '👦 Boys Only'
                            : item.targetType === 'female'
                            ? '👧 Girls Only'
                            : '👥 Everyone'}
                        </Badge>
                      </TCell>

                      <TCell className="text-xs">
                        <button
                          type="button"
                          onClick={() => setSelectedCodeDetails(item)}
                          className="font-medium text-brand-600 hover:underline"
                        >
                          {item.usedCount} / {item.maxUsesTotal} used
                        </button>
                        <span className="block text-[11px] text-ink-400">
                          ({item.maxUsesPerUser}/user max)
                        </span>
                      </TCell>

                      <TCell className="text-xs text-ink-600">
                        {item.expiresAt ? (
                          <span>{new Date(item.expiresAt).toLocaleDateString()}</span>
                        ) : (
                          <span className="text-ink-400">Never</span>
                        )}
                      </TCell>

                      <TCell className="text-xs text-ink-500">
                        {formatRelative(item.createdAt)}
                      </TCell>

                      <TCell align="right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => setDeleteTarget(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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

      {/* Create Modal */}
      {isCreateOpen && (
        <CreateRedeemCodeModal isOpen onClose={() => setIsCreateOpen(false)} />
      )}

      {/* Delete Modal */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          await deleteCode.mutateAsync(deleteTarget._id);
          setDeleteTarget(null);
        }}
        title="Delete this redeem code?"
        message={
          deleteTarget ? `Are you sure you want to deactivate and remove code "${deleteTarget.code}"?` : ''
        }
        confirmLabel="Yes, Delete Code"
        variant="danger"
        isLoading={deleteCode.isPending}
      />

      {/* Redemptions Details Modal */}
      {selectedCodeDetails && (
        <Modal
          isOpen
          onClose={() => setSelectedCodeDetails(null)}
          title={`Redemptions for ${selectedCodeDetails.code}`}
          size="md"
        >
          <div className="space-y-3">
            <p className="text-xs text-ink-500">
              Total claimed: <strong>{selectedCodeDetails.redemptions?.length ?? 0}</strong> of{' '}
              {selectedCodeDetails.maxUsesTotal}
            </p>
            <div className="max-h-72 overflow-y-auto divide-y divide-ink-100 rounded-xl border border-ink-200">
              {selectedCodeDetails.redemptions?.length === 0 ? (
                <p className="p-4 text-center text-xs text-ink-400">No users have claimed this code yet.</p>
              ) : (
                selectedCodeDetails.redemptions?.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-3 text-xs">
                    <div>
                      <p className="font-semibold text-ink-900">{r.userNickname || r.userEmail || 'User'}</p>
                      <p className="text-[11px] text-ink-400">{formatRelative(r.redeemedAt)}</p>
                    </div>
                    <span className="font-bold text-amber-600">+{r.creditedCoins} coins</span>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setSelectedCodeDetails(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
