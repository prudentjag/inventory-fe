import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { API_ENDPOINTS } from "./endpoints";
import type {
  ApiResponse,
  FacilityTicket,
  TicketStatus,
  PaymentMethod,
  PaginatedResponse,
} from "../types";

export interface TicketFilters {
  date?: string;
  start_date?: string;
  end_date?: string;
  facility_id?: number | string;
  status?: TicketStatus;
  page?: number;
}

const buildQueryString = (filters?: TicketFilters) => {
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

export const useTickets = (filters?: TicketFilters) => {
  return useQuery({
    queryKey: ["tickets", filters],
    queryFn: async () => {
      const response = await api.get<
        ApiResponse<PaginatedResponse<FacilityTicket>>
      >(`${API_ENDPOINTS.FACILITY_TICKETS}${buildQueryString(filters)}`);
      return response.data;
    },
  });
};

export const useTicket = (id: number | string | null) => {
  return useQuery({
    queryKey: ["ticket", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.get<ApiResponse<FacilityTicket>>(
        `${API_ENDPOINTS.FACILITY_TICKETS}/${id}`
      );
      return response.data;
    },
    enabled: !!id,
  });
};

export interface CreateTicketPayload {
  facility_id: number;
  customer_name: string;
  customer_phone: string;
  ticket_date: string;
  check_in_time: string;
  amount: number;
  payment_method: PaymentMethod;
  notes?: string;
}

export const useCreateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTicketPayload) => {
      const response = await api.post<ApiResponse<FacilityTicket>>(
        API_ENDPOINTS.FACILITY_TICKETS,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket-stats"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
  });
};

export const useUpdateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<CreateTicketPayload> & { id: number }) => {
      const response = await api.put<ApiResponse<FacilityTicket>>(
        `${API_ENDPOINTS.FACILITY_TICKETS}/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
};

export const useRefundTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<ApiResponse<FacilityTicket>>(
        `${API_ENDPOINTS.FACILITY_TICKETS}/${id}/refund`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket-stats"] });
    },
  });
};

export interface TicketStatsFilters {
  date?: string;
  facility_id?: number | string;
}

export interface TicketStatsResponse {
  total_tickets: number;
  total_revenue: number;
  payment_breakdown: {
    payment_method: PaymentMethod;
    count: number;
    amount: number;
  }[];
}

export const useTicketStats = (filters?: TicketStatsFilters) => {
  return useQuery({
    queryKey: ["ticket-stats", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.date) params.append("date", filters.date);
      if (filters?.facility_id)
        params.append("facility_id", filters.facility_id.toString());
      const qs = params.toString();
      const response = await api.get<ApiResponse<TicketStatsResponse>>(
        `${API_ENDPOINTS.FACILITY_TICKETS_STATS}${qs ? `?${qs}` : ""}`
      );
      return response.data;
    },
    enabled: !!filters?.date,
  });
};
