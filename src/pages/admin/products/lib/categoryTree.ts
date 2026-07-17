import type { Category } from "@/api/types"

// Retorna IDs de todos los ancestros de targetId, o null si no está en este subárbol
export function getAncestorIds(cats: Category[], targetId: string): string[] | null {
  for (const c of cats) {
    if (c.id === targetId) return []
    const sub = getAncestorIds(c.children, targetId)
    if (sub !== null) return [c.id, ...sub]
  }
  return null
}

// Retorna IDs de todos los descendientes de un nodo
export function getDescendantIds(cat: Category): string[] {
  return cat.children.flatMap((c) => [c.id, ...getDescendantIds(c)])
}

export function findCategory(cats: Category[], id: string): Category | null {
  for (const c of cats) {
    if (c.id === id) return c
    const found = findCategory(c.children, id)
    if (found) return found
  }
  return null
}
