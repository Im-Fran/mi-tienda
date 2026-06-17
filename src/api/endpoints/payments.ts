import { apiClient } from '@/api/client'
import type { PaymentMethod } from '@/api/types'

export function listPaymentMethods(storeId: string) {
  return apiClient.get<{ methods: PaymentMethod[] }>(
    `/api/stores/${storeId}/payments/methods`
  )
}

export function getPaymentMethod(storeId: string, id: string) {
  return apiClient.get<{ method: PaymentMethod }>(
    `/api/stores/${storeId}/payments/methods/${id}`
  )
}

export function createPaymentMethod(
  storeId: string,
  data: {
    type: 'in_person' | 'bank_transfer' | 'external'
    providerName?: string
    config?: Record<string, unknown>
    isActive?: boolean
  }
) {
  return apiClient.post<{ method: PaymentMethod }>(
    `/api/stores/${storeId}/payments/methods`,
    data
  )
}

export function updatePaymentMethod(
  storeId: string,
  id: string,
  data: Partial<{
    type: 'in_person' | 'bank_transfer' | 'external'
    providerName: string
    config: Record<string, unknown>
    isActive: boolean
  }>
) {
  return apiClient.patch<{ method: PaymentMethod }>(
    `/api/stores/${storeId}/payments/methods/${id}`,
    data
  )
}

export function deletePaymentMethod(storeId: string, id: string) {
  return apiClient.delete<{ deleted: boolean }>(
    `/api/stores/${storeId}/payments/methods/${id}`
  )
}
