import { useQuery } from "@tanstack/react-query"
import {
  getStatsSummary,
  getTopProducts,
  getOrdersByStatus,
  getRevenueOverTime,
} from "@/api/endpoints/stats"

interface StatsParams {
  from?: string
  to?: string
}

export function useStatsSummary(storeId: string, params: StatsParams = {}) {
  return useQuery({
    queryKey: ["stores", storeId, "stats", "summary", params],
    queryFn: () => getStatsSummary(storeId, params),
    enabled: !!storeId,
    staleTime: 60_000,
  })
}

export function useTopProducts(storeId: string, params: StatsParams = {}) {
  return useQuery({
    queryKey: ["stores", storeId, "stats", "top-products", params],
    queryFn: () => getTopProducts(storeId, params),
    enabled: !!storeId,
    staleTime: 60_000,
  })
}

export function useOrdersByStatus(storeId: string, params: StatsParams = {}) {
  return useQuery({
    queryKey: ["stores", storeId, "stats", "orders-by-status", params],
    queryFn: () => getOrdersByStatus(storeId, params),
    enabled: !!storeId,
    staleTime: 60_000,
  })
}

export function useRevenueOverTime(storeId: string, params: StatsParams = {}) {
  return useQuery({
    queryKey: ["stores", storeId, "stats", "revenue-over-time", params],
    queryFn: () => getRevenueOverTime(storeId, params),
    enabled: !!storeId,
    staleTime: 60_000,
  })
}
