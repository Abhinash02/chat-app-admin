import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, CreditCard, Receipt, RotateCcw, Trash2, X } from 'lucide-react';

import { Badge, StatusBadge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { ConfirmDialog } from '../components/ui/Modal.jsx';
import { EmptyState, ErrorState, SkeletonRows } from '../components/ui/Feedback.jsx';
import { Field, Input, Select } from '../components/ui/Field.jsx';
import { PageHeader } from '../components/layout/AppLayout.jsx';
import { Pagination, TCell, THead, TRow, Table } from '../components/ui/Table.jsx';
import { formatNumber, formatPaise, formatRelative } from '../lib/format.js';
import {
  useApproveOrder,
  useDeleteOrder,
  useOrders,
  useRefundOrder,
  useRejectOrder,
} from '../hooks/queries.js';

const COLUMNS = [
  { key: 'user', label: 'Buyer' },
  { key: 'pack', label: 'Pack' },
  { key: 'amount', label: 'Amount', align: 'right' },
  { key: 'method', label: 'Method', className: 'hidden lg:table-cell' },
  { key: 'status', label: 'Status' },
  { key: 'when', label: 'Placed', align: 'right', className: 'hidden md:table-cell' },
  { key: 'actions', label: '', align: 'right' },
];

function RejectDialog({ isOpen, onClose, order }) {
  const [reason, setReason] = useState('');
  const reject = useRejectOrder();

  async function handleConfirm() {
    await reject.mutateAsync({ orderId: order.id, reason: reason.trim() });
    setReason('');
    onClose();
  }

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Reject this payment?"
      message="No coins will be credited. The buyer sees the reason you give here, so be specific."
      confirmLabel="Reject payment"
      isLoading={reject.isPending}
    >
      <Field label="Reason">
        <Input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="e.g. No transfer found for this UTR"
          maxLength={200}
          autoFocus
        />
      </Field>
    </ConfirmDialog>
  );
}

function RefundDialog({ isOpen, onClose, order }) {
  const [reason, setReason] = useState('');
  const refund = useRefundOrder();

  async function handleConfirm() {
    await refund.mutateAsync({ orderId: order.id, reason: reason.trim() });
    setReason('');
    onClose();
  }

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="⚠️ Refund this payment?"
      message={
        order
          ? `You are issuing a refund of ${formatPaise(order.amountInPaise)} for ${
              order.user?.nickname ?? 'the buyer'
            }. This will deduct ${formatNumber(
              order.totalCoins,
            )} coins from the customer's wallet.`
          : ''
      }
      confirmLabel="Yes, Issue Refund"
      variant="danger"
      isLoading={refund.isPending}
    >
      <div className="mt-3 space-y-3">
        <div className="rounded-xl border border-red-200 bg-red-50/60 p-3 text-xs text-red-700">
          ⚠️ <strong>Instant Action:</strong> For Cashfree, funds are returned to the original bank/card. For Manual UPI, record your notes after reversing the transfer.
        </div>
        <Field label="Reason for Refund">
          <Input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="e.g. Duplicate payment / Accidental purchase"
            maxLength={200}
            autoFocus
          />
        </Field>
      </div>
    </ConfirmDialog>
  );
}

export function PaymentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState(null);

  const status = searchParams.get('status') ?? '';

  const { data, isLoading, error, refetch } = useOrders({
    page,
    limit: 10,
    ...(status ? { status } : {}),
  });

  const approve = useApproveOrder();
  const deleteOrder = useDeleteOrder();
  const orders = data?.items ?? [];

  function updateStatus(value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('status', value);
    else next.delete('status');
    setSearchParams(next, { replace: true });
    setPage(1);
  }

  return (
    <>
      <PageHeader
        title="Payments"
        description="Cashfree orders settle automatically. Review pending UPI transfers and manage transaction records."
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-ink-200/70 p-4">
          <Select
            value={status}
            onChange={(event) => updateStatus(event.target.value)}
            aria-label="Filter by status"
            className="w-auto"
          >
            <option value="">All orders</option>
            <option value="awaiting_verification">Waiting for confirmation</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
            <option value="created">Started, not paid</option>
            <option value="rejected">Rejected</option>
            <option value="failed">Failed</option>
            <option value="expired">Expired</option>
          </Select>

          {status !== 'awaiting_verification' && (
            <Button variant="outline" size="sm" onClick={() => updateStatus('awaiting_verification')}>
              Show what needs me
            </Button>
          )}
        </div>

        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : (
          <>
            <Table>
              <THead columns={COLUMNS} />
              <tbody>
                {isLoading ? (
                  <SkeletonRows rows={10} columns={COLUMNS.length} />
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length}>
                      <EmptyState
                        icon={Receipt}
                        title={status === 'awaiting_verification' ? 'Nothing to confirm' : 'No orders yet'}
                        description={
                          status === 'awaiting_verification'
                            ? 'Every UPI transfer has been dealt with.'
                            : 'Orders appear here as soon as someone starts a purchase.'
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const needsReview = order.status === 'awaiting_verification';
                    const isPaid = order.status === 'paid';

                    return (
                      <TRow key={order.id} className={needsReview ? 'bg-amber-50/40' : ''}>
                        <TCell>
                          {order.user?.nickname ? (
                            <Link
                              to={`/users/${order.user.id}`}
                              className="font-medium text-ink-900 hover:text-brand-600"
                            >
                              {order.user.nickname}
                            </Link>
                          ) : (
                            <span className="text-ink-500">Unknown</span>
                          )}
                          {order.user?.email && (
                            <span className="block truncate text-xs text-ink-500">{order.user.email}</span>
                          )}
                        </TCell>

                        <TCell>
                          <span className="text-ink-700">{order.packageName}</span>
                          <span className="block text-xs text-ink-500">
                            {formatNumber(order.totalCoins)} coins
                          </span>
                        </TCell>

                        <TCell align="right" className="font-medium text-ink-900">
                          {formatPaise(order.amountInPaise)}
                        </TCell>

                        <TCell className="hidden lg:table-cell">
                          <Badge tone={order.provider === 'cashfree' ? 'info' : order.provider === 'manual_upi' ? 'warning' : 'neutral'}>
                            {order.provider === 'cashfree'
                              ? '⚡ Cashfree'
                              : order.provider === 'manual_upi'
                                ? 'UPI transfer'
                                : order.provider}
                          </Badge>
                        </TCell>

                        <TCell>
                          <StatusBadge status={order.status} />
                          {order.rejectionReason && (
                            <span className="block max-w-[14rem] truncate text-xs text-red-600">
                              {order.rejectionReason}
                            </span>
                          )}
                          {order.refundReason && (
                            <span className="block max-w-[14rem] truncate text-xs font-medium text-purple-600">
                              {order.refundReason}
                            </span>
                          )}
                        </TCell>

                        <TCell align="right" className="hidden text-xs text-ink-500 md:table-cell">
                          {formatRelative(order.createdAt)}
                        </TCell>

                        <TCell align="right">
                          <div className="flex justify-end gap-1.5">
                            {needsReview && (
                              <>
                                <Button
                                  size="sm"
                                  variant="success"
                                  icon={Check}
                                  isLoading={approve.isPending && approve.variables === order.id}
                                  onClick={() => setDialog({ type: 'approve', order })}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:bg-red-50"
                                  aria-label="Reject payment"
                                  onClick={() => setDialog({ type: 'reject', order })}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}

                            {isPaid && (
                              <Button
                                size="sm"
                                variant="outline"
                                icon={RotateCcw}
                                className="text-red-600 hover:border-red-300 hover:bg-red-50"
                                onClick={() => setDialog({ type: 'refund', order })}
                              >
                                Refund
                              </Button>
                            )}

                            {/* Delete button — always visible for admin cleanup */}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:bg-red-50 hover:text-red-600"
                              aria-label="Delete transaction"
                              title="Delete transaction record"
                              onClick={() => setDialog({ type: 'delete', order })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TCell>
                      </TRow>
                    );
                  })
                )}
              </tbody>
            </Table>

            <Pagination meta={data?.meta} page={page} onPageChange={setPage} />
          </>
        )}
      </Card>

      {/* Approve dialog */}
      <ConfirmDialog
        isOpen={dialog?.type === 'approve'}
        onClose={() => setDialog(null)}
        onConfirm={async () => {
          await approve.mutateAsync(dialog.order.id);
          setDialog(null);
        }}
        title="Confirm this transfer arrived?"
        message={
          dialog?.order
            ? `${formatNumber(dialog.order.totalCoins)} coins will be credited to ${
                dialog.order.user?.nickname ?? 'the buyer'
              } immediately. Check the UTR against your bank statement first — this cannot be undone.`
            : ''
        }
        confirmLabel="Approve and credit coins"
        variant="success"
        isLoading={approve.isPending}
      >
        {dialog?.order?.manualProof?.utr && (
          <div className="rounded-xl bg-ink-50 px-3.5 py-2.5">
            <p className="text-xs text-ink-500">UTR reference</p>
            <p className="font-mono text-sm text-ink-900">{dialog.order.manualProof.utr}</p>
            {dialog.order.manualProof.note && (
              <p className="mt-1 text-xs text-ink-600">{dialog.order.manualProof.note}</p>
            )}
          </div>
        )}
      </ConfirmDialog>

      {/* Reject dialog */}
      {dialog?.type === 'reject' && (
        <RejectDialog isOpen onClose={() => setDialog(null)} order={dialog.order} />
      )}

      {/* Refund dialog */}
      {dialog?.type === 'refund' && (
        <RefundDialog isOpen onClose={() => setDialog(null)} order={dialog.order} />
      )}

      {/* Delete dialog */}
      <ConfirmDialog
        isOpen={dialog?.type === 'delete'}
        onClose={() => setDialog(null)}
        onConfirm={async () => {
          await deleteOrder.mutateAsync(dialog.order.id);
          setDialog(null);
        }}
        title="🗑️ Delete this transaction?"
        message={
          dialog?.order
            ? `Permanently delete the ${dialog.order.packageName} order for ${
                dialog.order.user?.nickname ?? 'this user'
              } (${formatPaise(dialog.order.amountInPaise)})? This removes it from all records and cannot be undone.`
            : ''
        }
        confirmLabel="Yes, delete permanently"
        variant="danger"
        isLoading={deleteOrder.isPending}
      />

      {!isLoading && orders.length === 0 && status === '' && (
        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-ink-500">
          <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
          Configure your Cashfree keys in Settings to start taking payments.
        </p>
      )}
    </>
  );
}
