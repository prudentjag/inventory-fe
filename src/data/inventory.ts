import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { API_ENDPOINTS } from "./endpoints";
import type { ApiResponse, InventoryItem } from "../types";

export interface AddInventoryPayload {
  unit_id: string | number;
  product_id: string | number;
  quantity: number;
  low_stock_threshold?: number;
}

export const addInventory = async (data: AddInventoryPayload) => {
  const response = await api.post<ApiResponse<any>>(
    API_ENDPOINTS.INVENTORY,
    data
  );
  return response.data;
};

export const useInventory = (unitId?: string | number) => {
  return useQuery({
    queryKey: ["inventory", unitId],
    queryFn: async () => {
      if (!unitId) return null;
      const response = await api.get<ApiResponse<InventoryItem[]>>(
        `${API_ENDPOINTS.INVENTORY}?unit_id=${unitId}`
      );
      return response.data;
    },
    enabled: !!unitId,
  });
};

export const useAddInventory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addInventory,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["inventory", variables.unit_id],
      });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};
