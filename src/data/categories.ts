import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { API_ENDPOINTS } from "./endpoints";
import type { ApiResponse, Category } from "../types";

export interface CreateCategoryPayload {
  name: string;
  description?: string;
}

export interface UpdateCategoryPayload {
  id: number;
  data: Partial<CreateCategoryPayload>;
}

// API Functions
export const getCategories = async () => {
  const response = await api.get<ApiResponse<Category[]>>(
    API_ENDPOINTS.CATEGORIES
  );
  return response.data;
};

export const createCategory = async (data: CreateCategoryPayload) => {
  const response = await api.post<ApiResponse<Category>>(
    API_ENDPOINTS.CATEGORIES,
    data
  );
  return response.data;
};

export const updateCategory = async ({ id, data }: UpdateCategoryPayload) => {
  const response = await api.put<ApiResponse<Category>>(
    `${API_ENDPOINTS.CATEGORIES}/${id}`,
    data
  );
  return response.data;
};

export const deleteCategory = async (id: number) => {
  const response = await api.delete<ApiResponse<any>>(
    `${API_ENDPOINTS.CATEGORIES}/${id}`
  );
  return response.data;
};

// Hooks
export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const result = await getCategories();
        return result.data || [];
      } catch (e) {
        console.error("Failed to fetch categories", e);
        return [];
      }
    },
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
};
