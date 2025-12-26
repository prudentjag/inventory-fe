import { useQuery } from "@tanstack/react-query";
import api from "../services/api";
import { API_ENDPOINTS } from "./endpoints";
import type { ApiResponse, DashboardStats } from "../types";

// Service
export const getDashboardStats = async () => {
    const response = await api.get<ApiResponse<DashboardStats>>(API_ENDPOINTS.DASHBOARD_STATS);
    return response.data;
};

// Hook
export const useDashboardStats = () => {
    return useQuery({
        queryKey: ['dashboardStats'],
        queryFn: getDashboardStats,
    });
};
