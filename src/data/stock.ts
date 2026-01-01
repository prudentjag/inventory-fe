import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { API_ENDPOINTS } from "./endpoints";
import type { ApiResponse, Stock } from "../types";

export interface AddStockPayload {
  product_id: number;
  quantity: number;
  low_stock_threshold?: number;
  batch_number?: string;
}

export interface UpdateStockPayload {
  quantity?: number;
  low_stock_threshold?: number;
  batch_number?: string;
}

// Fetch all central stock
export const useStock = () => {
  return useQuery({
    queryKey: ["stock"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Stock[]>>(API_ENDPOINTS.STOCK);
      return response.data.data;
    },
  });
};

// Add stock to central warehouse
export const useAddStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddStockPayload) => {
      const response = await api.post<ApiResponse<Stock>>(
        API_ENDPOINTS.STOCK,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
  });
};

// Update stock entry
export const useUpdateStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateStockPayload;
    }) => {
      const response = await api.put<ApiResponse<Stock>>(
        `${API_ENDPOINTS.STOCK}/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
  });
};

// Delete stock entry
export const useDeleteStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<ApiResponse<null>>(
        `${API_ENDPOINTS.STOCK}/${id}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
  });
};
