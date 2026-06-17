import { apiClient } from '@/api/client'
import type { ShippingMethod } from '@/api/types'

export function listShippingMethods(storeId: string) {
  return apiClient.get<{ methods: ShippingMethod[] }>(
    `/api/stores/${storeId}/shipping/methods`
  )
}

export function getShippingMethod(storeId: string, id: string) {
  return apiClient.get<{ method: ShippingMethod }>(
    `/api/stores/${storeId}/shipping/methods/${id}`
  )
}

export function createShippingMethod(
  storeId: string,
  data: {
    type: 'store_pickup' | 'generic_delivery'
    name: string
    cost: number
    maxDistanceKm?: number
    estimatedDays?: number
    isActive?: boolean
  }
) {
  return apiClient.post<{ method: ShippingMethod }>(
    `/api/stores/${storeId}/shipping/methods`,
    data
  )
}

export function updateShippingMethod(
  storeId: string,
  id: string,
  data: Partial<{
    type: 'store_pickup' | 'generic_delivery'
    name: string
    cost: number
    maxDistanceKm: number
    estimatedDays: number
    isActive: boolean
  }>
) {
  return apiClient.patch<{ method: ShippingMethod }>(
    `/api/stores/${storeId}/shipping/methods/${id}`,
    data
  )
}

export function deleteShippingMethod(storeId: string, id: string) {
  return apiClient.delete<{ deleted: boolean }>(
    `/api/stores/${storeId}/shipping/methods/${id}`
  )
}
