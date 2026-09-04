import { useState } from 'react';
import { Gift, Coins, Users, TrendingUp } from 'lucide-react';

import { Badge } from '../components/ui/Badge.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/Feedback.jsx';
import { PageHeader } from '../components/layout/AppLayout.jsx';
import { Pagination, TCell, THead, TRow, Table } from '../components/ui/Table.jsx';
import { formatDateTime, formatRelative } from '../lib/format.js';
import { useAdminReferrals, useAdminReferralStats } from '../hooks/queries.js';

const COLUMNS = [
  { key: 'referrer', label: 'Referrer (A)' },
  { key: 'referee', label: 'New User (B)' },
  { key: 'pair', label: 'Gender Pair', className: 'hidden md:table-cell' },
  { key: 'coins', label: 'Coins Awarded', align: 'right' },
  { key: 'date', label: 'Date', align: 'right', className: 'hidden sm:table-cell' },
];

function genderLabel(gender) {
  if (!gender) return '—';
  return gender === 'male' ? '👦 Boy' : '👧 Girl';
}

function genderPairLabel(referrerGender, refereeGender) {
  return `${genderLabel(referrerGender)} → ${genderLabel(refereeGender)}`;
}

function StatCard({ icon: Icon, label, value, sub, color = 'text-violet-600' }) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-ink-900">{value ?? '—'}</p>
            <p className="text-sm text-ink-500">{label}</p>
            {sub && <p className="text-xs text-ink-400 mt-0.5">{sub}</p>}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export function ReferralsPage() {
  const [page, setPage] = useState(1);
  const limit = 30;
  const params = { page, limit };

  const {
    data: referrals,
    isLoading: listLoading,
    error: listError,
    refetch,
  } = useAdminReferrals(params);

  const { data: stats } = useAdminReferralStats();

  if (listLoading) return <LoadingState label="Loading referrals…" />;
  if (listError) return <ErrorState error={listError} onRetry={refetch} />;

  const rows = referrals?.data ?? [];
  const meta = referrals?.meta ?? {};

  return (
    <>
      <PageHeader
        title="Refer & Earn"
        description="Track every referral event and the coins credited to the referrer."
      />

      {/* Stats cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={Users}
          label="Total Referrals"
          value={stats?.data?.totalReferrals?.toLocaleString() ?? '—'}
          sub="Completed referral events"
        />
        <StatCard
          icon={Coins}
          label="Total Coins Awarded"
          value={stats?.data?.totalCoinsAwarded?.toLocaleString() ?? '—'}
          sub="Sum across all referrers"
          color="text-amber-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Coins / Referral"
          value={
            stats?.data?.totalReferrals && stats?.data?.totalCoinsAwarded
              ? (stats.data.totalCoinsAwarded / stats.data.totalReferrals).toFixed(1)
              : '—'
          }
          sub="Average reward per event"
          color="text-emerald-600"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-ink-400" aria-hidden="true" />
              All Referral Events
            </span>
          }
          description={`${meta.total ?? 0} total referral${meta.total !== 1 ? 's' : ''}`}
        />

        {rows.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={Gift}
              title="No referrals yet"
              description="Once users start referring friends, every event will appear here."
            />
          </CardBody>
        ) : (
          <>
            <Table columns={COLUMNS}>
              {rows.map((row) => (
                <TRow key={row._id}>
                  <TCell>
                    <div>
                      <p className="font-medium text-ink-900">{row.referrerId?.name ?? '—'}</p>
                      <p className="text-xs text-ink-400">@{row.referrerId?.nickname ?? '—'}</p>
                    </div>
                  </TCell>
                  <TCell>
                    <div>
                      <p className="font-medium text-ink-900">{row.refereeId?.name ?? '—'}</p>
                      <p className="text-xs text-ink-400">@{row.refereeId?.nickname ?? '—'}</p>
                    </div>
                  </TCell>
                  <TCell className="hidden md:table-cell">
                    <span className="text-sm text-ink-600">
                      {genderPairLabel(row.referrerGender, row.refereeGender)}
                    </span>
                  </TCell>
                  <TCell align="right">
                    <Badge tone={row.rewardCoins > 0 ? 'success' : 'neutral'}>
                      {row.rewardCoins} coins
                    </Badge>
                  </TCell>
                  <TCell align="right" className="hidden sm:table-cell">
                    <span className="text-sm text-ink-500" title={formatDateTime(row.createdAt)}>
                      {formatRelative(row.createdAt)}
                    </span>
                  </TCell>
                </TRow>
              ))}
            </Table>

            {meta.totalPages > 1 && (
              <div className="p-4 border-t border-ink-100">
                <Pagination
                  page={page}
                  totalPages={meta.totalPages}
                  onNext={() => setPage((p) => p + 1)}
                  onPrev={() => setPage((p) => p - 1)}
                />
              </div>
            )}
          </>
        )}
      </Card>
    </>
  );
}
