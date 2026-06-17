import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  listOrders,
  getOrder,
  updateOrderStatus,
  type ListOrdersParams,
} from "@/api/endpoints/orders"
import type { OrderStatus } from "@/api/types"

export function useOrders(storeId: string, params: ListOrdersParams = {}) {
  return useQuery({
    queryKey: ["stores", storeId, "orders", params],
    queryFn: () => listOrders(storeId, params),
    enabled: !!storeId,
    staleTime: 30_000,
  })
}

export function useOrder(storeId: string, id: string) {
  return useQuery({
    queryKey: ["stores", storeId, "orders", id],
    queryFn: async () => {
      const data = await getOrder(storeId, id)
      return data.order
    },
    enabled: !!storeId && !!id,
    staleTime: 60_000,
  })
}

export function useUpdateOrderStatus(storeId: string, id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (status: OrderStatus) => updateOrderStatus(storeId, id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stores", storeId, "orders"] })
      qc.invalidateQueries({ queryKey: ["stores", storeId, "orders", id] })
    },
  })
}
