import { useQuery } from "@tanstack/react-query";
import api from "../services/api";
import { API_ENDPOINTS } from "./endpoints";
import type { ApiResponse, AuditLog } from "../types";

export const useAuditLogs = (params?: {
  action?: string;
  product_id?: number;
}) => {
  return useQuery({
    queryKey: ["audit-logs", params],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>(
        API_ENDPOINTS.AUDIT_LOGS,
        {
          params,
        }
      );
      // Handle both direct array and paginated response
      const data = response.data.data;
      return Array.isArray(data) ? data : data?.data || [];
    },
  });
};

export const useResourceAuditLogs = (type: string, id: number | string) => {
  return useQuery({
    queryKey: ["audit-logs", type, id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>(
        `${API_ENDPOINTS.AUDIT_LOGS}/${type}/${id}`
      );
      // Handle both direct array and paginated response
      const data = response.data.data;
      return Array.isArray(data) ? data : data?.data || [];
    },
    enabled: !!type && !!id,
  });
};
