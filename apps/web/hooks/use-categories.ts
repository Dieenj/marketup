import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api, { getErrorMessage } from '@/lib/api-client';

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface CategoryInput {
  name: string;
  slug: string;
}

const categoriesQueryKey = (shopId: string | undefined) => ['categories', shopId] as const;

// Danh mục của shop — dùng chung cho trang Products và các dialog sản phẩm
export function useCategories(
  shopId: string | undefined,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: categoriesQueryKey(shopId),
    queryFn: async () => {
      const { data } = await api.get<Category[]>(`/categories/shop/${shopId}`);
      return data;
    },
    enabled: enabled && !!shopId,
  });
}

export function useCreateCategory(
  shopId: string | undefined,
  { onSuccess }: { onSuccess?: () => void } = {},
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CategoryInput) => api.post(`/categories/${shopId}`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesQueryKey(shopId) });
      toast.success('Category created');
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to create category'));
    },
  });
}

export function useDeleteCategory(
  shopId: string | undefined,
  { onSuccess }: { onSuccess?: (id: string) => void } = {},
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: categoriesQueryKey(shopId) });
      // API đặt categoryId của các sản phẩm thuộc danh mục này về null → làm mới danh sách sản phẩm
      queryClient.invalidateQueries({ queryKey: ['products', shopId] });
      toast.success('Category deleted');
      onSuccess?.(id);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to delete category'));
    },
  });
}
