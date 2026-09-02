import { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Copy,
  CreditCard,
  FileText,
  Filter,
  Info,
  Layers,
  Megaphone,
  MessageSquare,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { ConfirmDialog } from '../components/ui/Modal.jsx';
import { EmptyState, ErrorState, SkeletonRows } from '../components/ui/Feedback.jsx';
import { PageHeader } from '../components/layout/AppLayout.jsx';
import { Pagination, TCell, THead, TRow, Table } from '../components/ui/Table.jsx';
import { formatNumber, formatRelative } from '../lib/format.js';
import { useClearSystemLogs, useSystemLogs, useSystemLogStats } from '../hooks/queries.js';

const COLUMNS = [
  { key: 'timestamp', label: 'Timestamp' },
  { key: 'level', label: 'Level' },
  { key: 'category', label: 'Category' },
  { key: 'action', label: 'Action / Path' },
  { key: 'message', label: 'Message' },
  { key: 'actions', label: '', align: 'right' },
];

const CATEGORIES = [
  { key: 'all', label: 'All Logs', icon: Layers },
  { key: 'error', label: '🚨 Errors & Exceptions', icon: AlertCircle, isErrorFilter: true },
  { key: 'payments', label: 'Payments & Recharge', icon: CreditCard },
  { key: 'withdrawals', label: 'Girls Withdrawals', icon: CreditCard },
  { key: 'campaigns', label: 'Campaigns & Push', icon: Megaphone },
  { key: 'auth', label: 'Auth & Accounts', icon: Shield },
  { key: 'chat', label: 'Chat & Sockets', icon: MessageSquare },
  { key: 'system', label: 'System & Server', icon: FileText },
];

function LevelBadge({ level }) {
  if (level === 'error') {
    return (
      <Badge tone="danger" className="gap-1">
        <AlertCircle className="h-3 w-3" />
        ERROR
      </Badge>
    );
  }
  if (level === 'warn') {
    return (
      <Badge tone="warning" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        WARN
      </Badge>
    );
  }
  return (
    <Badge tone="info" className="gap-1">
      <Info className="h-3 w-3" />
      INFO
    </Badge>
  );
}

function CategoryBadge({ category }) {
  const map = {
    payments: { label: 'Payments', tone: 'success' },
    withdrawals: { label: 'Withdrawal', tone: 'brand' },
    campaigns: { label: 'Campaign', tone: 'info' },
    auth: { label: 'Auth', tone: 'purple' },
    chat: { label: 'Chat', tone: 'neutral' },
    system: { label: 'System', tone: 'neutral' },
  };

  const item = map[category] || { label: category || 'General', tone: 'neutral' };
  return <Badge tone={item.tone}>{item.label}</Badge>;
}

export function SystemLogsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const queryParams = {
    page,
    limit: 25,
    category: activeTab === 'error' ? 'all' : activeTab,
    level: activeTab === 'error' ? 'error' : levelFilter,
    search: search.trim() || undefined,
  };

  const { data, isLoading, isError, refetch, isFetching } = useSystemLogs(queryParams);
  const { data: stats } = useSystemLogStats();
  const clearLogs = useClearSystemLogs();

  const logs = data?.items ?? [];

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Logs & Error Center"
        subtitle="Real-time error tracking, payment events, push notification logs, and server exceptions."
      >
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            icon={RefreshCw}
            isLoading={isFetching}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            variant="danger"
            icon={Trash2}
            onClick={() => setIsClearModalOpen(true)}
          >
            Clear Logs
          </Button>
        </div>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-center gap-4 p-4 border-l-4 border-l-red-500">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-500">Errors (Last 24h)</p>
            <p className="text-2xl font-bold text-red-600">
              {formatNumber(stats?.totalErrors24h ?? 0)}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4 border-l-4 border-l-amber-500">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-500">Warnings (Last 24h)</p>
            <p className="text-2xl font-bold text-amber-600">
              {formatNumber(stats?.totalWarnings24h ?? 0)}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4 border-l-4 border-l-emerald-500">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-500">Payment & Payout Events</p>
            <p className="text-2xl font-bold text-ink-900">
              {formatNumber(
                (stats?.byCategory?.payments?.total ?? 0) +
                  (stats?.byCategory?.withdrawals?.total ?? 0),
              )}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4 border-l-4 border-l-brand-500">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Megaphone className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-500">Campaigns & Push Logs</p>
            <p className="text-2xl font-bold text-ink-900">
              {formatNumber(stats?.byCategory?.campaigns?.total ?? 0)}
            </p>
          </div>
        </Card>
      </div>

      {/* Main Card with Category Tabs & Filters */}
      <Card>
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 border-b border-ink-100 p-4">
          {CATEGORIES.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setPage(1);
                }}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  isSelected
                    ? tab.isErrorFilter
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-ink-900 text-white shadow-sm'
                    : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Level Filter Bar */}
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search error messages, path, action, user email, stack trace..."
              className="w-full rounded-xl border border-ink-200 bg-white py-2 pl-9 pr-4 text-xs placeholder:text-ink-400 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-ink-500">Level:</span>
            <select
              value={levelFilter}
              onChange={(e) => {
                setLevelFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-xs text-ink-700 focus:border-brand-500 focus:outline-none"
            >
              <option value="all">All Levels</option>
              <option value="error">Error Only</option>
              <option value="warn">Warnings</option>
              <option value="info">Info</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        {isLoading ? (
          <Table>
            <THead columns={COLUMNS} />
            <tbody>
              <SkeletonRows columns={COLUMNS.length} rows={6} />
            </tbody>
          </Table>
        ) : isError ? (
          <ErrorState message="Could not load system logs." onRetry={() => refetch()} />
        ) : logs.length === 0 ? (
          <EmptyState
            title="No system logs found"
            description="There are no logs matching your selected filters."
          />
        ) : (
          <>
            <Table>
              <THead columns={COLUMNS} />
              <tbody>
                {logs.map((log) => (
                  <TRow
                    key={log.id}
                    className={`cursor-pointer hover:bg-ink-50/60 ${
                      log.level === 'error' ? 'bg-red-50/20' : ''
                    }`}
                    onClick={() => setSelectedLog(log)}
                  >
                    <TCell className="whitespace-nowrap text-xs text-ink-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-ink-400" />
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                      <span className="text-[10px] text-ink-400">
                        {formatRelative(log.createdAt)}
                      </span>
                    </TCell>

                    <TCell>
                      <LevelBadge level={log.level} />
                    </TCell>

                    <TCell>
                      <CategoryBadge category={log.category} />
                    </TCell>

                    <TCell>
                      <span className="font-mono text-xs font-semibold text-ink-800">
                        {log.action}
                      </span>
                      {log.path && (
                        <span className="block font-mono text-[10px] text-ink-500">
                          {log.method} {log.path}
                        </span>
                      )}
                    </TCell>

                    <TCell className="max-w-md">
                      <p
                        className={`text-xs ${
                          log.level === 'error'
                            ? 'font-medium text-red-700'
                            : 'text-ink-800'
                        }`}
                        numberOfLines={2}
                      >
                        {log.message}
                      </p>
                      {log.userEmail && (
                        <span className="text-[10px] text-ink-400">User: {log.userEmail}</span>
                      )}
                    </TCell>

                    <TCell align="right">
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                      >
                        Inspect
                      </Button>
                    </TCell>
                  </TRow>
                ))}
              </tbody>
            </Table>

            <Pagination meta={data?.meta} page={page} onPageChange={setPage} />
          </>
        )}
      </Card>

      {/* Log Detail Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-ink-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <LevelBadge level={selectedLog.level} />
                  <CategoryBadge category={selectedLog.category} />
                  <span className="font-mono text-sm font-bold text-ink-900">
                    {selectedLog.action}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-500">
                  {new Date(selectedLog.createdAt).toUTCString()} ({formatRelative(selectedLog.createdAt)})
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error message */}
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-ink-500">Message</label>
                <div className="mt-1 rounded-xl bg-ink-50 p-3 text-xs font-medium text-ink-900">
                  {selectedLog.message}
                </div>
              </div>

              {/* Request Metadata */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {selectedLog.path && (
                  <div className="rounded-xl border border-ink-100 p-2.5">
                    <span className="text-[10px] text-ink-400">Endpoint</span>
                    <p className="font-mono text-xs font-bold text-ink-800">
                      {selectedLog.method} {selectedLog.path}
                    </p>
                  </div>
                )}
                {selectedLog.statusCode && (
                  <div className="rounded-xl border border-ink-100 p-2.5">
                    <span className="text-[10px] text-ink-400">HTTP Status</span>
                    <p className="font-mono text-xs font-bold text-ink-800">
                      {selectedLog.statusCode}
                    </p>
                  </div>
                )}
                {selectedLog.ip && (
                  <div className="rounded-xl border border-ink-100 p-2.5">
                    <span className="text-[10px] text-ink-400">Client IP</span>
                    <p className="font-mono text-xs font-bold text-ink-800">{selectedLog.ip}</p>
                  </div>
                )}
                {selectedLog.userEmail && (
                  <div className="rounded-xl border border-ink-100 p-2.5">
                    <span className="text-[10px] text-ink-400">Account</span>
                    <p className="text-xs font-bold text-ink-800">{selectedLog.userEmail}</p>
                  </div>
                )}
              </div>

              {/* Stack Trace */}
              {selectedLog.stack && (
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-red-600">Error Stack Trace</label>
                    <button
                      onClick={() => handleCopy(selectedLog.stack)}
                      className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                    >
                      <Copy className="h-3 w-3" />
                      Copy Stack
                    </button>
                  </div>
                  <pre className="mt-1 max-h-60 overflow-x-auto rounded-xl bg-ink-900 p-3 font-mono text-[11px] leading-relaxed text-red-300">
                    {selectedLog.stack}
                  </pre>
                </div>
              )}

              {/* Details / Payload JSON */}
              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-ink-500">Payload / Details</label>
                    <button
                      onClick={() => handleCopy(JSON.stringify(selectedLog.details, null, 2))}
                      className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                    >
                      <Copy className="h-3 w-3" />
                      Copy JSON
                    </button>
                  </div>
                  <pre className="mt-1 max-h-48 overflow-x-auto rounded-xl bg-ink-50 p-3 font-mono text-[11px] text-ink-800 border border-ink-200">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setSelectedLog(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Logs Confirm Dialog */}
      <ConfirmDialog
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={async () => {
          await clearLogs.mutateAsync({ category: activeTab === 'all' ? undefined : activeTab });
          setIsClearModalOpen(false);
          refetch();
        }}
        title="Clear System Logs?"
        message={`Are you sure you want to delete ${
          activeTab === 'all' ? 'all system logs' : `logs in ${activeTab}`
        }? This cannot be undone.`}
        confirmLabel="Clear Logs"
        isLoading={clearLogs.isPending}
      />
    </div>
  );
}
