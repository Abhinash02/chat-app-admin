import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { request, requestList } from '../lib/api.js';

/**
 * Query keys are declared in one place so an invalidation cannot silently miss
 * a cache entry because two files spelled the key differently.
 */
export const queryKeys = {
  dashboard: ['dashboard'],
  users: (params) => ['users', params],
  user: (userId) => ['user', userId],
  themes: ['themes'],
  activeTheme: ['theme', 'active'],
  settings: ['settings'],
  packages: ['packages'],
  orders: (params) => ['orders', params],
  reports: (params) => ['reports', params],
  transactions: (params) => ['transactions', params],
  auditLog: (params) => ['audit-log', params],
  campaigns: (params) => ['campaigns', params],
  campaign: (campaignId) => ['campaign', campaignId],
  templates: ['email-templates'],
  banners: ['banners'],
  reach: ['delivery-reach'],
};

// ----- Reads ---------------------------------------------------------------

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => request({ method: 'GET', url: '/admin/dashboard' }),
    // The headline numbers move constantly; refetching keeps them honest
    // without the operator reaching for reload.
    refetchInterval: 30_000,
  });
}

export function useUsers(params) {
  return useQuery({
    queryKey: queryKeys.users(params),
    queryFn: () => requestList({ method: 'GET', url: '/admin/users', params }),
    placeholderData: (previous) => previous,
  });
}

export function useUserDetail(userId) {
  return useQuery({
    queryKey: queryKeys.user(userId),
    queryFn: () => request({ method: 'GET', url: `/admin/users/${userId}` }),
    enabled: Boolean(userId),
  });
}

export function useThemes() {
  return useQuery({
    queryKey: queryKeys.themes,
    queryFn: () => request({ method: 'GET', url: '/theme' }),
  });
}

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => request({ method: 'GET', url: '/settings' }),
  });
}

export function usePackages() {
  return useQuery({
    queryKey: queryKeys.packages,
    queryFn: () => request({ method: 'GET', url: '/coins/admin/packages' }),
  });
}

export function useOrders(params) {
  return useQuery({
    queryKey: queryKeys.orders(params),
    queryFn: () => requestList({ method: 'GET', url: '/payments/admin/orders', params }),
    placeholderData: (previous) => previous,
    refetchInterval: 60_000,
  });
}

export function useReports(params) {
  return useQuery({
    queryKey: queryKeys.reports(params),
    queryFn: () => requestList({ method: 'GET', url: '/reports', params }),
    placeholderData: (previous) => previous,
  });
}

export function useTransactions(params) {
  return useQuery({
    queryKey: queryKeys.transactions(params),
    queryFn: () => requestList({ method: 'GET', url: '/admin/transactions', params }),
    placeholderData: (previous) => previous,
  });
}

export function useAuditLog(params) {
  return useQuery({
    queryKey: queryKeys.auditLog(params),
    queryFn: () => requestList({ method: 'GET', url: '/admin/audit-log', params }),
    placeholderData: (previous) => previous,
  });
}

export function useCampaigns(params) {
  return useQuery({
    queryKey: queryKeys.campaigns(params),
    queryFn: () => requestList({ method: 'GET', url: '/notifications/campaigns', params }),
    placeholderData: (previous) => previous,
    // A send in progress updates its counters as batches complete.
    refetchInterval: 15_000,
  });
}

export function useEmailTemplates() {
  return useQuery({
    queryKey: queryKeys.templates,
    queryFn: () => request({ method: 'GET', url: '/notifications/templates' }),
  });
}

export function useDeliveryReach() {
  return useQuery({
    queryKey: queryKeys.reach,
    queryFn: () => request({ method: 'GET', url: '/notifications/reach' }),
  });
}

export function useBanners() {
  return useQuery({
    queryKey: queryKeys.banners,
    queryFn: () => request({ method: 'GET', url: '/banners/admin/all' }),
  });
}

// ----- Writes --------------------------------------------------------------

/**
 * Every mutation reports its outcome the same way: a toast on success, the
 * server's own message on failure. Surfacing `error.message` rather than a
 * generic string matters — the API already writes user-facing copy, and
 * replacing it with "Something went wrong" throws away the useful part.
 */
function useApiMutation({ mutationFn, successMessage, invalidate = [] }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      const message =
        typeof successMessage === 'function' ? successMessage(data, variables) : successMessage;
      if (message) toast.success(message);

      for (const key of invalidate) queryClient.invalidateQueries({ queryKey: key });
    },
    onError: (error) => {
      toast.error(error?.message ?? 'Something went wrong');
    },
  });
}

export function useActivateTheme() {
  return useApiMutation({
    mutationFn: (themeId) => request({ method: 'POST', url: `/theme/${themeId}/activate` }),
    successMessage: (theme) => `${theme.name} is now live in the app`,
    invalidate: [queryKeys.themes, queryKeys.activeTheme],
  });
}

export function useCreateTheme() {
  return useApiMutation({
    mutationFn: (payload) => request({ method: 'POST', url: '/theme', data: payload }),
    successMessage: 'Theme created',
    invalidate: [queryKeys.themes],
  });
}

export function useUpdateTheme() {
  return useApiMutation({
    mutationFn: ({ themeId, ...payload }) =>
      request({ method: 'PATCH', url: `/theme/${themeId}`, data: payload }),
    successMessage: 'Theme saved',
    invalidate: [queryKeys.themes, queryKeys.activeTheme],
  });
}

export function useDeleteTheme() {
  return useApiMutation({
    mutationFn: (themeId) => request({ method: 'DELETE', url: `/theme/${themeId}` }),
    successMessage: 'Theme deleted',
    invalidate: [queryKeys.themes],
  });
}

export function useUpdateSettings() {
  return useApiMutation({
    mutationFn: (patch) => request({ method: 'PATCH', url: '/settings', data: patch }),
    successMessage: 'Settings saved',
    invalidate: [queryKeys.settings],
  });
}

export function useCreatePackage() {
  return useApiMutation({
    mutationFn: (payload) => request({ method: 'POST', url: '/coins/admin/packages', data: payload }),
    successMessage: 'Coin pack created',
    invalidate: [queryKeys.packages],
  });
}

export function useUpdatePackage() {
  return useApiMutation({
    mutationFn: ({ packageId, ...payload }) =>
      request({ method: 'PATCH', url: `/coins/admin/packages/${packageId}`, data: payload }),
    successMessage: 'Coin pack saved',
    invalidate: [queryKeys.packages],
  });
}

export function useDeletePackage() {
  return useApiMutation({
    mutationFn: (packageId) => request({ method: 'DELETE', url: `/coins/admin/packages/${packageId}` }),
    successMessage: 'Coin pack removed',
    invalidate: [queryKeys.packages],
  });
}

export function useSuspendUser() {
  return useApiMutation({
    mutationFn: ({ userId, reason }) =>
      request({ method: 'POST', url: `/admin/users/${userId}/suspend`, data: { reason } }),
    successMessage: 'Account suspended',
    invalidate: [['users'], ['user'], queryKeys.dashboard],
  });
}

export function useReactivateUser() {
  return useApiMutation({
    mutationFn: (userId) => request({ method: 'POST', url: `/admin/users/${userId}/reactivate` }),
    successMessage: 'Account reactivated',
    invalidate: [['users'], ['user'], queryKeys.dashboard],
  });
}

export function useForceLogout() {
  return useApiMutation({
    mutationFn: (userId) => request({ method: 'POST', url: `/admin/users/${userId}/force-logout` }),
    successMessage: 'Signed out of every device',
    invalidate: [['user']],
  });
}

export function useAdjustCoins() {
  return useApiMutation({
    mutationFn: ({ userId, amount, reason }) =>
      request({ method: 'POST', url: `/admin/users/${userId}/coins`, data: { amount, reason } }),
    successMessage: (snapshot) => `Balance is now ${snapshot.coinBalance} coins`,
    invalidate: [['user'], ['users'], ['transactions'], queryKeys.dashboard],
  });
}

export function useResetFreeTalk() {
  return useApiMutation({
    mutationFn: (userId) => request({ method: 'POST', url: `/admin/users/${userId}/free-talk/reset` }),
    successMessage: 'Free chat time restored',
    invalidate: [['user']],
  });
}

export function useApproveOrder() {
  return useApiMutation({
    mutationFn: (orderId) => request({ method: 'POST', url: `/payments/admin/orders/${orderId}/approve` }),
    successMessage: (result) =>
      result.alreadyCredited ? 'Already credited' : 'Payment approved and coins credited',
    invalidate: [['orders'], queryKeys.dashboard],
  });
}

export function useRejectOrder() {
  return useApiMutation({
    mutationFn: ({ orderId, reason }) =>
      request({ method: 'POST', url: `/payments/admin/orders/${orderId}/reject`, data: { reason } }),
    successMessage: 'Payment rejected',
    invalidate: [['orders'], queryKeys.dashboard],
  });
}

export function useReviewReport() {
  return useApiMutation({
    mutationFn: ({ reportId, status, reviewNote }) =>
      request({ method: 'PATCH', url: `/reports/${reportId}`, data: { status, reviewNote } }),
    successMessage: 'Report updated',
    invalidate: [['reports']],
  });
}


// ----- Campaigns -----------------------------------------------------------

/**
 * Audience preview is a POST that reads rather than writes, so it is a mutation
 * here only because the filter lives in the request body. Nothing is created.
 */
export function usePreviewAudience() {
  return useMutation({
    mutationFn: (audience) =>
      request({ method: 'POST', url: '/notifications/audience/preview', data: audience }),
    onError: (error) => toast.error(error?.message ?? 'Could not work out the audience'),
  });
}

export function useCreateCampaign() {
  return useApiMutation({
    mutationFn: (payload) => request({ method: 'POST', url: '/notifications/campaigns', data: payload }),
    successMessage: 'Campaign saved as a draft',
    invalidate: [['campaigns']],
  });
}

export function useSendCampaign() {
  return useApiMutation({
    mutationFn: ({ campaignId, scheduledAt = null }) =>
      request({ method: 'POST', url: `/notifications/campaigns/${campaignId}/send`, data: { scheduledAt } }),
    successMessage: (campaign) => `Sending to ${campaign.stats.targeted} people`,
    invalidate: [['campaigns']],
  });
}

export function useCancelCampaign() {
  return useApiMutation({
    mutationFn: (campaignId) =>
      request({ method: 'POST', url: `/notifications/campaigns/${campaignId}/cancel` }),
    successMessage: 'Campaign stopped',
    invalidate: [['campaigns']],
  });
}

export function useSendTestEmail() {
  return useApiMutation({
    mutationFn: ({ campaignId, toEmail }) =>
      request({ method: 'POST', url: `/notifications/campaigns/${campaignId}/test`, data: { toEmail } }),
    successMessage: (result) =>
      result.delivered ? 'Test email sent' : 'Email is not configured on the server yet',
  });
}

export function useCreateTemplate() {
  return useApiMutation({
    mutationFn: (payload) => request({ method: 'POST', url: '/notifications/templates', data: payload }),
    successMessage: 'Template created',
    invalidate: [queryKeys.templates],
  });
}

export function useUpdateTemplate() {
  return useApiMutation({
    mutationFn: ({ templateId, ...payload }) =>
      request({ method: 'PATCH', url: `/notifications/templates/${templateId}`, data: payload }),
    successMessage: 'Template saved',
    invalidate: [queryKeys.templates],
  });
}

export function useDeleteTemplate() {
  return useApiMutation({
    mutationFn: (templateId) => request({ method: 'DELETE', url: `/notifications/templates/${templateId}` }),
    successMessage: 'Template deleted',
    invalidate: [queryKeys.templates],
  });
}


// ----- Banners -------------------------------------------------------------

/**
 * Banners carry an image, so these go out as multipart rather than JSON.
 * Axios sets the boundary itself when handed a FormData, which is why no
 * Content-Type is specified here — setting it by hand omits the boundary and
 * the upload fails with a confusing parse error.
 */
function toBannerFormData({ image, ...fields }) {
  const form = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    form.append(key, value instanceof Date ? value.toISOString() : String(value));
  }

  if (image) form.append('image', image);

  return form;
}

export function useCreateBanner() {
  return useApiMutation({
    mutationFn: (payload) =>
      request({ method: 'POST', url: '/banners/admin', data: toBannerFormData(payload) }),
    successMessage: 'Banner created',
    invalidate: [queryKeys.banners],
  });
}

export function useUpdateBanner() {
  return useApiMutation({
    mutationFn: ({ bannerId, ...payload }) =>
      request({ method: 'PATCH', url: `/banners/admin/${bannerId}`, data: toBannerFormData(payload) }),
    successMessage: 'Banner saved',
    invalidate: [queryKeys.banners],
  });
}

export function useDeleteBanner() {
  return useApiMutation({
    mutationFn: (bannerId) => request({ method: 'DELETE', url: `/banners/admin/${bannerId}` }),
    successMessage: 'Banner removed',
    invalidate: [queryKeys.banners],
  });
}

// ----- Scheduling ----------------------------------------------------------

export function useScheduleTheme() {
  return useApiMutation({
    mutationFn: ({ themeId, ...payload }) =>
      request({ method: 'POST', url: `/theme/${themeId}/schedule`, data: payload }),
    successMessage: 'Schedule saved',
    invalidate: [queryKeys.themes, queryKeys.activeTheme],
  });
}

export function useSetCampaignSchedule() {
  return useApiMutation({
    mutationFn: ({ campaignId, repeat }) =>
      request({ method: 'POST', url: `/notifications/campaigns/${campaignId}/schedule`, data: { repeat } }),
    successMessage: 'Schedule saved',
    invalidate: [['campaigns']],
  });
}
