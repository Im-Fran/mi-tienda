import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  listPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from "@/api/endpoints/payments"

export function usePaymentMethods(storeId: string) {
  return useQuery({
    queryKey: ["stores", storeId, "payments"],
    queryFn: async () => {
      const data = await listPaymentMethods(storeId)
      return data.methods
    },
    enabled: !!storeId,
    staleTime: 30_000,
  })
}

export function useCreatePaymentMethod(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof createPaymentMethod>[1]) =>
      createPaymentMethod(storeId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stores", storeId, "payments"] }),
  })
}

export function useUpdatePaymentMethod(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updatePaymentMethod>[2] }) =>
      updatePaymentMethod(storeId, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stores", storeId, "payments"] }),
  })
}

export function useDeletePaymentMethod(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePaymentMethod(storeId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stores", storeId, "payments"] }),
  })
}
