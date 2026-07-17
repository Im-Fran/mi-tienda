import React, { useState, useEffect, useMemo, useRef } from "react"
import { useParams } from "react-router-dom"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
  GripVertical,
} from "lucide-react"
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
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
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
  type FlatCategory,
} from "@/lib/categoryTree"
import type { Category } from "@/api/types"
import { getErrorMessage } from "@/lib/errors"

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

type CategoryFormValues = z.infer<typeof categorySchema>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

// ─── Constantes de DnD ────────────────────────────────────────────────────────

/** Ancho de sangría por nivel (px). También define el paso horizontal del drag. */
const INDENTATION_WIDTH = 20

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

// ─── Form Fields ──────────────────────────────────────────────────────────────

interface FormFieldsProps {
  form: ReturnType<typeof useForm<CategoryFormValues>>
  isLoading: boolean
  fieldPrefix?: string
}

function CategoryFormFields({ form, isLoading, fieldPrefix = "cat" }: FormFieldsProps) {
  const watchedName = form.watch("name")
  // ponytail: ref evita re-renders; se sincroniza con defaultValues para detectar reset() del form
  const slugLocked = useRef(false)

  // Al hacer reset() cambian los defaultValues: si el slug ya tiene valor (modo editar) → lock
  const defaultSlug = (form.formState.defaultValues as { slug?: string } | undefined)?.slug ?? ""
  useEffect(() => {
    slugLocked.current = !!defaultSlug
  }, [defaultSlug])

  // Auto-generar slug mientras el usuario escribe el nombre, salvo que esté lockeado
  useEffect(() => {
    if (!slugLocked.current) {
      form.setValue("slug", slugify(watchedName), { shouldValidate: false })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedName])

  const { onChange: slugOnChange, ...slugRegisterRest } = form.register("slug")

  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${fieldPrefix}-name`}>Nombre *</Label>
        <Input
          id={`${fieldPrefix}-name`}
          placeholder="Ej: Electrónica"
          disabled={isLoading}
          aria-invalid={!!form.formState.errors.name}
          autoFocus
          {...form.register("name")}
        />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${fieldPrefix}-slug`}>Slug</Label>
        <Input
          id={`${fieldPrefix}-slug`}
          placeholder="auto-generado desde el nombre"
          disabled={isLoading}
          aria-invalid={!!form.formState.errors.slug}
          {...slugRegisterRest}
          onChange={(e) => {
            slugLocked.current = true
            slugOnChange(e)
          }}
        />
        {form.formState.errors.slug && (
          <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${fieldPrefix}-description`}>Descripción</Label>
        <Textarea
          id={`${fieldPrefix}-description`}
          placeholder="Descripción opcional de la categoría..."
          disabled={isLoading}
          {...form.register("description")}
        />
      </div>
    </div>
  )
}

// ─── Category Row ─────────────────────────────────────────────────────────────
// Fila plana del árbol: los hijos NO se renderizan dentro del nodo sortable,
// la jerarquía se representa solo con la sangría (paddingLeft por depth).

interface CategoryRowProps {
  item: FlatCategory
  /** Profundidad a renderizar (la proyectada cuando la fila es el indicador) */
  depth: number
  /** La fila es el ítem activo del drag → se muestra como indicador de drop */
  ghost: boolean
  collapsed: boolean
  onToggleCollapse: (id: string) => void
  onEdit: (cat: Category) => void
  onDelete: (cat: Category) => void
  onAddChild: (parent: Category) => void
}

function CategoryRow({
  item,
  depth,
  ghost,
  collapsed,
  onToggleCollapse,
  onEdit,
  onDelete,
  onAddChild,
}: CategoryRowProps) {
  const cat = item.category
  const hasChildren = cat.children.length > 0

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.id,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Indicador de drop: línea con la sangría proyectada (estilo Notion)
  if (ghost) {
    return (
      <div ref={setNodeRef} style={style} className="py-1.5" aria-hidden>
        <div
          className="relative h-1.5 rounded-full bg-primary/60"
          style={{ marginLeft: `${depth * INDENTATION_WIDTH + 4}px` }}
        >
          <span className="absolute -left-1 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-primary bg-background" />
        </div>
      </div>
    )
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className="flex items-center gap-1.5 rounded-md py-1.5 pr-2 group transition-colors hover:bg-muted/50"
        style={{ paddingLeft: `${depth * INDENTATION_WIDTH + 4}px` }}
      >
        {/* Handle de arrastre (accesible por teclado) */}
        <button
          className="cursor-grab touch-none text-muted-foreground opacity-0 group-hover:opacity-60 focus-visible:opacity-100 hover:opacity-100 transition-opacity flex-shrink-0"
          {...attributes}
          {...listeners}
          aria-label={`Arrastrar "${cat.name}" para reordenar`}
          type="button"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Toggle expandir / colapsar */}
        <button
          className="h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-foreground flex-shrink-0"
          onClick={() => onToggleCollapse(item.id)}
          type="button"
          aria-label={collapsed ? "Expandir" : "Colapsar"}
        >
          {hasChildren ? (
            collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )
          ) : (
            <span className="h-3.5 w-3.5 block" />
          )}
        </button>

        {/* Contenido: nombre, slug, descripción, badge */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium truncate">{cat.name}</span>
            <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
              {item.slugPath}
            </span>
            {hasChildren && (
              <Badge variant="secondary" className="shrink-0">
                {cat.children.length}{" "}
                {cat.children.length === 1 ? "subcategoría" : "subcategorías"}
              </Badge>
            )}
          </div>
          {cat.description && (
            <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
              {cat.description}
            </p>
          )}
        </div>

        {/* Acciones */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity flex-shrink-0">
          <Tooltip>
            <TooltipTrigger render={<span className="inline-flex" />}>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onAddChild(cat)}
                type="button"
                aria-label="Agregar subcategoría"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Agregar subcategoría</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger render={<span className="inline-flex" />}>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onEdit(cat)}
                type="button"
                aria-label="Editar categoría"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Editar</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger render={<span className="inline-flex" />}>
              <Button
                variant="ghost"
                size="icon-sm"
                className={hasChildren ? "" : "text-destructive"}
                onClick={() => onDelete(cat)}
                disabled={hasChildren}
                type="button"
                aria-label="Eliminar categoría"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            {hasChildren && (
              <TooltipContent>
                No se puede eliminar una categoría con subcategorías
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </div>
    </div>
  )
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
