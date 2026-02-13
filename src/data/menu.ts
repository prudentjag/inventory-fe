import { useQuery, useMutation } from "@tanstack/react-query";
import api from "../services/api";
import { API_ENDPOINTS } from "./endpoints";

export interface MenuItem {
  id: number;
  name: string;
  brand: string;
  category: string;
  price: number;
  available_quantity: number;
  image?: string;
  selling_price?: number; // For compatibility
}

export interface MenuData {
  unit_name: string;
  menu: MenuItem[];
}

export interface GuestOrderPayload {
  unit_id: number;
  items: {
    product_id: number;
    quantity: number;
  }[];
  customer_name?: string;
}

export interface GuestOrderResponse {
  invoice_number: string;
  total_amount: number;
  status: string;
}

export function useMenu(unitId: number | string) {
  return useQuery<MenuData>({
    queryKey: ["menu", unitId],
    queryFn: async () => {
      const response = await api.get(`${API_ENDPOINTS.MENU}/${unitId}`);
      return response.data.data;
    },
    enabled: !!unitId,
  });
}

export function usePlaceGuestOrder() {
  return useMutation({
    mutationFn: async (payload: GuestOrderPayload) => {
      const response = await api.post(API_ENDPOINTS.MENU_ORDER, payload);
      return response.data.data as GuestOrderResponse;
    },
  });
}
