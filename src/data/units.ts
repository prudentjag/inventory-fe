import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { API_ENDPOINTS } from "./endpoints";
import type { ApiResponse, Unit } from "../types";

export interface CreateUnitPayload {
    name: string;
    type: Unit["type"];
    address?: string;
}

export const getUnits = async () => {
    const response = await api.get<ApiResponse<Unit[]>>(API_ENDPOINTS.UNITS);
    return response.data;
};

export const createUnit = async (data: CreateUnitPayload) => {
    const response = await api.post<ApiResponse<Unit>>(API_ENDPOINTS.UNITS, data);
    return response.data;
};

// Hooks
export const useUnits = () => {
    return useQuery({
        queryKey: ['units'],
        queryFn: async () => {
            try {
                const result = await getUnits();
                // Handle case where API might return array directly or wrapped
                // Based on other endpoints, it's wrapped in `data`.
                // If the API returns `ApiResponse<Unit[]>`, getting `.data` in getUnits returns the wrapper if axios unwraps.
                // Wait, `api.ts` axios interceptor doesn't unwrap `data` automatically?
                // Let's check `api.ts` again.
                // If `api.get` returns `AxiosResponse`, `response.data` is the body.
                // So `getUnits` returns the body `ApiResponse<Unit[]>`.
                // But `useUnits` usually expects the data array directly for easy mapping?
                // No, standard is to return the full response or just the array.
                // Let's standardise on returning the array.
                return result.data || [];
            } catch (e) {
                console.error("Failed to fetch units", e);
                return [];
            }
        },
    });
};

export const useCreateUnit = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createUnit,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['units'] });
        },
    });
};
