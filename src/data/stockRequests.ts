import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { API_ENDPOINTS } from "./endpoints";
import type { ApiResponse, StockRequest, StockRequestStatus } from "../types";

export interface CreateStockRequestPayload {
  unit_id: number;
  product_id: number;
  quantity: number;
  notes?: string;
}

export interface RejectRequestPayload {
  notes?: string;
}

// Fetch stock requests with optional status filter
export const useStockRequests = (status?: StockRequestStatus) => {
  return useQuery({
    queryKey: ["stock-requests", status],
    queryFn: async () => {
      const url = status
        ? `${API_ENDPOINTS.STOCK_REQUESTS}?status=${status}`
        : API_ENDPOINTS.STOCK_REQUESTS;
      const response = await api.get<ApiResponse<StockRequest[]>>(url);
      return response.data.data;
    },
  });
};

// Fetch single stock request
export const useStockRequest = (id: number) => {
  return useQuery({
    queryKey: ["stock-requests", id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<StockRequest>>(
        `${API_ENDPOINTS.STOCK_REQUESTS}/${id}`
      );
      return response.data.data;
    },
    enabled: !!id,
  });
};

// Create a stock request (for unit managers)
export const useCreateStockRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateStockRequestPayload) => {
      const response = await api.post<ApiResponse<StockRequest>>(
        API_ENDPOINTS.STOCK_REQUESTS,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-requests"] });
    },
  });
};

// Approve stock request (stockist/admin only)
export const useApproveRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<ApiResponse<StockRequest>>(
        `${API_ENDPOINTS.STOCK_REQUESTS}/${id}/approve`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-requests"] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
};

// Reject stock request (stockist/admin only)
export const useRejectRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data?: RejectRequestPayload;
    }) => {
      const response = await api.post<ApiResponse<StockRequest>>(
        `${API_ENDPOINTS.STOCK_REQUESTS}/${id}/reject`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-requests"] });
    },
  });
};
