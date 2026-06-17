import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/api/endpoints/categories"

export function useCategories(storeId: string) {
  return useQuery({
    queryKey: ["stores", storeId, "categories"],
    queryFn: async () => {
      const data = await listCategories(storeId)
      return data.categories
    },
    enabled: !!storeId,
    staleTime: 30_000,
  })
}

export function useCreateCategory(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof createCategory>[1]) =>
      createCategory(storeId, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["stores", storeId, "categories"] }),
  })
}

export function useUpdateCategory(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateCategory>[2] }) =>
      updateCategory(storeId, id, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["stores", storeId, "categories"] }),
  })
}

export function useDeleteCategory(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, recursive }: { id: string; recursive?: boolean }) =>
      deleteCategory(storeId, id, recursive),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["stores", storeId, "categories"] }),
  })
}
