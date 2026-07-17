import { useState, useEffect, useMemo } from "react"
import { useParams } from "react-router-dom"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, GripVertical } from "lucide-react"
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  MeasuringStrategy,
  defaultDropAnimation,
  type DragEndEvent,
  type DragStartEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DropAnimation,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { ErrorState } from "@/components/shared/ErrorState"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useMoveCategoryOptimistic,
} from "@/hooks/useCategories"
import {
  flattenVisibleTree,
  findCategory,
  getDescendantIds,
  countDescendants,
  getProjection,
  computeSortOrder,
  moveCategoryInTree,
} from "@/lib/categoryTree"
import type { Category } from "@/api/types"
import { getErrorMessage } from "@/lib/errors"
import { CategoryFormFields } from "./components/CategoryFormFields"
import { CategoryRow } from "./components/CategoryRow"

// ─── Schema ───────────────────────────────────────────────────────────────────

const categorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(120, "Máximo 120 caracteres"),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido (solo minúsculas, números y guiones)")
    .or(z.literal(""))
    .optional(),
  description: z.string().optional(),
})

export type CategoryFormValues = z.infer<typeof categorySchema>

// ─── Constantes de DnD ────────────────────────────────────────────────────────

/** Ancho de sangría por nivel (px). También define el paso horizontal del drag. */
export const INDENTATION_WIDTH = 20

/** Animación de drop suave (patrón del ejemplo SortableTree de dnd-kit). */
const dropAnimationConfig: DropAnimation = {
  keyframes({ transform }) {
    return [
      { opacity: 1, transform: CSS.Transform.toString(transform.initial) },
      {
        opacity: 0,
        transform: CSS.Transform.toString({
          ...transform.final,
          x: transform.final.x + 5,
          y: transform.final.y + 5,
        }),
      },
    ]
  },
  easing: "ease-out",
  duration: 200,
  sideEffects({ active }) {
    active.node.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: defaultDropAnimation.duration,
      easing: defaultDropAnimation.easing,
    })
  },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function CategoriesPage() {
  const { storeId } = useParams<{ storeId: string }>()

  const { data: categories, isLoading, isError, error, refetch } = useCategories(storeId!)
  const { mutateAsync: createCategory, isPending: creating } = useCreateCategory(storeId!)
  const { mutateAsync: updateCategory, isPending: updating } = useUpdateCategory(storeId!)
  const { mutateAsync: deleteCategory, isPending: deleting } = useDeleteCategory(storeId!)
  const { mutateAsync: moveCategory } = useMoveCategoryOptimistic(storeId!)

  // Estado de modales
  const [addRootOpen, setAddRootOpen] = useState(false)
  const [addChildTarget, setAddChildTarget] = useState<Category | null>(null)
  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  // Estado de colapso elevado a la página (Set de ids colapsados)
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())

  // Estado del drag activo
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [offsetLeft, setOffsetLeft] = useState(0)

  // Formulario compartido para crear (raíz y subcategoría)
  const createForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", slug: "", description: "" },
  })

  // Formulario para editar
  const editForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", slug: "", description: "" },
  })

  // Pre-rellenar formulario de edición cuando cambia el objetivo
  useEffect(() => {
    if (editTarget) {
      editForm.reset({
        name: editTarget.name,
        slug: editTarget.slug ?? "",
        description: editTarget.description ?? "",
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editTarget])

  // Lista plana visible: respeta el colapso y, durante el drag, oculta el
  // subárbol del ítem activo (viaja con él y evita ciclos como destino)
  const visibleItems = useMemo(
    () => flattenVisibleTree(categories ?? [], collapsedIds, activeDragId),
    [categories, collapsedIds, activeDragId]
  )
  const sortableIds = useMemo(() => visibleItems.map((i) => i.id), [visibleItems])

  // Drop proyectado: profundidad/padre según posición vertical + offset horizontal
  const projected = useMemo(
    () =>
      activeDragId && overId
        ? getProjection(visibleItems, activeDragId, overId, offsetLeft, INDENTATION_WIDTH)
        : null,
    [activeDragId, overId, offsetLeft, visibleItems]
  )

  // Ítem activo (para el DragOverlay)
  const activeItem = useMemo(
    () => (activeDragId ? visibleItems.find((i) => i.id === activeDragId) ?? null : null),
    [activeDragId, visibleItems]
  )
  const activeDescendants = activeItem ? countDescendants(activeItem.category) : 0

  // Cursor "grabbing" en todo el documento durante el drag
  useEffect(() => {
    if (!activeDragId) return
    document.body.style.setProperty("cursor", "grabbing")
    return () => {
      document.body.style.removeProperty("cursor")
    }
  }, [activeDragId])

  // Sensores: puntero (8px de distancia para no interferir con clicks) + teclado
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // ─── Handlers ───────────────────────────────────────────────────────────────

  async function handleCreateRoot(values: CategoryFormValues) {
    try {
      await createCategory({
        name: values.name,
        slug: values.slug || undefined,
        description: values.description || undefined,
        parentId: undefined,
      })
      toast.success("Categoría raíz creada correctamente")
      setAddRootOpen(false)
      createForm.reset()
    } catch (err) {
      toast.error(getErrorMessage(err, "Error al crear la categoría"))
    }
  }

  async function handleCreateChild(values: CategoryFormValues) {
    if (!addChildTarget) return
    try {
      await createCategory({
        name: values.name,
        slug: values.slug || undefined,
        description: values.description || undefined,
        parentId: addChildTarget.id,
      })
      toast.success(`Subcategoría creada dentro de "${addChildTarget.name}"`)
      setAddChildTarget(null)
      createForm.reset()
    } catch (err) {
      toast.error(getErrorMessage(err, "Error al crear la subcategoría"))
    }
  }

  async function handleUpdate(values: CategoryFormValues) {
    if (!editTarget) return
    try {
      await updateCategory({
        id: editTarget.id,
        data: {
          name: values.name,
          slug: values.slug || undefined,
          description: values.description || undefined,
        },
      })
      toast.success("Categoría actualizada correctamente")
      setEditTarget(null)
      editForm.reset()
    } catch (err) {
      toast.error(getErrorMessage(err, "Error al actualizar la categoría"))
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteCategory({ id: deleteTarget.id })
      toast.success(`"${deleteTarget.name}" eliminada correctamente`)
      setDeleteTarget(null)
    } catch (err) {
      toast.error(getErrorMessage(err, "Error al eliminar la categoría"))
      setDeleteTarget(null)
    }
  }

  function toggleCollapse(id: string) {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function resetDragState() {
    setActiveDragId(null)
    setOverId(null)
    setOffsetLeft(0)
  }

  function handleDragStart({ active }: DragStartEvent) {
    setActiveDragId(active.id as string)
    setOverId(active.id as string)
  }

  function handleDragMove({ delta }: DragMoveEvent) {
    setOffsetLeft(delta.x)
  }

  function handleDragOver({ over }: DragOverEvent) {
    setOverId((over?.id as string) ?? null)
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    const drop = projected
    resetDragState()
    if (!drop || !over || !categories || !storeId) return

    const activeId = active.id as string
    const activeNode = findCategory(categories, activeId)
    if (!activeNode) return

    // Protección anti-ciclos: no soltar dentro del propio subárbol
    // (la lista visible ya excluye a los descendientes; esto es defensa extra)
    if (
      drop.parentId === activeId ||
      (drop.parentId !== null && getDescendantIds(categories, activeId).has(drop.parentId))
    ) {
      return
    }

    // No-op: mismo padre y mismo hermano anterior → no hay nada que hacer
    const currentSiblings = activeNode.parentId
      ? findCategory(categories, activeNode.parentId)?.children ?? []
      : categories
    const currentIndex = currentSiblings.findIndex((c) => c.id === activeId)
    const currentPrevId = currentIndex > 0 ? currentSiblings[currentIndex - 1].id : null
    if (drop.parentId === activeNode.parentId && drop.insertAfterId === currentPrevId) return

    // sortOrder posicionando al ítem entre los hermanos del nuevo padre
    const newSiblings = (
      drop.parentId ? findCategory(categories, drop.parentId)?.children ?? [] : categories
    ).filter((c) => c.id !== activeId)
    const sortOrder = computeSortOrder(newSiblings, drop.insertAfterId)

    // Expandir el nuevo padre para que el ítem quede visible tras el drop
    const parentWasCollapsed = drop.parentId !== null && collapsedIds.has(drop.parentId)
    if (parentWasCollapsed) {
      const parentId = drop.parentId!
      setCollapsedIds((prev) => {
        const next = new Set(prev)
        next.delete(parentId)
        return next
      })
    }

    const parentChanged = drop.parentId !== activeNode.parentId
    try {
      // Update optimista gestionado por el hook (cancelQueries + snapshot +
      // setQueryData en onMutate, rollback en onError, invalidate en onSettled)
      await moveCategory({
        id: activeId,
        data: { parentId: drop.parentId, sortOrder },
        optimisticTree: moveCategoryInTree(categories, activeId, drop.parentId, sortOrder),
      })
      if (!parentChanged) {
        toast.success("Orden actualizado")
      } else if (drop.parentId === null) {
        toast.success("Categoría movida a nivel raíz")
      } else {
        const parentName = findCategory(categories, drop.parentId)?.name ?? ""
        toast.success(`Categoría movida dentro de "${parentName}"`)
      }
    } catch (err) {
      // Revertir la auto-expansión del padre si la mutación falla
      if (parentWasCollapsed) {
        const parentId = drop.parentId!
        setCollapsedIds((prev) => new Set(prev).add(parentId))
      }
      toast.error(getErrorMessage(err, "Error al mover la categoría"))
    }
  }

  // ─── Estados de carga y error ────────────────────────────────────────────────

  if (isLoading) return <LoadingSpinner className="py-16" />
  if (isError) return <ErrorState message="Error al cargar las categorías" error={error} retry={refetch} />

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader
        title="Categorías"
        actions={
          <Button
            size="sm"
            onClick={() => {
              createForm.reset()
              setAddRootOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nueva Categoría Raíz
          </Button>
        }
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={resetDragState}
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <div className="rounded-xl border bg-card">
            <div className="p-3">
              {!categories || categories.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No hay categorías aún. Crea tu primera categoría raíz.
                </p>
              ) : (
                <div className="flex flex-col">
                  {visibleItems.map((item) => (
                    <CategoryRow
                      key={item.id}
                      item={item}
                      depth={
                        item.id === activeDragId && projected ? projected.depth : item.depth
                      }
                      ghost={item.id === activeDragId}
                      collapsed={collapsedIds.has(item.id)}
                      onToggleCollapse={toggleCollapse}
                      onEdit={(c) => setEditTarget(c)}
                      onDelete={(c) => setDeleteTarget(c)}
                      onAddChild={(parent) => {
                        createForm.reset()
                        setAddChildTarget(parent)
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </SortableContext>

        {/* Overlay visual durante el drag */}
        <DragOverlay dropAnimation={dropAnimationConfig}>
          {activeItem && (
            <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm font-medium shadow-lg cursor-grabbing">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              {activeItem.category.name}
              {activeDescendants > 0 && (
                <Badge variant="secondary" className="shrink-0">
                  +{activeDescendants}{" "}
                  {activeDescendants === 1 ? "subcategoría" : "subcategorías"}
                </Badge>
              )}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* ─── Modal: Nueva Categoría Raíz ─────────────────────────────────── */}
      <Dialog
        open={addRootOpen}
        onOpenChange={(open) => {
          setAddRootOpen(open)
          if (!open) createForm.reset()
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Categoría Raíz</DialogTitle>
            <DialogDescription>
              Una categoría raíz es una categoría de nivel superior que no pertenece a ninguna
              otra categoría. Aparecerá directamente en el menú principal de tu tienda.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreateRoot)}>
            <CategoryFormFields form={createForm} isLoading={creating} fieldPrefix="root" />
            <DialogFooter className="mt-2">
              <Button
                variant="outline"
                type="button"
                disabled={creating}
                onClick={() => setAddRootOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? "Creando..." : "Crear Categoría"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Modal: Nueva Subcategoría ────────────────────────────────────── */}
      <Dialog
        open={!!addChildTarget}
        onOpenChange={(open) => {
          if (!open) {
            setAddChildTarget(null)
            createForm.reset()
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Subcategoría</DialogTitle>
            <DialogDescription>
              Esta categoría se creará dentro de{" "}
              <strong className="text-foreground">{addChildTarget?.name}</strong> y será una
              subcategoría de ella.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreateChild)}>
            <CategoryFormFields form={createForm} isLoading={creating} fieldPrefix="child" />
            <DialogFooter className="mt-2">
              <Button
                variant="outline"
                type="button"
                disabled={creating}
                onClick={() => setAddChildTarget(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? "Creando..." : "Crear Subcategoría"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Modal: Editar Categoría ──────────────────────────────────────── */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null)
            editForm.reset()
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Categoría</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleUpdate)}>
            <CategoryFormFields form={editForm} isLoading={updating} fieldPrefix="edit" />
            <DialogFooter className="mt-2">
              <Button
                variant="outline"
                type="button"
                disabled={updating}
                onClick={() => setEditTarget(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Confirm Dialog: Eliminar ─────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar Categoría"
        description={`¿Estás seguro de que deseas eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel="Eliminar"
        destructive
        loading={deleting}
      />
    </div>
  )
}
