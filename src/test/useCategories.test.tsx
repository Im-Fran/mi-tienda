/**
 * Tests para el hook de movimiento optimista de categorías (drag & drop).
 * Verifica el patrón canónico de TanStack Query: cancel → snapshot → set,
 * rollback en error e invalidación al asentarse.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useMoveCategoryOptimistic, categoriesKey } from '@/hooks/useCategories'
import type { Category } from '@/api/types'

vi.mock('@/api/endpoints/categories', () => ({
  listCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}))

import { updateCategory } from '@/api/endpoints/categories'

const STORE_ID = 'store-1'

function makeCategory(id: string, parentId: string | null, sortOrder: number): Category {
  return {
    id,
    storeId: STORE_ID,
    name: `Categoría ${id}`,
    slug: id,
    description: null,
    parentId,
    sortOrder,
    children: [],
    createdAt: 0,
    updatedAt: 0,
  }
}

const previousTree = [makeCategory('a', null, 0), makeCategory('b', null, 1)]
const optimisticTree = [makeCategory('b', null, 0), makeCategory('a', null, 1)]

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  queryClient.setQueryData(categoriesKey(STORE_ID), previousTree)
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const { result } = renderHook(() => useMoveCategoryOptimistic(STORE_ID), { wrapper })
  return { queryClient, result }
}

describe('categoriesKey', () => {
  it('genera la key canónica de categorías por tienda', () => {
    expect(categoriesKey('s1')).toEqual(['stores', 's1', 'categories'])
  })
})

describe('useMoveCategoryOptimistic', () => {
  beforeEach(() => {
    vi.mocked(updateCategory).mockReset()
  })

  it('aplica el árbol optimista de inmediato y lo asienta si la mutación tiene éxito', async () => {
    let resolveMutation!: (v: { category: Category }) => void
    vi.mocked(updateCategory).mockReturnValue(
      new Promise((resolve) => {
        resolveMutation = resolve
      })
    )
    const { queryClient, result } = setup()

    let mutation!: Promise<unknown>
    act(() => {
      mutation = result.current.mutateAsync({
        id: 'b',
        data: { parentId: null, sortOrder: 0 },
        optimisticTree,
      })
    })

    // El árbol optimista se aplica antes de que responda el servidor
    await waitFor(() =>
      expect(queryClient.getQueryData(categoriesKey(STORE_ID))).toEqual(optimisticTree)
    )

    resolveMutation({ category: optimisticTree[0] })
    await act(async () => {
      await mutation
    })
    expect(queryClient.getQueryData(categoriesKey(STORE_ID))).toEqual(optimisticTree)
  })

  it('revierte al snapshot previo si la mutación falla (rollback)', async () => {
    vi.mocked(updateCategory).mockRejectedValue(new Error('boom'))
    const { queryClient, result } = setup()

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          id: 'b',
          data: { parentId: null, sortOrder: 0 },
          optimisticTree,
        })
      ).rejects.toThrow('boom')
    })

    expect(queryClient.getQueryData(categoriesKey(STORE_ID))).toEqual(previousTree)
  })

  it('cancela refetches en vuelo antes del snapshot (sin snap-back por respuestas viejas)', async () => {
    vi.mocked(updateCategory).mockResolvedValue({ category: optimisticTree[0] })
    const { queryClient, result } = setup()

    const cancelSpy = vi.spyOn(queryClient, 'cancelQueries')
    const snapshotSpy = vi.spyOn(queryClient, 'getQueryData')

    await act(async () => {
      await result.current.mutateAsync({
        id: 'b',
        data: { parentId: null, sortOrder: 0 },
        optimisticTree,
      })
    })

    expect(cancelSpy).toHaveBeenCalledWith({ queryKey: categoriesKey(STORE_ID) })
    // El snapshot se toma DESPUÉS del cancel
    const cancelOrder = cancelSpy.mock.invocationCallOrder[0]
    const snapshotOrder = snapshotSpy.mock.invocationCallOrder[0]
    expect(cancelOrder).toBeLessThan(snapshotOrder)
  })

  it('invalida la query al asentarse para reconciliar con el servidor', async () => {
    vi.mocked(updateCategory).mockRejectedValue(new Error('boom'))
    const { queryClient, result } = setup()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    await act(async () => {
      await result.current
        .mutateAsync({ id: 'b', data: { parentId: null, sortOrder: 0 }, optimisticTree })
        .catch(() => {})
    })

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: categoriesKey(STORE_ID) })
  })
})
