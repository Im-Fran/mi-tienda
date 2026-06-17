import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  listShippingMethods,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
} from "@/api/endpoints/shipping"

export function useShippingMethods(storeId: string) {
  return useQuery({
    queryKey: ["stores", storeId, "shipping"],
    queryFn: async () => {
      const data = await listShippingMethods(storeId)
      return data.methods
    },
    enabled: !!storeId,
    staleTime: 30_000,
  })
}

export function useCreateShippingMethod(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof createShippingMethod>[1]) =>
      createShippingMethod(storeId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stores", storeId, "shipping"] }),
  })
}

export function useUpdateShippingMethod(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateShippingMethod>[2] }) =>
      updateShippingMethod(storeId, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stores", storeId, "shipping"] }),
  })
}

export function useDeleteShippingMethod(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteShippingMethod(storeId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stores", storeId, "shipping"] }),
  })
}
