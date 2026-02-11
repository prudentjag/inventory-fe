import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { API_ENDPOINTS } from "./endpoints";
import type { ApiResponse, Product } from "../types";

export interface UpdateProductPayload {
  id: number | string;
  data: Partial<Product>;
}

export const createProduct = async (data: Partial<Product>) => {
  const response = await api.post<ApiResponse<Product>>(
    API_ENDPOINTS.PRODUCTS,
    data,
  );
  return response.data;
};

export const updateProduct = async ({ id, data }: UpdateProductPayload) => {
  const response = await api.put<ApiResponse<Product>>(
    `${API_ENDPOINTS.PRODUCTS}/${id}`,
    data,
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
          API_ENDPOINTS.PRODUCTS,
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

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const deleteProduct = async (id: number | string) => {
  const response = await api.delete<ApiResponse<void>>(
    `${API_ENDPOINTS.PRODUCTS}/${id}`,
  );
  return response.data;
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

// Hook for fetching only unit-produced products (for UnitPOS)
export const useUnitProducedProducts = () => {
  const { data: products, ...rest } = useProducts();
  const unitProducedProducts =
    products?.filter((p) => p.source_type === "unit_produced") || [];
  return { data: unitProducedProducts, ...rest };
};
