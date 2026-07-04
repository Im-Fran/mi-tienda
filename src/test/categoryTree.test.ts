/**
 * Tests unitarios para las utilidades del árbol de categorías con drag & drop.
 */
import { describe, expect, it } from 'vitest'
import {
  flattenVisibleTree,
  findCategory,
  getDescendantIds,
  countDescendants,
  getProjection,
  computeSortOrder,
  moveCategoryInTree,
} from '@/lib/categoryTree'
import type { Category } from '@/api/types'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeCategory(
  id: string,
  parentId: string | null,
  sortOrder: number,
  children: Category[] = []
): Category {
  return {
    id,
    storeId: 'store-1',
    name: `Categoría ${id}`,
    slug: id,
    description: null,
    parentId,
    sortOrder,
    children,
    createdAt: 0,
    updatedAt: 0,
  }
}

/**
 * Árbol de prueba:
 * a (0)
 *   a1 (0)
 *     a1x (0)
 *   a2 (1)
 * b (1)
 * c (2)
 */
function makeTree(): Category[] {
  return [
    makeCategory('a', null, 0, [
      makeCategory('a1', 'a', 0, [makeCategory('a1x', 'a1', 0)]),
      makeCategory('a2', 'a', 1),
    ]),
    makeCategory('b', null, 1),
    makeCategory('c', null, 2),
  ]
}

const NONE = new Set<string>()

// ─── flattenVisibleTree ───────────────────────────────────────────────────────

describe('flattenVisibleTree', () => {
  it('aplana el árbol en orden DFS con depth correcto', () => {
    const flat = flattenVisibleTree(makeTree(), NONE)
    expect(flat.map((i) => i.id)).toEqual(['a', 'a1', 'a1x', 'a2', 'b', 'c'])
    expect(flat.map((i) => i.depth)).toEqual([0, 1, 2, 1, 0, 0])
  })

  it('omite los hijos de nodos colapsados', () => {
    const flat = flattenVisibleTree(makeTree(), new Set(['a']))
    expect(flat.map((i) => i.id)).toEqual(['a', 'b', 'c'])
  })

  it('omite el subárbol del ítem activo pero no el ítem mismo', () => {
    const flat = flattenVisibleTree(makeTree(), NONE, 'a')
    expect(flat.map((i) => i.id)).toEqual(['a', 'b', 'c'])
  })
})

// ─── findCategory / getDescendantIds / countDescendants ─────────────────────

describe('findCategory', () => {
  it('encuentra nodos anidados', () => {
    expect(findCategory(makeTree(), 'a1x')?.id).toBe('a1x')
  })

  it('devuelve null si no existe', () => {
    expect(findCategory(makeTree(), 'zzz')).toBeNull()
  })
})

describe('getDescendantIds', () => {
  it('devuelve todos los descendientes', () => {
    expect(getDescendantIds(makeTree(), 'a')).toEqual(new Set(['a1', 'a1x', 'a2']))
  })

  it('devuelve vacío para hojas y para ids inexistentes', () => {
    expect(getDescendantIds(makeTree(), 'b').size).toBe(0)
    expect(getDescendantIds(makeTree(), 'zzz').size).toBe(0)
  })
})

describe('countDescendants', () => {
  it('cuenta todo el subárbol', () => {
    expect(countDescendants(makeTree()[0])).toBe(3)
    expect(countDescendants(makeTree()[1])).toBe(0)
  })
})

// ─── getProjection ────────────────────────────────────────────────────────────

describe('getProjection', () => {
  const flat = () => flattenVisibleTree(makeTree(), NONE)

  it('reordena en el mismo nivel sin offset horizontal', () => {
    // Arrastrar "c" sobre "b" sin offset → hermano raíz después de "a"
    const p = getProjection(flat(), 'c', 'b', 0, 20)
    expect(p).toEqual({ depth: 0, parentId: null, insertAfterId: 'a' })
  })

  it('proyecta como hijo del ítem anterior al arrastrar hacia la derecha', () => {
    // "c" sobre "b" con offset de 1 nivel → hijo de "a" (ítem anterior "a2" depth 1)
    const p = getProjection(flat(), 'c', 'c', 20, 20)
    expect(p?.depth).toBe(1)
    expect(p?.parentId).toBe('b')
  })

  it('acota la profundidad al máximo válido (previo.depth + 1)', () => {
    // Offset exagerado no puede superar depth del anterior + 1
    const p = getProjection(flat(), 'c', 'c', 500, 20)
    expect(p?.depth).toBe(1) // anterior es "b" (depth 0) → máx 1
    expect(p?.parentId).toBe('b')
  })

  it('acota la profundidad al mínimo válido (depth del siguiente)', () => {
    // "a1" sobre sí mismo con offset negativo: el siguiente es "a1x"... usamos
    // lista sin descendientes del activo para el caso real
    const items = flattenVisibleTree(makeTree(), NONE, 'a1')
    // arrastrar "a1" (entre "a" y "a2") hacia la izquierda: siguiente "a2" depth 1
    const p = getProjection(items, 'a1', 'a1', -500, 20)
    expect(p?.depth).toBe(1)
    expect(p?.parentId).toBe('a')
  })

  it('permite sacar el último ítem a nivel raíz con offset negativo', () => {
    // "a2" es el último hijo de "a"; arrastrado al final con offset izquierdo
    const items = flattenVisibleTree(makeTree(), NONE, 'a2')
    const p = getProjection(items, 'a2', 'c', -100, 20)
    expect(p?.depth).toBe(0)
    expect(p?.parentId).toBeNull()
    expect(p?.insertAfterId).toBe('c')
  })

  it('devuelve null si el activo u over no están en la lista', () => {
    expect(getProjection(flat(), 'zzz', 'b', 0, 20)).toBeNull()
    expect(getProjection(flat(), 'a', 'zzz', 0, 20)).toBeNull()
  })
})

// ─── computeSortOrder ─────────────────────────────────────────────────────────

describe('computeSortOrder', () => {
  const siblings = [
    { id: 's1', sortOrder: 0 },
    { id: 's2', sortOrder: 1 },
    { id: 's3', sortOrder: 2 },
  ]

  it('primera posición → menor que el primero', () => {
    expect(computeSortOrder(siblings, null)).toBe(-1)
  })

  it('última posición → mayor que el último', () => {
    expect(computeSortOrder(siblings, 's3')).toBe(3)
  })

  it('posición intermedia → punto medio entre vecinos', () => {
    expect(computeSortOrder(siblings, 's1')).toBe(0.5)
  })

  it('sin hermanos → 0', () => {
    expect(computeSortOrder([], null)).toBe(0)
  })

  it('ordena los hermanos por sortOrder antes de calcular', () => {
    const unsorted = [
      { id: 's3', sortOrder: 2 },
      { id: 's1', sortOrder: 0 },
    ]
    expect(computeSortOrder(unsorted, 's1')).toBe(1)
  })
})

// ─── moveCategoryInTree ───────────────────────────────────────────────────────

describe('moveCategoryInTree', () => {
  it('mueve un nodo raíz dentro de otro nodo (con su subárbol)', () => {
    const result = moveCategoryInTree(makeTree(), 'a', 'b', 0)
    expect(result.map((c) => c.id)).toEqual(['b', 'c'])
    const b = findCategory(result, 'b')!
    expect(b.children.map((c) => c.id)).toEqual(['a'])
    expect(b.children[0].parentId).toBe('b')
    // El subárbol viaja con el nodo movido
    expect(findCategory(result, 'a1x')).not.toBeNull()
  })

  it('mueve un hijo a nivel raíz con el sortOrder indicado', () => {
    const result = moveCategoryInTree(makeTree(), 'a1', null, 0.5)
    expect(result.map((c) => c.id)).toEqual(['a', 'a1', 'b', 'c'])
    const a1 = result[1]
    expect(a1.parentId).toBeNull()
    expect(a1.sortOrder).toBe(0.5)
    expect(findCategory(result, 'a')!.children.map((c) => c.id)).toEqual(['a2'])
  })

  it('reordena dentro del mismo padre según sortOrder', () => {
    const result = moveCategoryInTree(makeTree(), 'a2', 'a', -1)
    expect(findCategory(result, 'a')!.children.map((c) => c.id)).toEqual(['a2', 'a1'])
  })

  it('no muta el árbol original', () => {
    const tree = makeTree()
    moveCategoryInTree(tree, 'a1', null, 5)
    expect(findCategory(tree, 'a')!.children.length).toBe(2)
    expect(findCategory(tree, 'a1')!.parentId).toBe('a')
  })

  it('devuelve el árbol original si el nodo o el padre no existen', () => {
    const tree = makeTree()
    expect(moveCategoryInTree(tree, 'zzz', null, 0)).toEqual(tree)
    expect(moveCategoryInTree(tree, 'b', 'zzz', 0)).toEqual(tree)
  })
})
