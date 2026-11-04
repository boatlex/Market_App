import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api'; 
import { Report, ReportTargetType, ReportReason, ReportStatus } from '../types';

interface FetchReportsResponse {
  success: boolean;
  reports: Report[];
  pagination: {
    totalReports: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

interface FetchReportsParams {
  page: number;
  limit?: number;
  status?: ReportStatus;
}

interface CreateReportPayload {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description?: string;
}

const useReports = (params?: FetchReportsParams) => {
  const queryClient = useQueryClient();
  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const status = params?.status;

  // 1. Fetch Reports Query (For Admins)
  const reportsQuery = useQuery<FetchReportsResponse>({
    queryKey: ['reports', { page, status, limit }],
    queryFn: async () => {
      const { data } = await api.get<FetchReportsResponse>('/reports', {
        params: { page, limit, status },
      });
      return data;
    },
    // Only run this query if pagination parameters are provided (e.g., on Admin panel)
    enabled: !!params,
    placeholderData: (previousData) => previousData, // Keeps list fluid during pagination transitions
  });

  // 2. Submit New Report Mutation (For all authenticated users)
  const createReportMutation = useMutation({
    mutationFn: async (payload: CreateReportPayload) => {
      const { data } = await api.post<{ success: boolean; report: Report }>('/reports', payload);
      return data.report;
    },
    onSuccess: () => {
      // Invalidate current list data to fetch the new report cleanly
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  // 3. Update Status Mutation (For Admins - e.g., 'resolved', 'dismissed')
  const updateStatusMutation = useMutation({
    mutationFn: async ({ reportId, status }: { reportId: string; status: ReportStatus }) => {
      const { data } = await api.patch<{ success: boolean; report: Report }>(
        `/reports/${reportId}/status`,
        { status }
      );
      return data.report;
    },
    onSuccess: (updatedReport) => {
      // Refresh the report listings array securely
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      // Update individual report data key specifically if referenced
      queryClient.setQueryData(['report', updatedReport._id], updatedReport);
    },
  });

  return {
    // Query data streams
    reportsData: reportsQuery.data,
    reports: reportsQuery.data?.reports || [],
    isLoadingReports: reportsQuery.isLoading,
    isReportsError: reportsQuery.isError,
    refetchReports: reportsQuery.refetch,

    // Mutation triggers
    createReport: createReportMutation.mutate,
    isCreatingReport: createReportMutation.isPending,
    createReportError: createReportMutation.error,

    updateReportStatus: updateStatusMutation.mutate,
    isUpdatingStatus: updateStatusMutation.isPending,
    updatingReportId: updateStatusMutation.isPending ? updateStatusMutation.variables?.reportId : null,
  };
};

export default useReports;
