import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { API_ENDPOINTS } from "./endpoints";
import type {
  ApiResponse,
  Sale,
  PaymentMethod,
  PaymentStatus,
  PaginatedResponse,
} from "../types";

export interface SaleFilters {
  start_date?: string;
  end_date?: string;
  payment_method?: PaymentMethod;
  payment_status?: PaymentStatus;
  unit_id?: string | number;
  user_id?: string | number;
  page?: number;
}

const buildQueryString = (filters?: SaleFilters) => {
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

export const useSales = (filters?: SaleFilters) => {
  return useQuery({
    queryKey: ["sales", filters],
    queryFn: async () => {
      const response = await api.get<ApiResponse<PaginatedResponse<Sale>>>(
        `${API_ENDPOINTS.SALES}${buildQueryString(filters)}`
      );
      return response.data;
    },
  });
};

export const useUnitSales = (
  unitId: string | number,
  filters?: SaleFilters
) => {
  return useQuery({
    queryKey: ["sales", "unit", unitId, filters],
    queryFn: async () => {
      if (!unitId) return null;
      const response = await api.get<ApiResponse<Sale[]>>(
        `${API_ENDPOINTS.SALES_HISTORY}/${unitId}${buildQueryString(filters)}`
      );
      return response.data;
    },
    enabled: !!unitId,
  });
};

export const useMySales = (filters?: SaleFilters) => {
  return useQuery({
    queryKey: ["sales", "personal", filters],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Sale[]>>(
        `${API_ENDPOINTS.MY_SALES}${buildQueryString(filters)}`
      );
      return response.data;
    },
  });
};
export interface CreateSalePayload {
  unit_id: number | string;
  payment_method: PaymentMethod;
  redirect_url?: string;
  items: {
    product_id: number | string;
    quantity: number;
    unit_price: number;
  }[];
}

export const useCreateSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSalePayload) => {
      const response = await api.post<ApiResponse<Sale>>(
        API_ENDPOINTS.SALES,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
};

export interface PaymentVerificationResponse {
  status: string;
  message: string;
  data: {
    payment_status: "pending" | "paid" | "completed" | "failed";
    sale?: Sale;
  };
}

export const useVerifyPayment = (
  invoiceNumber: string | null,
  options?: { enabled?: boolean; refetchInterval?: number }
) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["verify-payment", invoiceNumber],
    queryFn: async () => {
      if (!invoiceNumber) return null;
      const response = await api.get<PaymentVerificationResponse>(
        `${API_ENDPOINTS.SALES}/${invoiceNumber}/verify-payment`
      );
      return response.data;
    },
    enabled: !!invoiceNumber && (options?.enabled ?? true),
    refetchInterval: (query) => {
      const data = query.state.data;
      // Stop polling once payment is confirmed or failed
      if (
        data?.data?.payment_status === "paid" ||
        data?.data?.payment_status === "completed" ||
        data?.data?.payment_status === "failed"
      ) {
        // Invalidate related queries on confirmation
        if (
          data?.data?.payment_status === "paid" ||
          data?.data?.payment_status === "completed"
        ) {
          queryClient.invalidateQueries({ queryKey: ["sales"] });
          queryClient.invalidateQueries({ queryKey: ["inventory"] });
        }
        return false;
      }
      return options?.refetchInterval ?? 5000; // Default 5 seconds
    },
  });
};
