import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Banknote,
  Building,
  CheckCircle2,
  Coins,
  Copy,
  CreditCard,
  Eye,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Avatar } from '../components/ui/Avatar.jsx';
import { Badge, StatusBadge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { ConfirmDialog, Modal } from '../components/ui/Modal.jsx';
import { EmptyState, ErrorState, SkeletonRows } from '../components/ui/Feedback.jsx';
import { Field, Input, Select, Textarea } from '../components/ui/Field.jsx';
import { PageHeader } from '../components/layout/AppLayout.jsx';
import { Pagination, TCell, THead, TRow, Table } from '../components/ui/Table.jsx';
import { formatNumber, formatRelative } from '../lib/format.js';
import { useApproveWithdrawal, useRejectWithdrawal, useWithdrawals } from '../hooks/queries.js';

const STATUS_TABS = [
  { key: 'all', label: 'All Requests' },
  { key: 'pending', label: 'Pending Approval' },
  { key: 'success', label: 'Paid & Completed' },
  { key: 'rejected', label: 'Rejected / Refunded' },
];

function ApproveModal({ isOpen, onClose, item }) {
  const [mode, setMode] = useState('cashfree');
  const [utr, setUtr] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const approve = useApproveWithdrawal();

  if (!item) return null;

  async function handleApprove() {
    await approve.mutateAsync({
      withdrawalId: item._id,
      mode,
      utr: utr.trim() || undefined,
      adminNotes: adminNotes.trim() || undefined,
    });
    onClose();
  }

  const isUpi = item.payoutMethod === 'upi';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Approve & Process Payout"
      size="md"
    >
      <div className="space-y-4">
        {/* Recipient summary card */}
        <div className="rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50/70 to-rose-50/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar src={item.userId?.avatarUrl} name={item.userId?.nickname || 'User'} size="md" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink-900">{item.userId?.nickname || 'Unknown'}</span>
                  <Badge tone="brand">👧 Girl</Badge>
                </div>
                <div className="text-xs text-ink-500">{item.userId?.email || 'No email'}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-emerald-600">₹{item.amountInRupees?.toFixed(2)}</div>
              <div className="text-xs font-medium text-ink-500">{formatNumber(item.coins)} Coins</div>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-pink-200/60 bg-white/80 p-2.5 text-xs text-ink-700">
            {isUpi ? (
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-ink-500">UPI ID: </span>
                  <span className="font-mono font-bold text-ink-900">{item.upiId}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(item.upiId || '');
                    toast.success('UPI ID copied');
                  }}
                  className="rounded-lg p-1 text-ink-500 hover:bg-pink-100 hover:text-ink-800"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <div>
                  <span className="font-medium text-ink-500">A/C Name: </span>
                  <span className="font-semibold text-ink-900">{item.bankDetails?.accountHolderName}</span>
                </div>
                <div>
                  <span className="font-medium text-ink-500">A/C Number: </span>
                  <span className="font-mono font-bold text-ink-900">{item.bankDetails?.accountNumber}</span>
                </div>
                <div>
                  <span className="font-medium text-ink-500">IFSC: </span>
                  <span className="font-mono font-bold text-ink-900">{item.bankDetails?.ifsc}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transfer mode selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-ink-600">
            Payout Execution Mode
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode('cashfree')}
              className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                mode === 'cashfree'
                  ? 'border-brand-500 bg-brand-50/50 shadow-sm ring-2 ring-brand-500/20'
                  : 'border-ink-200 bg-white hover:border-ink-300'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-ink-900">
                <Sparkles className="h-4 w-4 text-brand-500" />
                <span>Cashfree Payout</span>
              </div>
              <span className="mt-1 text-[11px] text-ink-500">
                Dispatches funds directly via Cashfree Payouts API
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                mode === 'manual'
                  ? 'border-emerald-500 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-500/20'
                  : 'border-ink-200 bg-white hover:border-ink-300'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-ink-900">
                <Banknote className="h-4 w-4 text-emerald-600" />
                <span>Manual Transfer</span>
              </div>
              <span className="mt-1 text-[11px] text-ink-500">
                If transferred directly via your bank/UPI app
              </span>
            </button>
          </div>
        </div>

        {mode === 'manual' && (
          <Field label="Bank UTR / Reference ID" description="Optional reference number for record keeping">
            <Input
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              placeholder="e.g. 423409823482"
            />
          </Field>
        )}

        <Field label="Admin Notes (Optional)">
          <Input
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="e.g. Verified genuine user"
          />
        </Field>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink-100">
          <Button variant="ghost" onClick={onClose} disabled={approve.isPending}>
            Cancel
          </Button>
          <Button
            tone="success"
            onClick={handleApprove}
            isLoading={approve.isPending}
            className="flex items-center gap-1.5"
          >
            <Send className="h-4 w-4" />
            {mode === 'cashfree' ? 'Pay & Transfer via Cashfree' : 'Confirm & Mark as Paid'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function RejectModal({ isOpen, onClose, item }) {
  const [reason, setReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const reject = useRejectWithdrawal();

  if (!item) return null;

  async function handleReject() {
    if (!reason.trim()) {
      toast.error('Please enter a rejection reason');
      return;
    }
    await reject.mutateAsync({
      withdrawalId: item._id,
      reason: reason.trim(),
      adminNotes: adminNotes.trim() || undefined,
    });
    setReason('');
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reject Withdrawal Request"
      size="sm"
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-red-200 bg-red-50/80 p-3 text-xs text-red-800">
          ⚠️ <strong>Automatic Coin Refund:</strong> Rejecting this request will immediately refund{' '}
          <strong>{formatNumber(item.coins)} coins</strong> back to{' '}
          <strong>{item.userId?.nickname || 'the girl'}</strong>'s wallet with a notification.
        </div>

        <Field
          label="Reason for Rejection *"
          description="The user will see this message in their app notifications."
        >
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Invalid UPI ID / Name mismatch / Suspicious spam activity"
            rows={3}
            autoFocus
          />
        </Field>

        <Field label="Internal Admin Notes (Optional)">
          <Input
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="e.g. Flagged for review"
          />
        </Field>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink-100">
          <Button variant="ghost" onClick={onClose} disabled={reject.isPending}>
            Cancel
          </Button>
          <Button
            tone="danger"
            onClick={handleReject}
            isLoading={reject.isPending}
          >
            Reject & Refund Coins
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function WithdrawalsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || 'all';
  const page = Number(searchParams.get('page')) || 1;

  const [selectedApprove, setSelectedApprove] = useState(null);
  const [selectedReject, setSelectedReject] = useState(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useWithdrawals({
    status: status === 'all' ? undefined : status,
    page,
    limit: 15,
  });

  const stats = data?.stats || {};
  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 15);

  function handleTabChange(newStatus) {
    const params = new URLSearchParams(searchParams);
    if (newStatus === 'all') params.delete('status');
    else params.set('status', newStatus);
    params.delete('page');
    setSearchParams(params);
  }

  function copyToClipboard(text, label = 'Copied') {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Girls Chat Earnings & Payouts"
        subtitle="Review, approve, and disburse coin earnings converted into real money (Cashfree Payouts)."
        action={
          <div className="flex items-center gap-2">
            <Link to="/settings#earnings">
              <Button variant="secondary" size="sm">
                ⚙️ Adjust Conversion Rates
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              isLoading={isFetching}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50/70 to-orange-50/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Pending Approvals
            </span>
            <span className="rounded-full bg-amber-100 p-2 text-amber-700">⏳</span>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-900">
            {formatNumber(stats.pending?.count || 0)}
          </div>
          <div className="text-xs font-semibold text-amber-700">
            ₹{(stats.pending?.totalRupees || 0).toFixed(2)} awaiting payout
          </div>
        </Card>

        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Total Paid Out
            </span>
            <span className="rounded-full bg-emerald-100 p-2 text-emerald-700">💸</span>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-900">
            ₹{(stats.totalPaidRupees || 0).toFixed(2)}
          </div>
          <div className="text-xs font-semibold text-emerald-700">
            {formatNumber((stats.success?.count || 0) + (stats.approved?.count || 0))} payouts completed
          </div>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50/70 to-fuchsia-50/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
              Coins Redeemed
            </span>
            <span className="rounded-full bg-purple-100 p-2 text-purple-700">🪙</span>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-900">
            {formatNumber(stats.totalCoinsRedeemed || 0)}
          </div>
          <div className="text-xs font-semibold text-purple-700">
            Chat earnings converted by girls
          </div>
        </Card>

        <Card className="border-rose-200 bg-gradient-to-br from-rose-50/70 to-red-50/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
              Rejected Requests
            </span>
            <span className="rounded-full bg-rose-100 p-2 text-rose-700">❌</span>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-900">
            {formatNumber(stats.rejected?.count || 0)}
          </div>
          <div className="text-xs font-semibold text-rose-700">
            Coins automatically refunded
          </div>
        </Card>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-ink-100 pb-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleTabChange(tab.key)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              status === tab.key
                ? 'bg-ink-900 text-white shadow-sm'
                : 'bg-white text-ink-600 hover:bg-ink-100 hover:text-ink-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Table */}
      <Card noPadding>
        {isLoading ? (
          <div className="p-6">
            <SkeletonRows rows={6} />
          </div>
        ) : isError ? (
          <div className="p-8">
            <ErrorState message={error?.message || 'Failed to load withdrawal requests'} onRetry={refetch} />
          </div>
        ) : items.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="No withdrawal requests found"
              message="When female users convert their chat earnings into rupees, requests will appear here for your approval."
            />
          </div>
        ) : (
          <Table>
            <THead>
              <TRow>
                <TCell isHeader>Girl / User</TCell>
                <TCell isHeader>Coins & Conversion</TCell>
                <TCell isHeader>Amount (INR)</TCell>
                <TCell isHeader>Payout Account</TCell>
                <TCell isHeader>Status</TCell>
                <TCell isHeader>Requested</TCell>
                <TCell isHeader className="text-right">Actions</TCell>
              </TRow>
            </THead>
            <tbody>
              {items.map((item) => {
                const isPending = item.status === 'pending';
                const isUpi = item.payoutMethod === 'upi';

                return (
                  <TRow key={item._id} className={isPending ? 'bg-amber-50/20' : ''}>
                    {/* User */}
                    <TCell>
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={item.userId?.avatarUrl}
                          name={item.userId?.nickname || 'User'}
                          size="sm"
                        />
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-ink-900">
                            {item.userId?.nickname || 'User'}
                            <span className="text-xs">👧</span>
                          </div>
                          <div className="text-xs text-ink-500">{item.userId?.email || item.userId?.phone || 'No contact'}</div>
                        </div>
                      </div>
                    </TCell>

                    {/* Coins */}
                    <TCell>
                      <div className="flex items-center gap-1.5 font-bold text-amber-700">
                        <Coins className="h-4 w-4 text-amber-500" />
                        <span>{formatNumber(item.coins)}</span>
                      </div>
                      <div className="text-[11px] text-ink-500">
                        Rate: {item.coinsPerRupeeRate || 25} coins = ₹1
                      </div>
                    </TCell>

                    {/* Amount */}
                    <TCell>
                      <div className="text-base font-black text-emerald-600">
                        ₹{item.amountInRupees?.toFixed(2)}
                      </div>
                    </TCell>

                    {/* Payout Details */}
                    <TCell>
                      {isUpi ? (
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold text-sky-700">
                            UPI
                          </span>
                          <span className="font-mono text-xs font-semibold text-ink-800">
                            {item.upiId}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(item.upiId, 'UPI ID')}
                            className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                            title="Copy UPI ID"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-0.5 text-xs">
                          <div className="flex items-center gap-1 font-semibold text-ink-900">
                            <Building className="h-3 w-3 text-ink-500" />
                            {item.bankDetails?.accountHolderName}
                          </div>
                          <div className="flex items-center gap-1 font-mono text-[11px] text-ink-600">
                            <span>A/C: {item.bankDetails?.accountNumber}</span>
                            <span>•</span>
                            <span>IFSC: {item.bankDetails?.ifsc}</span>
                          </div>
                        </div>
                      )}
                    </TCell>

                    {/* Status */}
                    <TCell>
                      <StatusBadge status={item.status} />
                      {item.rejectionReason && (
                        <div className="mt-1 max-w-xs text-[11px] text-red-600 truncate" title={item.rejectionReason}>
                          Reason: {item.rejectionReason}
                        </div>
                      )}
                      {item.cashfreeUtr && (
                        <div className="mt-0.5 text-[10px] font-mono text-ink-500">
                          UTR: {item.cashfreeUtr}
                        </div>
                      )}
                    </TCell>

                    {/* Requested date */}
                    <TCell>
                      <div className="text-xs text-ink-600">{formatRelative(item.createdAt)}</div>
                    </TCell>

                    {/* Actions */}
                    <TCell className="text-right">
                      {isPending ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            tone="success"
                            onClick={() => setSelectedApprove(item)}
                            className="flex items-center gap-1 font-bold text-xs"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            tone="danger"
                            variant="secondary"
                            onClick={() => setSelectedReject(item)}
                            className="flex items-center gap-1 font-bold text-xs"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-ink-400">
                          {item.status === 'success' ? '✅ Paid' : '—'}
                        </span>
                      )}
                    </TCell>
                  </TRow>
                );
              })}
            </tbody>
          </Table>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t border-ink-100">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => {
                const params = new URLSearchParams(searchParams);
                params.set('page', String(p));
                setSearchParams(params);
              }}
            />
          </div>
        )}
      </Card>

      {/* Modals */}
      <ApproveModal
        isOpen={Boolean(selectedApprove)}
        onClose={() => setSelectedApprove(null)}
        item={selectedApprove}
      />

      <RejectModal
        isOpen={Boolean(selectedReject)}
        onClose={() => setSelectedReject(null)}
        item={selectedReject}
      />
    </div>
  );
}
