import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/api/endpoints/categories"
import type { Category } from "@/api/types"

// Factory de la query key: única fuente de verdad para la caché de categorías
export const categoriesKey = (storeId: string) =>
  ["stores", storeId, "categories"] as const

export function useCategories(storeId: string) {
  return useQuery({
    queryKey: categoriesKey(storeId),
    queryFn: async () => {
      const data = await listCategories(storeId)
      return data.categories
    },
    enabled: !!storeId,
    staleTime: 30_000,
  })
}

export function useCreateCategory(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof createCategory>[1]) =>
      createCategory(storeId, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: categoriesKey(storeId) }),
  })
}

export function useUpdateCategory(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateCategory>[2] }) =>
      updateCategory(storeId, id, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: categoriesKey(storeId) }),
  })
}

/**
 * Movimiento de categoría con update optimista (drag & drop).
 *
 * Patrón canónico de TanStack Query:
 * - `onMutate`: cancela los refetches en vuelo ANTES de tomar el snapshot,
 *   para que una respuesta vieja no pise el estado optimista (snap-back) y
 *   el snapshot no capture estado optimista de otro drag en curso.
 * - `onError`: rollback con el snapshot del context.
 * - `onSettled`: invalida para reconciliar con el servidor.
 */
export function useMoveCategoryOptimistic(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Parameters<typeof updateCategory>[2]
      optimisticTree: Category[]
    }) => updateCategory(storeId, id, data),
    onMutate: async ({ optimisticTree }) => {
      await qc.cancelQueries({ queryKey: categoriesKey(storeId) })
      // Snapshot tomado DESPUÉS del cancel: refleja el último estado asentado
      const previousTree = qc.getQueryData<Category[]>(categoriesKey(storeId))
      qc.setQueryData<Category[]>(categoriesKey(storeId), optimisticTree)
      return { previousTree }
    },
    onError: (_err, _vars, context) => {
      if (context) {
        qc.setQueryData(categoriesKey(storeId), context.previousTree)
      }
    },
    onSettled: () =>
      qc.invalidateQueries({ queryKey: categoriesKey(storeId) }),
  })
}

export function useDeleteCategory(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, recursive }: { id: string; recursive?: boolean }) =>
      deleteCategory(storeId, id, recursive),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: categoriesKey(storeId) }),
  })
}
