import { apiClient } from '@/api/client'
import type { Coupon, Pagination } from '@/api/types'

export function listCoupons(storeId: string, page = 1, perPage = 20) {
  return apiClient.get<{ coupons: Coupon[]; pagination: Pagination }>(
    `/api/stores/${storeId}/coupons?page=${page}&perPage=${perPage}`
  )
}

export function getCoupon(storeId: string, id: string) {
  return apiClient.get<{ coupon: Coupon }>(`/api/stores/${storeId}/coupons/${id}`)
}

export function createCoupon(
  storeId: string,
  data: {
    code: string
    type: 'percentage' | 'fixed'
    value: number
    appliesTo?: 'all' | 'products' | 'categories'
    occasion?: string
    minOrderAmount?: number
    maxUses?: number
    startsAt?: string
    expiresAt?: string
    isActive?: boolean
    productIds?: string[]
    categoryIds?: string[]
  }
) {
  return apiClient.post<{ coupon: Coupon }>(`/api/stores/${storeId}/coupons`, data)
}

export function updateCoupon(
  storeId: string,
  id: string,
  data: Partial<{
    code: string
    type: 'percentage' | 'fixed'
    value: number
    appliesTo: 'all' | 'products' | 'categories'
    occasion: string
    minOrderAmount: number
    maxUses: number
    startsAt: string
    expiresAt: string
    isActive: boolean
    productIds: string[]
    categoryIds: string[]
  }>
) {
  return apiClient.patch<{ coupon: Coupon }>(
    `/api/stores/${storeId}/coupons/${id}`,
    data
  )
}

export function deleteCoupon(storeId: string, id: string) {
  return apiClient.delete<{ deleted: boolean }>(`/api/stores/${storeId}/coupons/${id}`)
}

export function validateCoupon(
  storeId: string,
  data: { code: string; cartId?: string; subtotal?: number }
) {
  return apiClient.post<{ valid: boolean; coupon: Coupon; discount: number }>(
    `/api/stores/${storeId}/coupons/validate`,
    data
  )
}
