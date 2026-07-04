import { apiClient } from '@/api/client'
import type { Category } from '@/api/types'

export function listCategories(storeId: string) {
  return apiClient.get<{ categories: Category[] }>(`/api/stores/${storeId}/categories`)
}

export function createCategory(
  storeId: string,
  data: {
    name: string
    slug?: string
    description?: string
    parentId?: string
    sortOrder?: number
  }
) {
  return apiClient.post<{ category: Category }>(
    `/api/stores/${storeId}/categories`,
    data
  )
}

export function updateCategory(
  storeId: string,
  id: string,
  data: {
    name?: string
    slug?: string
    description?: string
    // null = mover a nivel raíz (PATCH distingue entre omitir y limpiar)
    parentId?: string | null
    sortOrder?: number
  }
) {
  return apiClient.patch<{ category: Category }>(
    `/api/stores/${storeId}/categories/${id}`,
    data
  )
}

export function deleteCategory(
  storeId: string,
  id: string,
  recursive = false
) {
  return apiClient.delete<{ deleted: boolean }>(
    `/api/stores/${storeId}/categories/${id}?recursive=${recursive}`
  )
}
