import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Coins, Search, Users as UsersIcon } from 'lucide-react';

import { Avatar } from '../components/ui/Avatar.jsx';
import { Badge, PresenceDot, StatusBadge } from '../components/ui/Badge.jsx';
import { Card } from '../components/ui/Card.jsx';
import { EmptyState, ErrorState, SkeletonRows } from '../components/ui/Feedback.jsx';
import { Input, Select } from '../components/ui/Field.jsx';
import { PageHeader } from '../components/layout/AppLayout.jsx';
import { Pagination, TCell, THead, TRow, Table } from '../components/ui/Table.jsx';
import { formatNumber, formatRelative } from '../lib/format.js';
import { useUsers } from '../hooks/queries.js';

const COLUMNS = [
  { key: 'user', label: 'User' },
  { key: 'gender', label: 'Gender', className: 'hidden sm:table-cell' },
  { key: 'status', label: 'Status' },
  { key: 'coins', label: 'Coins', align: 'right' },
  { key: 'points', label: 'Points', align: 'right', className: 'hidden lg:table-cell' },
  { key: 'seen', label: 'Last seen', align: 'right', className: 'hidden md:table-cell' },
];

export function UsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [page, setPage] = useState(1);

  const gender = searchParams.get('gender') ?? '';
  const status = searchParams.get('status') ?? '';

  // Typing should not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isFetching, error, refetch } = useUsers({
    page,
    limit: 20,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(gender ? { gender } : {}),
    ...(status ? { status } : {}),
  });

  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
    setPage(1);
  }

  const users = data?.items ?? [];

  return (
    <>
      <PageHeader
        title="Users"
        description="Everyone who has signed up. Select a row to see their full account."
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-ink-200/70 p-4">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, nickname or email"
              aria-label="Search users"
              className="pl-9"
            />
          </div>

          <Select
            value={gender}
            onChange={(event) => updateFilter('gender', event.target.value)}
            aria-label="Filter by gender"
            className="w-auto"
          >
            <option value="">All genders</option>
            <option value="male">Boys</option>
            <option value="female">Girls</option>
          </Select>

          <Select
            value={status}
            onChange={(event) => updateFilter('status', event.target.value)}
            aria-label="Filter by status"
            className="w-auto"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="pending_verification">Pending verification</option>
            <option value="suspended">Suspended</option>
            <option value="deleted">Deleted</option>
          </Select>

          {/* Keeps the previous page visible while the next one loads, instead
              of blanking the table on every filter change. */}
          {isFetching && !isLoading && (
            <span className="text-xs text-ink-400" role="status">
              Updating…
            </span>
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
                  <SkeletonRows rows={8} columns={COLUMNS.length} />
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length}>
                      <EmptyState
                        icon={UsersIcon}
                        title="No users match these filters"
                        description="Try clearing the search or choosing a different status."
                      />
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <TRow key={user.id}>
                      <TCell className="p-0">
                        <Link to={`/users/${user.id}`} className="flex items-center gap-3 px-4 py-3.5">
                          <Avatar src={user.avatarUrl} name={user.name} gender={user.gender} />
                          <span className="min-w-0">
                            <span className="flex items-center gap-1.5">
                              <PresenceDot isOnline={user.isOnline} />
                              <span className="truncate font-medium text-ink-900">{user.nickname}</span>
                            </span>
                            <span className="block truncate text-xs text-ink-500">{user.email}</span>
                          </span>
                        </Link>
                      </TCell>
                      <TCell className="hidden sm:table-cell">
                        <Badge tone={user.gender === 'female' ? 'brand' : 'info'}>
                          {user.gender === 'female' ? 'Girl' : 'Boy'}
                        </Badge>
                      </TCell>
                      <TCell>
                        <StatusBadge status={user.status} />
                      </TCell>
                      <TCell align="right">
                        <span className="inline-flex items-center gap-1 font-medium text-ink-900">
                          <Coins className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                          {formatNumber(user.coinBalance)}
                        </span>
                      </TCell>
                      <TCell align="right" className="hidden text-ink-600 lg:table-cell">
                        {formatNumber(user.gamePoints)}
                      </TCell>
                      <TCell align="right" className="hidden text-xs text-ink-500 md:table-cell">
                        {user.isOnline ? 'Now' : formatRelative(user.lastSeenAt)}
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
    </>
  );
}
