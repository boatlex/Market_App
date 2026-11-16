import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Report, ReportTargetType, ReportReason, ReportStatus } from '../types';

interface FetchMyReportsResponse {
  success: boolean;
  reports: Report[];
  pagination: {
    totalReports: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

interface FetchMyReportsParams {
  page: number;
  limit?: number;
  status?: ReportStatus;
}

export interface CreateReportPayload {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description?: string;
}

const useReports = (params?: FetchMyReportsParams) => {
  const queryClient = useQueryClient();
  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const status = params?.status;

  // 1. Fetch Current User's Submitted Reports (Only runs when params are passed)
  const myReportsQuery = useQuery<FetchMyReportsResponse>({
    queryKey: ['my-reports', { page, status, limit }],
    queryFn: async () => {
      const { data } = await api.get<FetchMyReportsResponse>('/reports', {
        params: { page, limit, status },
      });
      return data;
    },
    enabled: !!params,
    placeholderData: (previousData) => previousData,
  });

  // 2. Submit New Report Mutation
  const createReportMutation = useMutation({
    mutationFn: async (payload: CreateReportPayload) => {
      const { data } = await api.post<{ success: boolean; message?: string; report: Report }>(
        '/reports',
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reports'] });
    },
  });

  return {
    // User's submitted reports stream
    reportsData: myReportsQuery.data,
    reports: myReportsQuery.data?.reports || [],
    pagination: myReportsQuery.data?.pagination,
    isLoadingReports: myReportsQuery.isLoading,
    isReportsError: myReportsQuery.isError,
    refetchReports: myReportsQuery.refetch,

    // Submit report actions
    createReport: createReportMutation.mutate,
    createReportAsync: createReportMutation.mutateAsync,
    isCreatingReport: createReportMutation.isPending,
    createReportError: createReportMutation.error,
    resetCreateReport: createReportMutation.reset,
  };
};

export default useReports;
