import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { API_ENDPOINTS } from "./endpoints";
import type { ApiResponse, Facility, FacilityType } from "../types";

export interface FacilityFilters {
  type?: FacilityType;
}

export const useFacilities = (filters?: FacilityFilters) => {
  return useQuery({
    queryKey: ["facilities", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.type) params.append("type", filters.type);
      const qs = params.toString();
      const response = await api.get<ApiResponse<Facility[]>>(
        `${API_ENDPOINTS.FACILITIES}${qs ? `?${qs}` : ""}`
      );
      return response.data;
    },
  });
};

export const useFacility = (id: number | string | null) => {
  return useQuery({
    queryKey: ["facility", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.get<ApiResponse<Facility>>(
        `${API_ENDPOINTS.FACILITIES}/${id}`
      );
      return response.data;
    },
    enabled: !!id,
  });
};

export const useFacilityTypes = () => {
  return useQuery({
    queryKey: ["facility-types"],
    queryFn: async () => {
      const response = await api.get<
        ApiResponse<{ value: string; label: string }[]>
      >(API_ENDPOINTS.FACILITY_TYPES);
      return response.data;
    },
  });
};

export interface FacilityAvailabilityResponse {
  facility: Facility;
  date: string;
  operating_hours: {
    open: string;
    close: string;
  };
  booked_slots: {
    start_time: string;
    end_time: string;
  }[];
  hourly_rate: string;
}

export const useFacilityAvailability = (
  id: number | string | null,
  date: string | null
) => {
  return useQuery({
    queryKey: ["facility-availability", id, date],
    queryFn: async () => {
      if (!id || !date) return null;
      const response = await api.get<ApiResponse<FacilityAvailabilityResponse>>(
        `${API_ENDPOINTS.FACILITIES}/${id}/availability?date=${date}`
      );
      return response.data;
    },
    enabled: !!id && !!date,
  });
};

export interface CreateFacilityPayload {
  name: string;
  type: FacilityType;
  description?: string;
  hourly_rate: number;
  capacity?: number;
  unit_id: number;
  is_active?: boolean;
}

export const useCreateFacility = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateFacilityPayload) => {
      const response = await api.post<ApiResponse<Facility>>(
        API_ENDPOINTS.FACILITIES,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facilities"] });
    },
  });
};

export const useUpdateFacility = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: CreateFacilityPayload & { id: number }) => {
      const response = await api.put<ApiResponse<Facility>>(
        `${API_ENDPOINTS.FACILITIES}/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facilities"] });
    },
  });
};

export const useDeleteFacility = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<ApiResponse<null>>(
        `${API_ENDPOINTS.FACILITIES}/${id}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facilities"] });
    },
  });
};
