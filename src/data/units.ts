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

export const assignStaffToUnit = async ({ unitId, userId }: { unitId: number | string; userId: number | string }) => {
    const response = await api.post<ApiResponse<any>>(`${API_ENDPOINTS.UNITS}/${unitId}/users`, { user_id: userId });
    return response.data;
};

// Hooks
export const useUnits = () => {
    return useQuery({
        queryKey: ['units'],
        queryFn: async () => {
            try {
                const result = await getUnits();
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

export const useAssignStaff = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: assignStaffToUnit,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['units'] });
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
};
