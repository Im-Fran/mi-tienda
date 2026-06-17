import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  listCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "@/api/endpoints/coupons"

export function useCoupons(storeId: string, page = 1, perPage = 20) {
  return useQuery({
    queryKey: ["stores", storeId, "coupons", { page, perPage }],
    queryFn: () => listCoupons(storeId, page, perPage),
    enabled: !!storeId,
    staleTime: 30_000,
  })
}

export function useCoupon(storeId: string, id: string) {
  return useQuery({
    queryKey: ["stores", storeId, "coupons", id],
    queryFn: async () => {
      const data = await getCoupon(storeId, id)
      return data.coupon
    },
    enabled: !!storeId && !!id,
    staleTime: 60_000,
  })
}

export function useCreateCoupon(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof createCoupon>[1]) =>
      createCoupon(storeId, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["stores", storeId, "coupons"] }),
  })
}

export function useUpdateCoupon(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateCoupon>[2] }) =>
      updateCoupon(storeId, id, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["stores", storeId, "coupons"] }),
  })
}

export function useDeleteCoupon(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCoupon(storeId, id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["stores", storeId, "coupons"] }),
  })
}
