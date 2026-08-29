import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  CircleDollarSign,
  Coins,
  Gamepad2,
  MessageSquare,
  Radio,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';

import { Badge } from '../components/ui/Badge.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import { ErrorState, LoadingState } from '../components/ui/Feedback.jsx';
import { PageHeader } from '../components/layout/AppLayout.jsx';
import { formatNumber, formatRupees } from '../lib/format.js';
import { useDashboard } from '../hooks/queries.js';

/** Categorical colours, chosen to stay distinguishable when printed or in greyscale. */
const GENDER_COLORS = { male: '#3b82f6', female: '#ff4e88' };
const CHART_GRID = '#eceaf5';
const CHART_AXIS = '#8d83b6';

function StatTile({ icon: Icon, label, value, sublabel, tone = 'brand', to }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    blue: 'bg-sky-50 text-sky-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
  };

  const content = (
    <Card className="h-full p-5 transition hover:border-ink-300">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-ink-500">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-ink-900">{value}</p>
          {sublabel && <p className="mt-1 truncate text-xs text-ink-500">{sublabel}</p>}
        </div>
        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
    </Card>
  );

  return to ? (
    <Link to={to} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}

function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-ink-200 bg-white px-3 py-2 shadow-lg">
      {label && <p className="mb-1 text-xs font-medium text-ink-900">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.name} className="text-xs text-ink-600">
          <span
            className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
            style={{ background: entry.color ?? entry.payload?.fill }}
          />
          {entry.name}: <span className="font-medium text-ink-900">{formatter ? formatter(entry.value) : entry.value}</span>
        </p>
      ))}
    </div>
  );
}

export function DashboardPage() {
  const { data, isLoading, error, refetch } = useDashboard();

  if (isLoading) return <LoadingState label="Loading dashboard…" />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const { users, chat, coins, revenue, rooms, games } = data;

  const genderData = [
    { name: 'Boys', value: users.male, fill: GENDER_COLORS.male },
    { name: 'Girls', value: users.female, fill: GENDER_COLORS.female },
  ].filter((slice) => slice.value > 0);

  const coinFlow = [
    { name: 'Purchased', value: coins.totalPurchasedCoins },
    { name: 'Bonus', value: coins.totalBonusCoins },
    { name: 'Spent', value: coins.totalSpentCoins },
    { name: 'In wallets', value: coins.totalCoinsInCirculation },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="How the app is doing right now. Figures refresh automatically."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={Users}
          label="Total users"
          value={formatNumber(users.total)}
          sublabel={`${formatNumber(users.newLast24h)} joined in the last 24h`}
          to="/users"
        />
        <StatTile
          icon={UserCheck}
          label="Online now"
          value={formatNumber(users.online)}
          sublabel={`${formatNumber(users.male)} boys · ${formatNumber(users.female)} girls active`}
          tone="green"
          to="/users?onlineOnly=true"
        />
        <StatTile
          icon={MessageSquare}
          label="Messages (24h)"
          value={formatNumber(chat.messagesLast24h)}
          sublabel={`${formatNumber(chat.conversations)} conversations in total`}
          tone="blue"
        />
        <StatTile
          icon={TrendingUp}
          label="Revenue (30 days)"
          value={formatRupees(revenue.last30DaysInRupees)}
          sublabel={`${formatRupees(revenue.allTimeInRupees)} all time`}
          tone="violet"
          to="/payments"
        />
      </div>

      {revenue.awaitingVerification > 0 && (
        <Link to="/payments?status=awaiting_verification" className="mt-4 block">
          <Card className="flex items-center gap-3 border-amber-300 bg-amber-50 p-4 transition hover:border-amber-400">
            <CircleDollarSign className="h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
            <p className="min-w-0 flex-1 text-sm text-amber-900">
              <span className="font-semibold">{revenue.awaitingVerification}</span> UPI transfer
              {revenue.awaitingVerification === 1 ? '' : 's'} waiting for your confirmation.
            </p>
            <ArrowRight className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
          </Card>
        </Link>
      )}

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Coin economy"
            description="Where coins came from and where they went, all time."
          />
          <CardBody>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coinFlow} margin={{ top: 4, right: 4, bottom: 4, left: -12 }}>
                  <CartesianGrid stroke={CHART_GRID} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: CHART_AXIS }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: CHART_AXIS }}
                    axisLine={false}
                    tickLine={false}
                    width={64}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(109,97,155,0.06)' }}
                    content={<ChartTooltip formatter={formatNumber} />}
                  />
                  <Bar dataKey="value" name="Coins" fill="#ff4e88" radius={[8, 8, 0, 0]} maxBarSize={64} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Who is here" description="Active accounts by gender." />
          <CardBody>
            {genderData.length === 0 ? (
              <p className="py-12 text-center text-sm text-ink-500">No active users yet.</p>
            ) : (
              <>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genderData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={48}
                        outerRadius={72}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {genderData.map((slice) => (
                          <Cell key={slice.name} fill={slice.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip formatter={formatNumber} />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-3 space-y-2">
                  {genderData.map((slice) => (
                    <li key={slice.name} className="flex items-center gap-2 text-sm">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: slice.fill }} />
                      <span className="text-ink-600">{slice.name}</span>
                      <span className="ml-auto font-medium text-ink-900">{formatNumber(slice.value)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader title="Needs attention" />
          <CardBody className="space-y-3">
            {[
              { label: 'Awaiting email verification', value: users.pendingVerification, to: '/users?status=pending_verification' },
              { label: 'Suspended accounts', value: users.suspended, to: '/users?status=suspended' },
              { label: 'Payments to confirm', value: revenue.awaitingVerification, to: '/payments?status=awaiting_verification' },
            ].map((row) => (
              <Link
                key={row.label}
                to={row.to}
                className="flex items-center justify-between gap-3 rounded-xl px-2.5 py-2 transition hover:bg-ink-50"
              >
                <span className="text-sm text-ink-600">{row.label}</span>
                <Badge tone={row.value > 0 ? 'warning' : 'neutral'}>{formatNumber(row.value)}</Badge>
              </Link>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Live now" />
          <CardBody className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl bg-ink-50 px-3.5 py-3">
              <Radio className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
              <span className="text-sm text-ink-600">Voice rooms</span>
              <span className="ml-auto text-sm font-semibold text-ink-900">{formatNumber(rooms.live)}</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-ink-50 px-3.5 py-3">
              <Coins className="h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
              <span className="text-sm text-ink-600">Coins in wallets</span>
              <span className="ml-auto text-sm font-semibold text-ink-900">
                {formatNumber(coins.totalCoinsInCirculation)}
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-ink-50 px-3.5 py-3">
              <CircleDollarSign className="h-4 w-4 shrink-0 text-violet-500" aria-hidden="true" />
              <span className="text-sm text-ink-600">Coins sold</span>
              <span className="ml-auto text-sm font-semibold text-ink-900">
                {formatNumber(revenue.coinsSold)}
              </span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Games (30 days)" description="Most played first." />
          <CardBody>
            {games.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Gamepad2 className="mb-2 h-5 w-5 text-ink-300" aria-hidden="true" />
                <p className="text-sm text-ink-500">Nobody has played yet.</p>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {games.slice(0, 5).map((game) => (
                  <li key={game.gameKey} className="flex items-center gap-3">
                    <span className="min-w-0 flex-1 truncate text-sm capitalize text-ink-700">
                      {game.gameKey.replace(/-/g, ' ')}
                    </span>
                    <span className="text-xs text-ink-500">avg {formatNumber(game.averageScore)}</span>
                    <Badge tone="brand">{formatNumber(game.plays)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
