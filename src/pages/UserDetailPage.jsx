import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Ban,
  Coins,
  Clock,
  LogOut,
  MapPin,
  ShieldCheck,
  Timer,
} from 'lucide-react';

import { Avatar } from '../components/ui/Avatar.jsx';
import { Badge, PresenceDot, StatusBadge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import { ConfirmDialog, Modal } from '../components/ui/Modal.jsx';
import { ErrorState, LoadingState } from '../components/ui/Feedback.jsx';
import { Field, Input, NumberInput, Textarea } from '../components/ui/Field.jsx';
import { TCell, THead, TRow, Table } from '../components/ui/Table.jsx';
import { formatDateTime, formatNumber, formatPaise, formatRelative } from '../lib/format.js';
import {
  useAdjustCoins,
  useForceLogout,
  useReactivateUser,
  useResetFreeTalk,
  useSuspendUser,
  useUserDetail,
} from '../hooks/queries.js';

function InfoRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-sm text-ink-500">{label}</span>
      <span className="text-right text-sm font-medium text-ink-900">{children}</span>
    </div>
  );
}

function SuspendDialog({ isOpen, onClose, userId, nickname }) {
  const [reason, setReason] = useState('');
  const suspend = useSuspendUser();

  async function handleConfirm() {
    await suspend.mutateAsync({ userId, reason });
    setReason('');
    onClose();
  }

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={`Suspend ${nickname}?`}
      message="They will be signed out of every device immediately and will not be able to sign back in. You can reverse this at any time."
      confirmLabel="Suspend account"
      isLoading={suspend.isPending}
    >
      <Field label="Reason" hint="Shown to the user when they try to sign in.">
        <Textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="e.g. Repeated harassment reports"
          maxLength={200}
        />
      </Field>
    </ConfirmDialog>
  );
}

function AdjustCoinsDialog({ isOpen, onClose, userId, currentBalance }) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const adjust = useAdjustCoins();

  const numericAmount = Number(amount);
  const isValid = Number.isInteger(numericAmount) && numericAmount !== 0 && reason.trim().length >= 3;
  const wouldOverdraw = numericAmount < 0 && Math.abs(numericAmount) > currentBalance;

  async function handleSubmit() {
    await adjust.mutateAsync({ userId, amount: numericAmount, reason: reason.trim() });
    setAmount('');
    setReason('');
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust coin balance"
      description="Recorded in the ledger and the audit log against your account."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={adjust.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={adjust.isPending} disabled={!isValid || wouldOverdraw}>
            {numericAmount < 0 ? 'Deduct coins' : 'Add coins'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field
          label="Amount"
          hint="Positive adds coins, negative deducts them."
          error={wouldOverdraw ? `They only have ${currentBalance} coins.` : null}
        >
          <NumberInput
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="e.g. 100 or -50"
            suffix="coins"
            autoFocus
          />
        </Field>

        <Field label="Reason" hint="At least 3 characters. Kept permanently.">
          <Input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="e.g. Goodwill after an outage"
            maxLength={200}
          />
        </Field>

        {isValid && !wouldOverdraw && (
          <p className="rounded-xl bg-ink-50 px-3.5 py-2.5 text-sm text-ink-600">
            Balance will go from <span className="font-medium text-ink-900">{formatNumber(currentBalance)}</span> to{' '}
            <span className="font-medium text-ink-900">{formatNumber(currentBalance + numericAmount)}</span> coins.
          </p>
        )}
      </div>
    </Modal>
  );
}

export function UserDetailPage() {
  const { userId } = useParams();
  const { data, isLoading, error, refetch } = useUserDetail(userId);

  const [dialog, setDialog] = useState(null);

  const reactivate = useReactivateUser();
  const forceLogout = useForceLogout();
  const resetFreeTalk = useResetFreeTalk();

  if (isLoading) return <LoadingState label="Loading account…" />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const { user, wallet, transactions, orders, activeSessions } = data;
  const isSuspended = user.status === 'suspended';

  return (
    <>
      <Link
        to="/users"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-ink-500 transition hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All users
      </Link>

      <Card className="mb-6 p-5">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar src={user.avatarUrl} name={user.name} gender={user.gender} size="lg" />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-ink-900">{user.nickname}</h1>
              <PresenceDot isOnline={user.isOnline} />
              <StatusBadge status={user.status} />
              <Badge tone={user.gender === 'female' ? 'brand' : 'info'}>
                {user.gender === 'female' ? 'Girl' : 'Boy'}
              </Badge>
              {user.role !== 'user' && <Badge tone="purple">{user.role.replace('_', ' ')}</Badge>}
            </div>

            <p className="mt-1 text-sm text-ink-600">
              {user.name} · {user.email}
            </p>

            {user.bio && <p className="mt-2 max-w-xl text-sm text-ink-500">{user.bio}</p>}

            {isSuspended && user.suspendedReason && (
              <p className="mt-3 rounded-xl bg-red-50 px-3.5 py-2 text-sm text-red-700">
                Suspended: {user.suspendedReason}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" icon={Coins} onClick={() => setDialog('coins')}>
              Adjust coins
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={Timer}
              isLoading={resetFreeTalk.isPending}
              onClick={() => resetFreeTalk.mutate(user.id)}
            >
              Reset free time
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={LogOut}
              isLoading={forceLogout.isPending}
              onClick={() => forceLogout.mutate(user.id)}
            >
              Sign out everywhere
            </Button>
            {isSuspended ? (
              <Button
                variant="success"
                size="sm"
                icon={ShieldCheck}
                isLoading={reactivate.isPending}
                onClick={() => reactivate.mutate(user.id)}
              >
                Reactivate
              </Button>
            ) : (
              <Button variant="danger" size="sm" icon={Ban} onClick={() => setDialog('suspend')}>
                Suspend
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader title="Wallet" />
          <CardBody className="divide-y divide-ink-100 py-0">
            <InfoRow label="Coin balance">
              <span className="inline-flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-amber-500" aria-hidden="true" />
                {formatNumber(wallet.coinBalance)}
              </span>
            </InfoRow>
            <InfoRow label="Prepaid messages">{formatNumber(wallet.messageCredits)}</InfoRow>
            <InfoRow label="Free chat left">
              {wallet.isUnlimited ? (
                <Badge tone="success">Unlimited</Badge>
              ) : (
                `${Math.floor(wallet.freeTalkSecondsRemaining / 60)} min`
              )}
            </InfoRow>
            <InfoRow label="Messages they can send">
              {wallet.estimatedMessagesRemaining === null ? (
                <Badge tone="success">Unlimited</Badge>
              ) : (
                formatNumber(wallet.estimatedMessagesRemaining)
              )}
            </InfoRow>
            <InfoRow label="Purchased / spent">
              {formatNumber(wallet.totals.purchased)} / {formatNumber(wallet.totals.spent)}
            </InfoRow>
            <InfoRow label="Daily bonus">
              {!wallet.dailyBonus.eligible ? (
                <span className="text-ink-500">Not applicable</span>
              ) : wallet.dailyBonus.isAvailable ? (
                <Badge tone="success">Ready to claim</Badge>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-ink-600">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatRelative(wallet.dailyBonus.nextAvailableAt)}
                </span>
              )}
            </InfoRow>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Account" />
          <CardBody className="divide-y divide-ink-100 py-0">
            <InfoRow label="Joined">{formatDateTime(user.createdAt)}</InfoRow>
            <InfoRow label="Last login">{formatRelative(user.lastLoginAt)}</InfoRow>
            <InfoRow label="Last seen">{user.isOnline ? 'Online now' : formatRelative(user.lastSeenAt)}</InfoRow>
            <InfoRow label="Email verified">
              {user.isEmailVerified ? <Badge tone="success">Yes</Badge> : <Badge tone="warning">No</Badge>}
            </InfoRow>
            <InfoRow label="Game points">{formatNumber(user.gamePoints)}</InfoRow>
            <InfoRow label="Blocked users">{formatNumber(user.blockedCount)}</InfoRow>
            <InfoRow label="Location">
              {user.city ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
                  {user.city}
                  {user.country ? `, ${user.country}` : ''}
                </span>
              ) : (
                <span className="text-ink-500">Not shared</span>
              )}
            </InfoRow>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Signed-in devices"
            description={`${activeSessions.length} active session${activeSessions.length === 1 ? '' : 's'}`}
          />
          <CardBody>
            {activeSessions.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-500">Not signed in anywhere.</p>
            ) : (
              <ul className="space-y-3">
                {activeSessions.slice(0, 5).map((session) => (
                  <li key={session.sessionId} className="text-sm">
                    <p className="truncate text-ink-700">{session.userAgent || 'Unknown device'}</p>
                    <p className="text-xs text-ink-500">
                      {session.ipAddress || 'unknown IP'} · {formatRelative(session.lastUsedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader title="Coin ledger" description="Most recent 20 entries." />
          {transactions.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-ink-500">No coin activity yet.</p>
          ) : (
            <Table>
              <THead
                columns={[
                  { key: 'type', label: 'Type' },
                  { key: 'amount', label: 'Amount', align: 'right' },
                  { key: 'balance', label: 'Balance', align: 'right' },
                  { key: 'when', label: 'When', align: 'right' },
                ]}
              />
              <tbody>
                {transactions.map((entry) => (
                  <TRow key={entry._id}>
                    <TCell>
                      <span className="capitalize text-ink-700">{entry.type.replace(/_/g, ' ')}</span>
                      {entry.description && (
                        <span className="block truncate text-xs text-ink-500">{entry.description}</span>
                      )}
                    </TCell>
                    <TCell align="right">
                      <span
                        className={`font-medium ${
                          entry.direction === 'credit' ? 'text-emerald-600' : 'text-ink-700'
                        }`}
                      >
                        {entry.direction === 'credit' ? '+' : '−'}
                        {formatNumber(entry.amount)}
                      </span>
                    </TCell>
                    <TCell align="right" className="text-ink-600">
                      {formatNumber(entry.balanceAfter)}
                    </TCell>
                    <TCell align="right" className="text-xs text-ink-500">
                      {formatRelative(entry.createdAt)}
                    </TCell>
                  </TRow>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader title="Purchases" description="Most recent 10 orders." />
          {orders.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-ink-500">No purchases yet.</p>
          ) : (
            <Table>
              <THead
                columns={[
                  { key: 'pack', label: 'Pack' },
                  { key: 'amount', label: 'Amount', align: 'right' },
                  { key: 'status', label: 'Status' },
                  { key: 'when', label: 'When', align: 'right' },
                ]}
              />
              <tbody>
                {orders.map((order) => (
                  <TRow key={order.id}>
                    <TCell>
                      <span className="text-ink-700">{order.packageName}</span>
                      <span className="block text-xs text-ink-500">
                        {formatNumber(order.coins + order.bonusCoins)} coins ·{' '}
                        {order.provider === 'manual_upi' ? 'UPI transfer' : 'Razorpay'}
                      </span>
                    </TCell>
                    <TCell align="right" className="font-medium text-ink-900">
                      {formatPaise(order.amountInPaise)}
                    </TCell>
                    <TCell>
                      <StatusBadge status={order.status} />
                    </TCell>
                    <TCell align="right" className="text-xs text-ink-500">
                      {formatRelative(order.createdAt)}
                    </TCell>
                  </TRow>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>

      <SuspendDialog
        isOpen={dialog === 'suspend'}
        onClose={() => setDialog(null)}
        userId={user.id}
        nickname={user.nickname}
      />
      <AdjustCoinsDialog
        isOpen={dialog === 'coins'}
        onClose={() => setDialog(null)}
        userId={user.id}
        currentBalance={wallet.coinBalance}
      />
    </>
  );
}
