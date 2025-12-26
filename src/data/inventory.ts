import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { API_ENDPOINTS } from "./endpoints";
import type { ApiResponse } from "../types";

export interface AddInventoryPayload {
    unit_id: string;
    product_id: string;
    quantity: number;
}

export const addInventory = async (data: AddInventoryPayload) => {
    const response = await api.post<ApiResponse<any>>(API_ENDPOINTS.INVENTORY, data);
    return response.data;
};

// Placeholder for future implementation
export const useInventory = (unitId?: string) => {
    return useQuery({
        queryKey: ['inventory', unitId],
        queryFn: async () => {
            if (!unitId) return null;
            const response = await api.get(`${API_ENDPOINTS.INVENTORY}?unit_id=${unitId}`);
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
            queryClient.invalidateQueries({ queryKey: ['inventory', variables.unit_id] });
            queryClient.invalidateQueries({ queryKey: ['products'] }); // Stock levels might update in product list too
        },
    });
};
