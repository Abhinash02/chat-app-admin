import { useEffect, useState, useRef } from 'react';
import {
  Headset,
  Send,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  Sparkles,
  Plus,
  Trash2,
  X,
  User,
  Filter,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { PageHeader } from '../components/layout/AppLayout.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { LoadingState } from '../components/ui/Feedback.jsx';
import {
  useSupportTickets,
  useSupportTicketDetails,
  useSendSupportMessage,
  useUpdateSupportStatus,
  useDeleteSupportTicket,
  useCannedResponses,
  useCreateCannedResponse,
  useDeleteCannedResponse,
} from '../hooks/queries.js';
import { connectSocket } from '../lib/socket.js';
import { useQueryClient } from '@tanstack/react-query';

export function SupportPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [issueFilter, setIssueFilter] = useState('all');
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [confirmDeleteTicket, setConfirmDeleteTicket] = useState(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplateContent, setNewTemplateContent] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('general');

  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const {
    data: ticketsData,
    isLoading: isLoadingTickets,
    isRefetching: isRefetchingTickets,
    refetch: refetchTickets,
  } = useSupportTickets({
    status: statusFilter,
    issueType: issueFilter,
  });

  const tickets = ticketsData?.items ?? [];
  const unreadTotal = ticketsData?.meta?.unreadCount ?? 0;

  // Only auto-select if first ticket is already open or in_progress, keep pending tickets untouched until Admin opens them
  useEffect(() => {
    if (!selectedTicketId && tickets.length > 0 && tickets[0].status !== 'pending') {
      setSelectedTicketId(tickets[0]._id);
    }
  }, [tickets, selectedTicketId]);

  const {
    data: activeTicketData,
    isLoading: isLoadingDetails,
    refetch: refetchActiveTicket,
  } = useSupportTicketDetails(selectedTicketId);
  const activeTicket = activeTicketData?.ticket;
  const messages = activeTicketData?.messages ?? [];

  const handleManualRefresh = async () => {
    await Promise.all([
      refetchTickets(),
      selectedTicketId ? refetchActiveTicket() : Promise.resolve(),
    ]);
  };

  const sendMessageMutation = useSendSupportMessage();
  const updateStatusMutation = useUpdateSupportStatus();
  const deleteTicketMutation = useDeleteSupportTicket();

  const { data: cannedResponses = [] } = useCannedResponses();
  const createCannedMutation = useCreateCannedResponse();
  const deleteCannedMutation = useDeleteCannedResponse();

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time socket updates for support channel
  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return undefined;

    const handleNewMessage = (payload) => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      if (selectedTicketId && (payload.dbTicketId === selectedTicketId || payload.ticketId === activeTicket?.ticketId)) {
        queryClient.invalidateQueries({ queryKey: ['support-ticket', selectedTicketId] });
      }
    };

    const handleTicketUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      if (selectedTicketId) {
        queryClient.invalidateQueries({ queryKey: ['support-ticket', selectedTicketId] });
      }
    };

    socket.on('support:message:new', handleNewMessage);
    socket.on('support:ticket:created', handleTicketUpdate);
    socket.on('support:ticket:updated', handleTicketUpdate);

    return () => {
      socket.off('support:message:new', handleNewMessage);
      socket.off('support:ticket:created', handleTicketUpdate);
      socket.off('support:ticket:updated', handleTicketUpdate);
    };
  }, [queryClient, selectedTicketId, activeTicket]);

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!messageInput.trim() || !selectedTicketId) return;

    sendMessageMutation.mutate(
      {
        ticketId: selectedTicketId,
        message: messageInput.trim(),
      },
      {
        onSuccess: () => {
          setMessageInput('');
        },
      },
    );
  };

  const handleUseTemplate = (content) => {
    setMessageInput(content);
  };

  const handleCreateTemplate = (e) => {
    e.preventDefault();
    if (!newTemplateTitle.trim() || !newTemplateContent.trim()) return;

    createCannedMutation.mutate(
      {
        title: newTemplateTitle.trim(),
        content: newTemplateContent.trim(),
        category: newTemplateCategory,
      },
      {
        onSuccess: () => {
          setNewTemplateTitle('');
          setNewTemplateContent('');
          setIsTemplateModalOpen(false);
        },
      },
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-600">
            <Clock className="h-3 w-3" /> Pending
          </span>
        );
      case 'open':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">
            <AlertCircle className="h-3 w-3" /> Open
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600">
            <Clock className="h-3 w-3" /> In Progress
          </span>
        );
      case 'resolved':
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
            <CheckCircle className="h-3 w-3" /> Resolved
          </span>
        );
      default:
        return null;
    }
  };

  const getIssueBadge = (type) => {
    const labels = {
      billing: 'Coins / Payment',
      account: 'Account Issue',
      technical: 'Technical Bug',
      bug: 'App Crash',
      other: 'General',
    };
    return (
      <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[11px] font-medium text-ink-600">
        {labels[type] || type}
      </span>
    );
  };

  return (
    <div>
      <PageHeader
        title="Customer Support Desk"
        description="Real-time live help desk connecting users directly to support admins."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefetchingTickets || isLoadingTickets}
            >
              <RefreshCw
                className={`mr-1.5 h-3.5 w-3.5 text-brand-600 ${
                  isRefetchingTickets ? 'animate-spin' : ''
                }`}
              />
              {isRefetchingTickets ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsTemplateModalOpen(true)}>
              <Sparkles className="mr-1.5 h-4 w-4 text-brand-500" /> Custom Message Templates
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: TICKET LIST */}
        <div className="lg:col-span-5 xl:col-span-4">
          <Card className="flex h-[calc(100vh-220px)] flex-col overflow-hidden p-0">
            {/* Filter Bar */}
            <div className="border-b border-ink-100 bg-ink-50/50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                    Tickets ({tickets.length})
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {unreadTotal > 0 && (
                    <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-bold text-white">
                      {unreadTotal} Unread
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleManualRefresh}
                    title="Refresh ticket queue"
                    className="p-1 rounded hover:bg-ink-200/50 text-ink-500 transition"
                  >
                    <RefreshCw
                      className={`h-3 w-3 ${
                        isRefetchingTickets ? 'animate-spin text-brand-600' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-700 shadow-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>

                <select
                  value={issueFilter}
                  onChange={(e) => setIssueFilter(e.target.value)}
                  className="w-full rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-700 shadow-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="billing">Coins / Billing</option>
                  <option value="account">Account</option>
                  <option value="technical">Technical</option>
                  <option value="other">General</option>
                </select>
              </div>
            </div>

            {/* Tickets Queue */}
            <div className="flex-1 overflow-y-auto divide-y divide-ink-100">
              {isLoadingTickets ? (
                <div className="p-8">
                  <LoadingState label="Loading support queue..." />
                </div>
              ) : tickets.length === 0 ? (
                <div className="p-8 text-center text-ink-400">
                  <Headset className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm font-medium">No support tickets found</p>
                </div>
              ) : (
                tickets.map((ticket) => {
                  const isSelected = selectedTicketId === ticket._id;
                  const isUnread = ticket.unreadByAdmin;

                  return (
                    <button
                      key={ticket._id}
                      onClick={() => setSelectedTicketId(ticket._id)}
                      className={`w-full text-left p-3.5 transition hover:bg-ink-50/80 ${
                        isSelected ? 'bg-brand-50/50 border-l-4 border-brand-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar
                            name={ticket.userId?.name || 'User'}
                            src={ticket.userId?.avatarUrl}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-ink-900">
                              {ticket.userId?.name || 'Anonymous User'}
                            </p>
                            <p className="truncate text-[11px] text-ink-400 font-mono">
                              {ticket.ticketId}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(ticket.status)}
                      </div>

                      <p className="text-xs font-medium text-ink-800 truncate mb-1">
                        {ticket.subject}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-ink-400">
                        {getIssueBadge(ticket.issueType)}
                        <span>
                          {new Date(ticket.updatedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {isUnread && (
                        <div className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-rose-600">
                          <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                          New Message
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: ACTIVE CHAT & ACTION DESK */}
        <div className="lg:col-span-7 xl:col-span-8">
          <Card className="flex h-[calc(100vh-220px)] flex-col overflow-hidden p-0">
            {!selectedTicketId || !activeTicket ? (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center text-ink-400">
                <MessageSquare className="h-12 w-12 mb-3 text-ink-300" />
                <h3 className="text-base font-semibold text-ink-700">Select a Support Ticket</h3>
                <p className="text-xs text-ink-500 max-w-sm mt-1">
                  Choose a ticket from the left panel to start real-time assistance with the user.
                </p>
              </div>
            ) : (
              <>
                {/* Chat Top Header */}
                <div className="flex flex-wrap items-center justify-between border-b border-ink-100 bg-ink-50/70 p-4 gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={activeTicket.userId?.name || 'User'}
                      src={activeTicket.userId?.avatarUrl}
                      size="md"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-semibold text-ink-900">
                          {activeTicket.userId?.name || 'User'}
                        </h2>
                        <span className="text-xs font-mono text-ink-400">
                          ({activeTicket.ticketId})
                        </span>
                      </div>
                      <p className="text-xs text-ink-500 truncate max-w-md">
                        {activeTicket.subject}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(activeTicket.status)}

                    <select
                      value={activeTicket.status}
                      onChange={(e) =>
                        updateStatusMutation.mutate({
                          ticketId: activeTicket._id,
                          status: e.target.value,
                        })
                      }
                      className="rounded-lg border border-ink-200 bg-white px-2 py-1 text-xs font-medium text-ink-700 shadow-sm"
                    >
                      <option value="pending">Mark Pending</option>
                      <option value="open">Mark Open</option>
                      <option value="in_progress">Mark In Progress</option>
                      <option value="resolved">Mark Resolved</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => setConfirmDeleteTicket(activeTicket)}
                      className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-100 transition shadow-sm"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>

                {/* Messages Stream */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                  {isLoadingDetails ? (
                    <LoadingState label="Loading messages history..." />
                  ) : (
                    messages.map((msg) => {
                      const isAdminMsg = msg.senderType === 'admin';

                      return (
                        <div
                          key={msg._id}
                          className={`flex flex-col ${
                            isAdminMsg ? 'items-end' : 'items-start'
                          }`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl p-3 text-xs shadow-sm ${
                              isAdminMsg
                                ? 'bg-brand-600 text-white rounded-br-none'
                                : 'bg-white text-ink-900 border border-ink-100 rounded-bl-none'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1 opacity-75 text-[10px]">
                              <span className="font-semibold">
                                {isAdminMsg ? 'Support Admin' : msg.senderId?.name || 'User'}
                              </span>
                              <span>
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-2 space-y-1.5">
                                {msg.attachments.map((att, i) => (
                                  <a key={i} href={att.url} target="_blank" rel="noopener noreferrer">
                                    <img
                                      src={att.url}
                                      alt="Attachment"
                                      className="max-w-[240px] max-h-[240px] rounded-xl object-cover border border-black/10 hover:opacity-90 transition"
                                    />
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Reply Canned Templates Bar */}
                {cannedResponses.length > 0 && (
                  <div className="border-t border-ink-100 bg-white p-2 flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
                    <span className="text-[11px] font-semibold text-brand-600 flex items-center gap-1 whitespace-nowrap pl-2">
                      <Sparkles className="h-3 w-3" /> Quick:
                    </span>
                    {cannedResponses.map((item) => (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => handleUseTemplate(item.content)}
                        className="rounded-full border border-brand-200 bg-brand-50/60 px-2.5 py-1 text-[11px] font-medium text-brand-700 whitespace-nowrap hover:bg-brand-100 transition"
                      >
                        {item.title}
                      </button>
                    ))}
                  </div>
                )}

                {/* Message Input Controls */}
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-2 border-t border-ink-100 bg-white p-3"
                >
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type your response to the user..."
                    className="flex-1 rounded-xl border border-ink-200 bg-ink-50/50 px-4 py-2 text-xs text-ink-900 placeholder-ink-400 focus:border-brand-500 focus:bg-white focus:outline-none"
                  />
                  <Button
                    type="submit"
                    disabled={!messageInput.trim() || sendMessageMutation.isPending}
                    size="sm"
                  >
                    <Send className="mr-1.5 h-3.5 w-3.5" /> Send Reply
                  </Button>
                </form>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Canned Templates Manager Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <h3 className="text-base font-semibold text-ink-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-brand-500" /> Custom Reply Templates
              </h3>
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="text-ink-400 hover:text-ink-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Existing Templates */}
            <div className="max-h-48 overflow-y-auto space-y-2 border border-ink-100 rounded-xl p-3">
              {cannedResponses.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between bg-ink-50 p-2.5 rounded-lg text-xs"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-semibold text-ink-900">{item.title}</p>
                    <p className="text-ink-500 truncate text-[11px]">{item.content}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteCannedMutation.mutate(item._id)}
                    className="text-rose-500 hover:text-rose-700 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Template Form */}
            <form onSubmit={handleCreateTemplate} className="space-y-3 pt-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                Add New Template
              </p>
              <input
                type="text"
                value={newTemplateTitle}
                onChange={(e) => setNewTemplateTitle(e.target.value)}
                placeholder="Template Title (e.g. Refund Processed)"
                className="w-full rounded-xl border border-ink-200 p-2.5 text-xs text-ink-900 focus:border-brand-500 focus:outline-none"
                required
              />
              <textarea
                value={newTemplateContent}
                onChange={(e) => setNewTemplateContent(e.target.value)}
                placeholder="Standard message copy..."
                rows={3}
                className="w-full rounded-xl border border-ink-200 p-2.5 text-xs text-ink-900 focus:border-brand-500 focus:outline-none"
                required
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" type="button" onClick={() => setIsTemplateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCannedMutation.isPending}>
                  <Plus className="mr-1 h-4 w-4" /> Add Template
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {confirmDeleteTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="h-6 w-6" />
              <h3 className="text-base font-bold text-ink-900">Delete Support Ticket</h3>
            </div>
            <p className="text-xs text-ink-600 leading-relaxed">
              Are you sure you want to permanently delete ticket{' '}
              <span className="font-bold text-ink-900">{confirmDeleteTicket.ticketId}</span> ({confirmDeleteTicket.subject})?
              <br />
              This action <span className="font-bold text-rose-600">cannot be undone</span> and all message history will be removed.
            </p>
            <div className="flex justify-end gap-3 pt-2 border-t border-ink-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDeleteTicket(null)}
                disabled={deleteTicketMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  deleteTicketMutation.mutate(confirmDeleteTicket._id, {
                    onSuccess: () => {
                      setConfirmDeleteTicket(null);
                      setSelectedTicketId(null);
                    },
                  });
                }}
                disabled={deleteTicketMutation.isPending}
              >
                {deleteTicketMutation.isPending ? 'Deleting...' : 'Yes, Delete Ticket'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
