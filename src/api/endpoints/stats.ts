import { apiClient } from '@/api/client'
import type {
  StatsSummary,
  TopProduct,
  OrdersByStatus,
  RevenueOverTimePoint,
} from '@/api/types'

interface StatsParams {
  from?: string // ISO date string
  to?: string
}

function buildQuery(params: StatsParams) {
  const qs = new URLSearchParams()
  if (params.from) qs.set('from', params.from)
  if (params.to) qs.set('to', params.to)
  const q = qs.toString()
  return q ? `?${q}` : ''
}

export function getStatsSummary(storeId: string, params: StatsParams = {}) {
  return apiClient.get<StatsSummary>(
    `/api/stores/${storeId}/stats/summary${buildQuery(params)}`
  )
}

export function getTopProducts(storeId: string, params: StatsParams = {}) {
  return apiClient.get<{ products: TopProduct[] }>(
    `/api/stores/${storeId}/stats/top-products${buildQuery(params)}`
  )
}

export function getOrdersByStatus(storeId: string, params: StatsParams = {}) {
  return apiClient.get<{ data: OrdersByStatus[] }>(
    `/api/stores/${storeId}/stats/orders-by-status${buildQuery(params)}`
  )
}

export function getRevenueOverTime(storeId: string, params: StatsParams = {}) {
  return apiClient.get<{ data: RevenueOverTimePoint[] }>(
    `/api/stores/${storeId}/stats/revenue-over-time${buildQuery(params)}`
  )
}
