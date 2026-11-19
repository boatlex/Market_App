import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../contexts/authContext';
import {
  User,
  Product,
  Report,
  ServiceProvider,
  Job,
  JobSeekerProfile,
  ReportStatus,
  ReportTargetType,
  FeedbackItem,
  FeedbackStatus,
  PaginationMeta,
  DashboardStatsResponse,
  RegionalStatsResponse,
} from '../types';


// --- Response & Parameter Types ---

interface PaginatedUsersResponse {
  success: boolean;
  users: User[];
  pagination: PaginationMeta;
}

interface PaginatedProductsResponse {
  success: boolean;
  products: Product[];
  pagination: PaginationMeta;
}

interface PaginatedReportsResponse {
  success: boolean;
  reports: Report[];
  pagination: PaginationMeta;
}

interface PaginatedProvidersResponse {
  success: boolean;
  providers: ServiceProvider[];
  pagination: PaginationMeta;
}

interface PaginatedJobsResponse {
  success: boolean;
  jobs: Job[];
  pagination: PaginationMeta;
}

interface PaginatedJobSeekersResponse {
  success: boolean;
  jobSeekers: JobSeekerProfile[];
  pagination: PaginationMeta;
}

interface AdminListParams {
  page?: number;
  limit?: number;
  search?: string;
  enabled?: boolean;
}

interface AdminReportsParams {
  page?: number;
  limit?: number;
  status?: ReportStatus;
  targetType?: ReportTargetType;
  enabled?: boolean;
}

interface AdminProvidersParams {
  page?: number;
  limit?: number;
  search?: string;
  verified?: 'true' | 'false';
  enabled?: boolean;
}
interface UseAdminFeedbackParams {
  page?: number;
  limit?: number;
  status?: FeedbackStatus;
  enabled?: boolean;
}

interface PaginatedFeedbackResponse {
  success: boolean;
  feedback: FeedbackItem[];
  pagination: PaginationMeta;
}

const DEFAULT_STALE_TIME = 1000 * 30; // 30 seconds

// Internal helper: Ensures auth is initialized, user is an admin, and caller enabled the query
const useCanFetchAdmin = (externalEnabled = true) => {
  const { user, isInitializing } = useAuth();
  const isAdmin = !isInitializing && user?.role === 'admin';
  return isAdmin && externalEnabled;
};

// 1. Dashboard Overview Stats Hook (GET /admin/stats)
export const useAdminStats = (enabled = true) => {
  const canFetch = useCanFetchAdmin(enabled);

  return useQuery<DashboardStatsResponse['stats']>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data } = await api.get<DashboardStatsResponse>('/admin/stats');
      return data.stats;
    },
    enabled: canFetch,
    staleTime: DEFAULT_STALE_TIME,
  });
};

// 2. Manage Users & Cascading Delete Hook (GET /admin/users & DELETE /admin/users/:id)
export const useAdminUsers = (params: AdminListParams = {}) => {
  const queryClient = useQueryClient();
  const { page = 1, limit = 10, search = '', enabled = true } = params;
  const canFetch = useCanFetchAdmin(enabled);

  const usersQuery = useQuery<PaginatedUsersResponse>({
    queryKey: ['admin-users', { page, limit, search }],
    queryFn: async () => {
      const { data } = await api.get<PaginatedUsersResponse>('/admin/users', {
        params: { page, limit, search: search || undefined },
      });
      return data;
    },
    enabled: canFetch,
    staleTime: DEFAULT_STALE_TIME,
    placeholderData: (previousData) => previousData,
  });

  const toggleUserVerificationMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.patch<{
        success: boolean;
        message: string;
        user: User;
      }>(`/admin/users/${userId}/verify`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.delete<{ success: boolean; message: string }>(
        `/admin/users/${userId}`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-providers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-job-seekers'] });
    },
  });

  return {
    data: usersQuery.data,
    users: usersQuery.data?.users || [],
    pagination: usersQuery.data?.pagination,
    isLoading: usersQuery.isLoading,
    refetch: usersQuery.refetch,

    toggleUserVerification: toggleUserVerificationMutation.mutate,
    isTogglingUserVerification: toggleUserVerificationMutation.isPending,
    togglingUserId: toggleUserVerificationMutation.isPending
      ? toggleUserVerificationMutation.variables
      : null,

    deleteUser: deleteUserMutation.mutate,
    deleteUserAsync: deleteUserMutation.mutateAsync,
    isDeletingUser: deleteUserMutation.isPending,
    deletingUserId: deleteUserMutation.isPending ? deleteUserMutation.variables : null,
  };
};

// 3. Manage Products & Delete Hook (GET /admin/all-products & DELETE /admin/delete/:id)
export const useAdminProducts = (params: AdminListParams = {}) => {
  const queryClient = useQueryClient();
  const { page = 1, limit = 10, search = '', enabled = true } = params;
  const canFetch = useCanFetchAdmin(enabled);

  const productsQuery = useQuery<PaginatedProductsResponse>({
    queryKey: ['admin-products', { page, limit, search }],
    queryFn: async () => {
      const { data } = await api.get<PaginatedProductsResponse>('/admin/all-products', {
        params: { page, limit, search: search || undefined },
      });
      return data;
    },
    enabled: canFetch,
    staleTime: DEFAULT_STALE_TIME,
    placeholderData: (previousData) => previousData,
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { data } = await api.delete<{ success: boolean; message: string }>(
        `/admin/delete/${productId}`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  return {
    products: productsQuery.data?.products || [],
    pagination: productsQuery.data?.pagination,
    isLoadingProducts: productsQuery.isLoading,
    isProductsError: productsQuery.isError,
    refetchProducts: productsQuery.refetch,

    deleteProduct: deleteProductMutation.mutate,
    deleteProductAsync: deleteProductMutation.mutateAsync,
    isDeletingProduct: deleteProductMutation.isPending,
    deletingProductId: deleteProductMutation.isPending ? deleteProductMutation.variables : null,
  };
};

// 4. Manage Reports & Status Updates Hook (GET /admin/reports & PATCH /admin/reports/:id)
export const useAdminReports = (params: AdminReportsParams = {}) => {
  const queryClient = useQueryClient();
  const { page = 1, limit = 10, status, targetType, enabled = true } = params;
  const canFetch = useCanFetchAdmin(enabled);

  const reportsQuery = useQuery<PaginatedReportsResponse>({
    queryKey: ['admin-reports', { page, limit, status, targetType }],
    queryFn: async () => {
      const { data } = await api.get<PaginatedReportsResponse>('/admin/reports', {
        params: { page, limit, status, targetType },
      });
      return data;
    },
    enabled: canFetch,
    staleTime: DEFAULT_STALE_TIME,
    placeholderData: (previousData) => previousData,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ reportId, status }: { reportId: string; status: ReportStatus }) => {
      const { data } = await api.patch<{ success: boolean; message: string; report: Report }>(
        `/admin/reports/${reportId}`,
        { status }
      );
      return data.report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  return {
    reports: reportsQuery.data?.reports || [],
    pagination: reportsQuery.data?.pagination,
    isLoadingReports: reportsQuery.isLoading,
    isReportsError: reportsQuery.isError,
    refetchReports: reportsQuery.refetch,

    updateReportStatus: updateStatusMutation.mutate,
    updateReportStatusAsync: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,
    updatingReportId: updateStatusMutation.isPending
      ? updateStatusMutation.variables?.reportId
      : null,
  };
};
// 5. Manage Service Providers, Verification & Delete Hook
export const useAdminProviders = (params: AdminProvidersParams = {}) => {
  const queryClient = useQueryClient();
  const { page = 1, limit = 10, search = '', verified, enabled = true } = params;
  const canFetch = useCanFetchAdmin(enabled);

  const providersQuery = useQuery<PaginatedProvidersResponse>({
    queryKey: ['admin-providers', { page, limit, search, verified }],
    queryFn: async () => {
      const { data } = await api.get<PaginatedProvidersResponse>('/admin/providers', {
        params: { page, limit, search: search || undefined, verified },
      });
      return data;
    },
    enabled: canFetch,
    staleTime: DEFAULT_STALE_TIME,
    placeholderData: (previousData) => previousData,
  });

  const toggleVerificationMutation = useMutation({
    mutationFn: async (providerId: string) => {
      const { data } = await api.patch<{
        success: boolean;
        message: string;
        provider: ServiceProvider;
      }>(`/admin/providers/${providerId}/verify`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-providers'] });
    },
  });

  const deleteProviderMutation = useMutation({
    mutationFn: async (providerId: string) => {
      const { data } = await api.delete<{ success: boolean; message: string }>(
        `/admin/providers/${providerId}`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-providers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  return {
    providers: providersQuery.data?.providers || [],
    pagination: providersQuery.data?.pagination,
    isLoadingProviders: providersQuery.isLoading,
    isProvidersError: providersQuery.isError,
    refetchProviders: providersQuery.refetch,

    toggleVerification: toggleVerificationMutation.mutate,
    toggleVerificationAsync: toggleVerificationMutation.mutateAsync,
    isTogglingVerification: toggleVerificationMutation.isPending,
    togglingProviderId: toggleVerificationMutation.isPending
      ? toggleVerificationMutation.variables
      : null,

    deleteProvider: deleteProviderMutation.mutate,
    deleteProviderAsync: deleteProviderMutation.mutateAsync,
    isDeletingProvider: deleteProviderMutation.isPending,
    deletingProviderId: deleteProviderMutation.isPending
      ? deleteProviderMutation.variables
      : null,
  };
};

// 6. Delete Abusive Provider Review Hook (DELETE /admin/reviews/:id)
export const useAdminDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      const { data } = await api.delete<{ success: boolean; message: string }>(
        `/admin/reviews/${reviewId}`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['admin-providers'] });
    },
  });
};

// 7. Manage Jobs & Delete Hook
export const useAdminJobs = (params: AdminListParams = {}) => {
  const queryClient = useQueryClient();
  const { page = 1, limit = 10, search = '', enabled = true } = params;
  const canFetch = useCanFetchAdmin(enabled);

  const jobsQuery = useQuery<PaginatedJobsResponse>({
    queryKey: ['admin-jobs', { page, limit, search }],
    queryFn: async () => {
      const { data } = await api.get<PaginatedJobsResponse>('/admin/jobs', {
        params: { page, limit, search: search || undefined },
      });
      return data;
    },
    enabled: canFetch,
    staleTime: DEFAULT_STALE_TIME,
    placeholderData: (previousData) => previousData,
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { data } = await api.delete<{ success: boolean; message: string }>(
        `/admin/jobs/${jobId}`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  return {
    jobs: jobsQuery.data?.jobs || [],
    pagination: jobsQuery.data?.pagination,
    isLoadingJobs: jobsQuery.isLoading,
    isJobsError: jobsQuery.isError,
    refetchJobs: jobsQuery.refetch,

    deleteJob: deleteJobMutation.mutate,
    deleteJobAsync: deleteJobMutation.mutateAsync,
    isDeletingJob: deleteJobMutation.isPending,
    deletingJobId: deleteJobMutation.isPending ? deleteJobMutation.variables : null,
  };
};

// 8. Manage Job Seekers & Delete Hook (GET /admin/job-seekers & DELETE /admin/job-seekers/:id)
export const useAdminJobSeekers = (params: AdminListParams = {}) => {
  const queryClient = useQueryClient();
  const { page = 1, limit = 10, search = '', enabled = true } = params;
  const canFetch = useCanFetchAdmin(enabled);

  const seekersQuery = useQuery<PaginatedJobSeekersResponse>({
    queryKey: ['admin-job-seekers', { page, limit, search }],
    queryFn: async () => {
      const { data } = await api.get<PaginatedJobSeekersResponse>('/admin/job-seekers', {
        params: { page, limit, search: search || undefined },
      });
      return data;
    },
    enabled: canFetch,
    staleTime: DEFAULT_STALE_TIME,
    placeholderData: (previousData) => previousData,
  });

  const deleteJobSeekerMutation = useMutation({
    mutationFn: async (seekerId: string) => {
      const { data } = await api.delete<{ success: boolean; message: string }>(
        `/admin/job-seekers/${seekerId}`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-job-seekers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  return {
    jobSeekers: seekersQuery.data?.jobSeekers || [],
    pagination: seekersQuery.data?.pagination,
    isLoadingJobSeekers: seekersQuery.isLoading,
    refetchJobSeekers: seekersQuery.refetch,

    deleteJobSeeker: deleteJobSeekerMutation.mutate,
    deleteJobSeekerAsync: deleteJobSeekerMutation.mutateAsync,
    isDeletingJobSeeker: deleteJobSeekerMutation.isPending,
    deletingJobSeekerId: deleteJobSeekerMutation.isPending
      ? deleteJobSeekerMutation.variables
      : null,
  };
};

// 9. Regional & District Breakdown Hook (GET /admin/regional-stats)
export const useAdminRegionalStats = (enabled = true) => {
  const canFetch = useCanFetchAdmin(enabled);

  return useQuery<RegionalStatsResponse>({
    queryKey: ['admin-regional-stats'],
    queryFn: async () => {
      const { data } = await api.get<RegionalStatsResponse>('/admin/regional-stats');
      return data;
    },
    enabled: canFetch,
    staleTime: DEFAULT_STALE_TIME,
  });
};



// 9. Manage User Feedback & Status Updates (GET /admin/feedback & PATCH /admin/feedback/:id/status)
export const useAdminFeedback = (params: UseAdminFeedbackParams = {}) => {
  const queryClient = useQueryClient();
  const { page = 1, limit = 10, status, enabled = true } = params;
  const canFetch = useCanFetchAdmin(enabled);

  const feedbackQuery = useQuery<PaginatedFeedbackResponse>({
    queryKey: ['admin-feedback', { page, limit, status }],
    queryFn: async () => {
      const { data } = await api.get<PaginatedFeedbackResponse>('/admin/feedback', {
        params: { page, limit, ...(status ? { status } : {}) },
      });
      return data;
    },
    enabled: canFetch,
    staleTime: DEFAULT_STALE_TIME,
    placeholderData: (previousData) => previousData,
  });

  const statusMutation = useMutation({
    mutationFn: async ({
      feedbackId,
      nextStatus,
    }: {
      feedbackId: string;
      nextStatus: FeedbackStatus;
    }) => {
      const { data } = await api.patch<{
        success: boolean;
        message: string;
        feedback: FeedbackItem;
      }>(`/admin/feedback/${feedbackId}/status`, {
        status: nextStatus,
      });
      return data.feedback;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
    },
  });
  return {
    feedbackList: feedbackQuery.data?.feedback || [],
    pagination: feedbackQuery.data?.pagination,
    isLoadingFeedback: feedbackQuery.isLoading,
    refetchFeedback: feedbackQuery.refetch,

    updateFeedbackStatus: statusMutation.mutate,
    isUpdatingFeedbackStatus: statusMutation.isPending,
    updatingFeedbackId: statusMutation.isPending
      ? statusMutation.variables?.feedbackId
      : null,
    updatingFeedbackStatus: statusMutation.isPending
      ? statusMutation.variables?.nextStatus
      : null,
  };

};
