import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { API_ENDPOINTS } from "./endpoints";
import type { ApiResponse, DailyReport, PaginatedResponse } from "../types";

export interface DailyReportFilters {
  unit_id?: number | string;
  page?: number;
}

const buildQueryString = (filters?: DailyReportFilters) => {
  if (!filters) return "";
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, value.toString());
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

// List daily reports for a unit
export const useDailyReports = (
  filters?: DailyReportFilters,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: ["daily-reports", filters],
    queryFn: async () => {
      const response = await api.get<
        ApiResponse<PaginatedResponse<DailyReport>>
      >(`${API_ENDPOINTS.DAILY_REPORTS}${buildQueryString(filters)}`);
      return response.data;
    },
    enabled: options?.enabled ?? true,
  });
};

// Get single daily report with items
export const useDailyReport = (
  id: number | string | null,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: ["daily-report", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.get<ApiResponse<DailyReport>>(
        `${API_ENDPOINTS.DAILY_REPORTS}/${id}`,
      );
      return response.data;
    },
    enabled: !!id && (options?.enabled ?? true),
  });
};

// Generate daily report payload
export interface GenerateDailyReportPayload {
  unit_id: number;
  date?: string;
  damages?: Record<number, number>; // { product_id: damage_count }
  remark?: string;
}

// Generate daily report mutation
export const useGenerateDailyReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: GenerateDailyReportPayload) => {
      const response = await api.post<ApiResponse<DailyReport>>(
        `${API_ENDPOINTS.DAILY_REPORTS}/generate`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-reports"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
};

// Update remark payload
export interface UpdateRemarkPayload {
  id: number;
  remark: string;
}

// Update daily report remark
export const useUpdateDailyReportRemark = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, remark }: UpdateRemarkPayload) => {
      const response = await api.patch<ApiResponse<DailyReport>>(
        `${API_ENDPOINTS.DAILY_REPORTS}/${id}/remark`,
        { remark },
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["daily-report", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["daily-reports"] });
    },
  });
};

// Check if report exists for today
export const useTodayReport = (
  unitId: number | undefined,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: ["daily-reports", "today", unitId],
    queryFn: async () => {
      if (!unitId) return null;
      const today = new Date().toISOString().split("T")[0];
      const response = await api.get<
        ApiResponse<PaginatedResponse<DailyReport>>
      >(`${API_ENDPOINTS.DAILY_REPORTS}?unit_id=${unitId}`);
      // Check if any report is from today
      const reports = response.data.data?.data || [];
      return reports.find((r) => r.date === today) || null;
    },
    enabled: !!unitId && (options?.enabled ?? true),
  });
};
