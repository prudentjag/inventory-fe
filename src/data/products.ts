import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { API_ENDPOINTS } from "./endpoints";
import type { ApiResponse, Product } from "../types";

export const createProduct = async (data: Partial<Product>) => {
  const response = await api.post<ApiResponse<Product>>(
    API_ENDPOINTS.PRODUCTS,
    data
  );
  return response.data;
};

// Product Hooks
export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      try {
        const response = await api.get<ApiResponse<Product[]>>(
          API_ENDPOINTS.PRODUCTS
        );
        return response.data.data || [];
      } catch (e) {
        console.error("Failed to fetch products", e);
        return [];
      }
    },
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};
