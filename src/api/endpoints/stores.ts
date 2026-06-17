import { apiClient } from '@/api/client'
import type { Store, StoreSettings } from '@/api/types'

export function listStores() {
  return apiClient.get<{ stores: Store[] }>('/api/stores')
}

export function getStore(storeId: string) {
  return apiClient.get<{ store: Store }>(`/api/stores/${storeId}`)
}

export function createStore(data: { name: string; slug?: string }) {
  return apiClient.post<{ store: Store }>('/api/stores', data)
}

export function updateStore(
  storeId: string,
  data: { name?: string; slug?: string; isActive?: boolean }
) {
  return apiClient.patch<{ store: Store }>(`/api/stores/${storeId}`, data)
}

export function deleteStore(storeId: string) {
  return apiClient.delete<{ deleted: boolean }>(`/api/stores/${storeId}`)
}

export function uploadStoreLogo(storeId: string, file: File) {
  const formData = new FormData()
  formData.append('logo', file)
  return apiClient.postForm<{ store: Store }>(`/api/stores/${storeId}/logo`, formData)
}

export function getStoreSettings(storeId: string) {
  return apiClient.get<{ settings: StoreSettings }>(`/api/stores/${storeId}/settings`)
}

export function updateStoreSettings(
  storeId: string,
  data: Partial<{
    requireCustomerIdDocument: boolean
    taxLabel: string
    taxRate: number
    decimalSeparator: '.' | ','
    decimalPlaces: number
    currencyCode: string
    currencySymbol: string
    countryMode: 'inclusive' | 'exclusive'
    bankTransferInfo: {
      bankName: string
      accountType: string
      accountNumber: string
      holderName: string
      holderDocument: string
      email: string
      instructions: string
    }
    countries: string[]
  }>
) {
  return apiClient.patch<{ settings: StoreSettings }>(
    `/api/stores/${storeId}/settings`,
    data
  )
}
