import { apiClient } from '@/api/client'
import type { Customer, CustomerAddress, Order, Pagination } from '@/api/types'

// ---------- Admin: customers of a store ----------

export function listCustomers(storeId: string, page = 1, perPage = 20) {
  return apiClient.get<{ customers: Customer[]; pagination: Pagination }>(
    `/api/stores/${storeId}/customers?page=${page}&perPage=${perPage}`
  )
}

export function getCustomer(storeId: string, id: string) {
  return apiClient.get<{ customer: Customer }>(
    `/api/stores/${storeId}/customers/${id}`
  )
}

// ---------- Customer self-service ----------

export function getMyProfile() {
  return apiClient.get<{ customer: Customer }>('/api/customers/me')
}

export function getMyAddresses() {
  return apiClient.get<{ addresses: CustomerAddress[] }>('/api/customers/me/addresses')
}

export function createAddress(data: {
  label?: string
  addressLine1: string
  addressLine2?: string
  city: string
  state?: string
  countryCode: string
  postalCode?: string
  isDefault?: boolean
}) {
  return apiClient.post<{ address: CustomerAddress }>('/api/customers/me/addresses', data)
}

export function updateAddress(
  id: string,
  data: Partial<{
    label: string
    addressLine1: string
    addressLine2: string
    city: string
    state: string
    countryCode: string
    postalCode: string
    isDefault: boolean
  }>
) {
  return apiClient.patch<{ address: CustomerAddress }>(
    `/api/customers/me/addresses/${id}`,
    data
  )
}

export function deleteAddress(id: string) {
  return apiClient.delete<{ deleted: boolean }>(`/api/customers/me/addresses/${id}`)
}

export function getMyOrders(page = 1, perPage = 20) {
  return apiClient.get<{ orders: Order[]; pagination: Pagination }>(
    `/api/customers/me/orders?page=${page}&perPage=${perPage}`
  )
}

export function getMyOrder(id: string) {
  return apiClient.get<{ order: Order }>(`/api/customers/me/orders/${id}`)
}
