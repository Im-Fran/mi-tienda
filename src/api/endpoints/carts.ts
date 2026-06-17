import { apiClient } from '@/api/client'
import type { Cart, Pagination } from '@/api/types'

// ---------- Public cart (storefront) ----------

export function createCart(storeId: string, customerId?: string) {
  return apiClient.post<{ cart: Cart; guestToken?: string }>(
    `/api/stores/${storeId}/cart`,
    customerId ? { customerId } : {}
  )
}

export function getCart(storeId: string, cartId: string) {
  return apiClient.get<{ cart: Cart }>(`/api/stores/${storeId}/cart/${cartId}`)
}

export function addCartItem(
  storeId: string,
  cartId: string,
  variantId: string,
  quantity = 1
) {
  return apiClient.post<{ cart: Cart }>(
    `/api/stores/${storeId}/cart/${cartId}/items`,
    { variantId, quantity }
  )
}

export function updateCartItem(
  storeId: string,
  cartId: string,
  itemId: string,
  quantity: number
) {
  return apiClient.patch<{ cart: Cart }>(
    `/api/stores/${storeId}/cart/${cartId}/items/${itemId}`,
    { quantity }
  )
}

export function removeCartItem(storeId: string, cartId: string, itemId: string) {
  return apiClient.delete<{ cart: Cart }>(
    `/api/stores/${storeId}/cart/${cartId}/items/${itemId}`
  )
}

export function applyCoupon(storeId: string, cartId: string, code: string) {
  return apiClient.post<{ cart: Cart }>(
    `/api/stores/${storeId}/cart/${cartId}/coupon`,
    { code }
  )
}

export function removeCoupon(storeId: string, cartId: string) {
  return apiClient.delete<{ cart: Cart }>(
    `/api/stores/${storeId}/cart/${cartId}/coupon`
  )
}

export function checkout(
  storeId: string,
  cartId: string,
  data: {
    guest?: {
      name: string
      email: string
      phone?: string
      idDocument?: string
    }
    documentType?: 'receipt' | 'invoice'
    paymentMethodId: string
    shippingMethodId?: string
    billingAddressId?: string
    shippingAddressId?: string
    billingAddress?: {
      label?: string
      addressLine1: string
      addressLine2?: string
      city: string
      state?: string
      countryCode: string
      postalCode?: string
    }
    shippingAddress?: {
      addressLine1: string
      city: string
      countryCode: string
    }
    notes?: string
  }
) {
  return apiClient.post<{ order: import('@/api/types').Order }>(
    `/api/stores/${storeId}/cart/${cartId}/checkout`,
    data
  )
}

// ---------- Admin carts ----------

export function listAdminCarts(
  storeId: string,
  params: { status?: 'pending' | 'completed'; page?: number; perPage?: number } = {}
) {
  const qs = new URLSearchParams()
  if (params.status) qs.set('status', params.status)
  if (params.page) qs.set('page', String(params.page))
  if (params.perPage) qs.set('perPage', String(params.perPage))
  const query = qs.toString()
  return apiClient.get<{ carts: Cart[]; pagination: Pagination }>(
    `/api/stores/${storeId}/carts${query ? `?${query}` : ''}`
  )
}

export function getAdminCart(storeId: string, id: string) {
  return apiClient.get<{ cart: Cart }>(`/api/stores/${storeId}/carts/${id}`)
}
