import { apiClient } from '@/api/client'
import type { Product, ProductVariant, ProductImage, Pagination } from '@/api/types'

export interface ListProductsParams {
  category?: string
  type?: 'physical' | 'digital'
  active?: 'true' | 'false'
  search?: string
  page?: number
  perPage?: number
}

export function listProducts(storeId: string, params: ListProductsParams = {}) {
  const qs = new URLSearchParams()
  if (params.category) qs.set('category', params.category)
  if (params.type) qs.set('type', params.type)
  if (params.active) qs.set('active', params.active)
  if (params.search) qs.set('search', params.search)
  if (params.page) qs.set('page', String(params.page))
  if (params.perPage) qs.set('perPage', String(params.perPage))
  const query = qs.toString()
  return apiClient.get<{ products: Product[]; pagination: Pagination }>(
    `/api/stores/${storeId}/products${query ? `?${query}` : ''}`
  )
}

export function getProduct(storeId: string, id: string) {
  return apiClient.get<{ product: Product }>(`/api/stores/${storeId}/products/${id}`)
}

export function createProduct(
  storeId: string,
  data: {
    name: string
    shortDescription?: string
    fullDescription?: string
    type?: 'physical' | 'digital'
    isActive?: boolean
    categoryIds?: string[]
    variants?: Array<{
      name: string
      sku?: string
      price: number
      compareAtPrice?: number
      stock?: number
      weight?: number
      digitalFileR2Key?: string
      options?: Array<{ optionName: string; optionValue: string }>
    }>
  }
) {
  return apiClient.post<{ product: Product }>(`/api/stores/${storeId}/products`, data)
}

export function updateProduct(
  storeId: string,
  id: string,
  data: {
    name?: string
    shortDescription?: string
    fullDescription?: string
    type?: 'physical' | 'digital'
    isActive?: boolean
    categoryIds?: string[]
  }
) {
  return apiClient.patch<{ product: Product }>(
    `/api/stores/${storeId}/products/${id}`,
    data
  )
}

export function deleteProduct(storeId: string, id: string) {
  return apiClient.delete<{ deleted: boolean }>(`/api/stores/${storeId}/products/${id}`)
}

// ---------- Product images ----------

export function uploadProductImages(storeId: string, productId: string, files: File[]) {
  const formData = new FormData()
  files.forEach((f) => formData.append('images', f))
  return apiClient.postForm<{ images: ProductImage[] }>(
    `/api/stores/${storeId}/products/${productId}/images`,
    formData
  )
}

export function deleteProductImage(storeId: string, productId: string, imageId: string) {
  return apiClient.delete<{ deleted: boolean }>(
    `/api/stores/${storeId}/products/${productId}/images/${imageId}`
  )
}

export function setMainProductImage(
  storeId: string,
  productId: string,
  imageId: string
) {
  return apiClient.patch<{ product: Product }>(
    `/api/stores/${storeId}/products/${productId}/images/${imageId}/main`
  )
}

// ---------- Product variants ----------

export function addVariant(
  storeId: string,
  productId: string,
  data: {
    name: string
    sku?: string
    price: number
    compareAtPrice?: number
    stock?: number
    weight?: number
    digitalFileR2Key?: string
    options?: Array<{ optionName: string; optionValue: string }>
  }
) {
  return apiClient.post<{ variant: ProductVariant }>(
    `/api/stores/${storeId}/products/${productId}/variants`,
    data
  )
}

export function updateVariant(
  storeId: string,
  productId: string,
  variantId: string,
  data: {
    name?: string
    sku?: string
    price?: number
    compareAtPrice?: number
    stock?: number
    weight?: number
    digitalFileR2Key?: string
    options?: Array<{ optionName: string; optionValue: string }>
  }
) {
  return apiClient.patch<{ variant: ProductVariant }>(
    `/api/stores/${storeId}/products/${productId}/variants/${variantId}`,
    data
  )
}

export function deleteVariant(storeId: string, productId: string, variantId: string) {
  return apiClient.delete<{ deleted: boolean }>(
    `/api/stores/${storeId}/products/${productId}/variants/${variantId}`
  )
}
