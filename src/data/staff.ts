import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { API_ENDPOINTS } from "./endpoints";
import type { ApiResponse, CreateStaffPayload, User } from "../types";

// Service
export const createStaff = async (data: CreateStaffPayload) => {
    const response = await api.post<ApiResponse<User>>(API_ENDPOINTS.REGISTER, data);
    return response.data;
};

export const getUsers = async () => {
    const response = await api.get<ApiResponse<User[]>>(API_ENDPOINTS.USERS);
    return response.data;
};

export const updateUser = async ({ id, data }: { id: string; data: Partial<User> }) => {
    const response = await api.put<ApiResponse<User>>(`${API_ENDPOINTS.USERS}/${id}`, data);
    return response.data;
};

// Hook
// export const useCreateStaff = () => {
//     const queryClient = useQueryClient();

//     return useMutation({
export const useCreateStaff = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createStaff,
        onSuccess: () => {
            // Invalidate queries that might list staff users (e.g., if we had a users list)
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
};

export const useUsers = () => {
    return useQuery({
        queryKey: ['users'],
        queryFn: getUsers,
    });
};

export const useUpdateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
};
