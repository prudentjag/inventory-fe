import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { API_ENDPOINTS } from "./endpoints";
import type { ApiResponse, Brand } from "../types";

export interface CreateBrandPayload {
  name: string;
  category_id?: number;
  image?: File | null;
  items_per_set?: number;
}

export interface UpdateBrandPayload {
  id: number;
  data: Partial<CreateBrandPayload>;
}

// API Functions
export const getBrands = async () => {
  const response = await api.get<ApiResponse<Brand[]>>(API_ENDPOINTS.BRANDS);
  return response.data;
};

export const createBrand = async (data: CreateBrandPayload) => {
  const formData = new FormData();
  formData.append("name", data.name);
  if (data.category_id) {
    formData.append("category_id", String(data.category_id));
  }
  if (data.image) {
    formData.append("image", data.image);
  }
  if (data.items_per_set) {
    formData.append("items_per_set", String(data.items_per_set));
  }

  const response = await api.post<ApiResponse<Brand>>(
    API_ENDPOINTS.BRANDS,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

export const updateBrand = async ({ id, data }: UpdateBrandPayload) => {
  const formData = new FormData();
  if (data.name) {
    formData.append("name", data.name);
  }
  if (data.category_id) {
    formData.append("category_id", String(data.category_id));
  }
  if (data.image) {
    formData.append("image", data.image);
  }
  if (data.items_per_set) {
    formData.append("items_per_set", String(data.items_per_set));
  } 
  // Laravel requires _method for PUT with FormData
  formData.append("_method", "PUT");

  const response = await api.post<ApiResponse<Brand>>(
    `${API_ENDPOINTS.BRANDS}/${id}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

export const deleteBrand = async (id: number) => {
  const response = await api.delete<ApiResponse<any>>(
    `${API_ENDPOINTS.BRANDS}/${id}`
  );
  return response.data;
};

// Hooks
export const useBrands = () => {
  return useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      try {
        const result = await getBrands();
        return result.data || [];
      } catch (e) {
        console.error("Failed to fetch brands", e);
        return [];
      }
    },
  });
};

export const useCreateBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
  });
};

export const useUpdateBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
  });
};

export const useDeleteBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
  });
};
