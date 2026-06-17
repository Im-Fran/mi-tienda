import { apiClient } from '@/api/client'
import type { Order, OrderStatus, Pagination } from '@/api/types'

export interface ListOrdersParams {
  status?: OrderStatus
  page?: number
  perPage?: number
}

export function listOrders(storeId: string, params: ListOrdersParams = {}) {
  const qs = new URLSearchParams()
  if (params.status) qs.set('status', params.status)
  if (params.page) qs.set('page', String(params.page))
  if (params.perPage) qs.set('perPage', String(params.perPage))
  const query = qs.toString()
  return apiClient.get<{ orders: Order[]; pagination: Pagination }>(
    `/api/stores/${storeId}/orders${query ? `?${query}` : ''}`
  )
}

export function getOrder(storeId: string, id: string) {
  return apiClient.get<{ order: Order }>(`/api/stores/${storeId}/orders/${id}`)
}

export function updateOrderStatus(storeId: string, id: string, status: OrderStatus) {
  return apiClient.patch<{ order: Order }>(
    `/api/stores/${storeId}/orders/${id}/status`,
    { status }
  )
}
