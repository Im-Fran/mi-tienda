/**
 * Utilidades puras para el árbol de categorías con drag & drop.
 *
 * Implementa el patrón "projected drop" del ejemplo SortableTree de dnd-kit:
 * el árbol se renderiza como una lista plana y, durante el arrastre, el offset
 * horizontal del puntero proyecta la profundidad (y por lo tanto el padre)
 * donde caerá el ítem.
 */
import { arrayMove } from "@dnd-kit/sortable"
import type { Category } from "@/api/types"

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface FlatCategory {
  id: string
  parentId: string | null
  depth: number
  category: Category
  /** Path completo de slugs desde la raiz, ej. "/macbook/air" */
  slugPath: string
}

export interface ProjectedDrop {
  /** Profundidad proyectada (0 = raíz) */
  depth: number
  /** Nuevo padre proyectado (null = raíz) */
  parentId: string | null
  /** Id del hermano que quedará justo antes del ítem (null = primera posición) */
  insertAfterId: string | null
}

// ─── Aplanado del árbol ───────────────────────────────────────────────────────

/**
 * Aplana el árbol respetando el estado de colapso. Si se pasa `excludeSubtreeId`,
 * los descendientes de ese nodo se omiten (el subárbol "viaja" con el ítem
 * arrastrado), lo que además impide soltar un padre dentro de su propio subárbol.
 */
export function flattenVisibleTree(
  categories: Category[],
  collapsedIds: ReadonlySet<string>,
  excludeSubtreeId: string | null = null,
  depth = 0,
  parentSlugPath = ""
): FlatCategory[] {
  const result: FlatCategory[] = []
  for (const cat of categories) {
    const slugPath = `${parentSlugPath}/${cat.slug}`
    result.push({ id: cat.id, parentId: cat.parentId, depth, category: cat, slugPath })
    const hideChildren = collapsedIds.has(cat.id) || cat.id === excludeSubtreeId
    if (cat.children.length > 0 && !hideChildren) {
      result.push(
        ...flattenVisibleTree(cat.children, collapsedIds, excludeSubtreeId, depth + 1, slugPath)
      )
    }
  }
  return result
}

/** Busca una categoría por id en el árbol. */
export function findCategory(categories: Category[], id: string): Category | null {
  for (const cat of categories) {
    if (cat.id === id) return cat
    const found = findCategory(cat.children, id)
    if (found) return found
  }
  return null
}

/** Ids de todos los descendientes de un nodo (protección anti-ciclos). */
export function getDescendantIds(categories: Category[], id: string): Set<string> {
  const node = findCategory(categories, id)
  const ids = new Set<string>()
  if (!node) return ids
  const collect = (cats: Category[]): void => {
    for (const c of cats) {
      ids.add(c.id)
      collect(c.children)
    }
  }
  collect(node.children)
  return ids
}

/** Número total de descendientes de un nodo. */
export function countDescendants(cat: Category): number {
  return cat.children.reduce((acc, child) => acc + 1 + countDescendants(child), 0)
}

// ─── Proyección del drop ──────────────────────────────────────────────────────

/**
 * Calcula dónde caerá el ítem arrastrado según la posición vertical (over) y el
 * offset horizontal (dragOffsetX). La profundidad se acota entre la mínima y
 * máxima válidas según los vecinos proyectados.
 *
 * `items` debe ser la lista visible SIN los descendientes del ítem activo.
 */
export function getProjection(
  items: readonly Pick<FlatCategory, "id" | "parentId" | "depth">[],
  activeId: string,
  overId: string,
  dragOffsetX: number,
  indentationWidth: number
): ProjectedDrop | null {
  const overIndex = items.findIndex((i) => i.id === overId)
  const activeIndex = items.findIndex((i) => i.id === activeId)
  if (overIndex === -1 || activeIndex === -1) return null

  const activeItem = items[activeIndex]
  const newItems = arrayMove([...items], activeIndex, overIndex)
  const previousItem = newItems[overIndex - 1]
  const nextItem = newItems[overIndex + 1]

  const dragDepth = Math.round(dragOffsetX / indentationWidth)
  const projectedDepth = activeItem.depth + dragDepth
  const maxDepth = previousItem ? previousItem.depth + 1 : 0
  const minDepth = nextItem ? nextItem.depth : 0
  const depth = Math.min(Math.max(projectedDepth, minDepth), maxDepth)

  // Derivar el nuevo padre a partir de la profundidad proyectada
  let parentId: string | null = null
  if (depth > 0 && previousItem) {
    if (depth === previousItem.depth) {
      parentId = previousItem.parentId
    } else if (depth === previousItem.depth + 1) {
      parentId = previousItem.id
    } else {
      // depth < previousItem.depth → subir por la lista hasta el nivel proyectado
      for (let i = overIndex - 1; i >= 0; i--) {
        if (newItems[i].depth === depth) {
          parentId = newItems[i].parentId
          break
        }
      }
    }
  }

  // Hermano inmediatamente anterior en el nivel proyectado
  let insertAfterId: string | null = null
  for (let i = overIndex - 1; i >= 0; i--) {
    const item = newItems[i]
    if (item.depth < depth) break
    if (item.depth === depth) {
      insertAfterId = item.id
      break
    }
  }

  return { depth, parentId, insertAfterId }
}

// ─── Cálculo de sortOrder ─────────────────────────────────────────────────────

/**
 * Calcula un sortOrder que posicione al ítem entre sus nuevos hermanos usando
 * un solo request: antes del primero → first - 1, después del último → last + 1,
 * entre dos → punto medio.
 *
 * `siblings` son los hijos del nuevo padre SIN incluir el ítem movido.
 */
export function computeSortOrder(
  siblings: readonly Pick<Category, "id" | "sortOrder">[],
  insertAfterId: string | null
): number {
  const sorted = [...siblings].sort((a, b) => a.sortOrder - b.sortOrder)

  if (insertAfterId === null) {
    // Primera posición
    return sorted.length > 0 ? sorted[0].sortOrder - 1 : 0
  }

  const prevIndex = sorted.findIndex((s) => s.id === insertAfterId)
  if (prevIndex === -1) {
    // Hermano no encontrado → al final
    return sorted.length > 0 ? sorted[sorted.length - 1].sortOrder + 1 : 0
  }

  const prev = sorted[prevIndex]
  const next = sorted[prevIndex + 1]
  if (!next) return prev.sortOrder + 1
  return (prev.sortOrder + next.sortOrder) / 2
}

// ─── Mutación optimista del árbol ─────────────────────────────────────────────

/**
 * Devuelve un nuevo árbol con el nodo `activeId` (y su subárbol) movido bajo
 * `newParentId` con el `sortOrder` indicado. No muta el árbol original.
 */
export function moveCategoryInTree(
  categories: Category[],
  activeId: string,
  newParentId: string | null,
  sortOrder: number
): Category[] {
  const tree = structuredClone(categories)

  // 1. Extraer el nodo de su posición actual
  let moved: Category | null = null
  const remove = (cats: Category[]): Category[] =>
    cats.filter((c) => {
      if (c.id === activeId) {
        moved = c
        return false
      }
      c.children = remove(c.children)
      return true
    })
  const withoutActive = remove(tree)
  if (!moved) return categories

  const movedNode: Category = moved
  movedNode.parentId = newParentId
  movedNode.sortOrder = sortOrder

  // 2. Insertar en el nuevo padre (o en la raíz) y reordenar
  const insertSorted = (cats: Category[]): Category[] =>
    [...cats, movedNode].sort((a, b) => a.sortOrder - b.sortOrder)

  if (newParentId === null) return insertSorted(withoutActive)

  const parent = findCategory(withoutActive, newParentId)
  if (!parent) return categories
  parent.children = insertSorted(parent.children)
  return withoutActive
}
