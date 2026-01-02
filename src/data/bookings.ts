import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { API_ENDPOINTS } from "./endpoints";
import type {
  ApiResponse,
  FacilityBooking,
  BookingStatus,
  PaymentMethod,
  FacilityType,
  PaginatedResponse,
} from "../types";

export interface BookingFilters {
  date?: string;
  start_date?: string;
  end_date?: string;
  facility_id?: number | string;
  facility_type?: FacilityType;
  status?: BookingStatus;
  page?: number;
}

const buildQueryString = (filters?: BookingFilters) => {
  if (!filters) return "";
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, value.toString());
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

export const useBookings = (filters?: BookingFilters) => {
  return useQuery({
    queryKey: ["bookings", filters],
    queryFn: async () => {
      const response = await api.get<
        ApiResponse<PaginatedResponse<FacilityBooking>>
      >(`${API_ENDPOINTS.FACILITY_BOOKINGS}${buildQueryString(filters)}`);
      return response.data;
    },
  });
};

export const useBooking = (id: number | string | null) => {
  return useQuery({
    queryKey: ["booking", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.get<ApiResponse<FacilityBooking>>(
        `${API_ENDPOINTS.FACILITY_BOOKINGS}/${id}`
      );
      return response.data;
    },
    enabled: !!id,
  });
};

export interface CreateBookingPayload {
  facility_id: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  payment_method: PaymentMethod;
  notes?: string;
}

export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBookingPayload) => {
      const response = await api.post<ApiResponse<FacilityBooking>>(
        API_ENDPOINTS.FACILITY_BOOKINGS,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
  });
};

export const useUpdateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<CreateBookingPayload> & { id: number }) => {
      const response = await api.put<ApiResponse<FacilityBooking>>(
        `${API_ENDPOINTS.FACILITY_BOOKINGS}/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
};

export const useDeleteBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<ApiResponse<null>>(
        `${API_ENDPOINTS.FACILITY_BOOKINGS}/${id}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
};

export const useConfirmBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<ApiResponse<FacilityBooking>>(
        `${API_ENDPOINTS.FACILITY_BOOKINGS}/${id}/confirm`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<ApiResponse<FacilityBooking>>(
        `${API_ENDPOINTS.FACILITY_BOOKINGS}/${id}/cancel`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
};
