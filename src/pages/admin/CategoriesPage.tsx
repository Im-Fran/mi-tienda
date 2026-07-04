import React, { useState, useEffect, useMemo } from "react"
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
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
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
} from "@/hooks/useCategories"
import type { Category } from "@/api/types"
import { ApiError } from "@/api/client"

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

interface FlatItem {
  id: string
  name: string
  parentId: string | null
  sortOrder: number
  depth: number
}

function flattenTree(categories: Category[], depth = 0): FlatItem[] {
  const result: FlatItem[] = []
  for (const cat of categories) {
    result.push({
      id: cat.id,
      name: cat.name,
      parentId: cat.parentId,
      sortOrder: cat.sortOrder,
      depth,
    })
    if (cat.children.length > 0) {
      result.push(...flattenTree(cat.children, depth + 1))
    }
  }
  return result
}

function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback
}

// ─── Root Drop Zone ───────────────────────────────────────────────────────────

function RootDropZone({ visible }: { visible: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: "root-zone" })

  if (!visible) return null

  return (
    <div
      ref={setNodeRef}
      className={[
        "mb-2 flex items-center justify-center rounded-lg border-2 border-dashed py-3 text-sm font-medium transition-colors select-none",
        isOver
          ? "border-primary bg-primary/10 text-primary"
          : "border-muted-foreground/30 text-muted-foreground",
      ].join(" ")}
    >
      Soltar aquí para hacer categoría raíz
    </div>
  )
}

// ─── Form Fields ──────────────────────────────────────────────────────────────

interface FormFieldsProps {
  form: ReturnType<typeof useForm<CategoryFormValues>>
  isLoading: boolean
  fieldPrefix?: string
}

function CategoryFormFields({ form, isLoading, fieldPrefix = "cat" }: FormFieldsProps) {
  const watchedName = form.watch("name")

  // Auto-generar slug desde el nombre solo cuando el campo está vacío
  useEffect(() => {
    const currentSlug = form.getValues("slug")
    if (!currentSlug) {
      form.setValue("slug", slugify(watchedName), { shouldValidate: false })
    }
  // Solo reaccionar al cambio de nombre
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedName])

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
          {...form.register("slug")}
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

// ─── Category Node ────────────────────────────────────────────────────────────

interface CategoryNodeProps {
  cat: Category
  depth: number
  isDragActive: boolean
  onEdit: (cat: Category) => void
  onDelete: (cat: Category) => void
  onAddChild: (parent: Category) => void
}

function CategoryNode({
  cat,
  depth,
  isDragActive,
  onEdit,
  onDelete,
  onAddChild,
}: CategoryNodeProps) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = cat.children.length > 0

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cat.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={[
          "flex items-center gap-1.5 rounded-md py-1.5 pr-2 group transition-colors hover:bg-muted/50",
          isDragging ? "opacity-40" : "",
        ].join(" ")}
        style={{ paddingLeft: `${depth * 20 + 4}px` }}
      >
        {/* Handle de arrastre */}
        <button
          className="cursor-grab touch-none text-muted-foreground opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
          {...listeners}
          {...attributes}
          aria-label="Arrastrar para reordenar"
          type="button"
          tabIndex={-1}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Toggle expandir / colapsar */}
        <button
          className="h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-foreground flex-shrink-0"
          onClick={() => setExpanded(!expanded)}
          type="button"
          aria-label={expanded ? "Colapsar" : "Expandir"}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
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
              /{cat.slug}
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

      {/* Hijos */}
      {expanded && hasChildren && (
        <div>
          {cat.children.map((child) => (
            <CategoryNode
              key={child.id}
              cat={child}
              depth={depth + 1}
              isDragActive={isDragActive}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function CategoriesPage() {
  const { storeId } = useParams<{ storeId: string }>()

  const { data: categories, isLoading, isError, refetch } = useCategories(storeId!)
  const { mutateAsync: createCategory, isPending: creating } = useCreateCategory(storeId!)
  const { mutateAsync: updateCategory, isPending: updating } = useUpdateCategory(storeId!)
  const { mutateAsync: deleteCategory, isPending: deleting } = useDeleteCategory(storeId!)

  // Estado de modales
  const [addRootOpen, setAddRootOpen] = useState(false)
  const [addChildTarget, setAddChildTarget] = useState<Category | null>(null)
  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  // Estado del drag activo
  const [activeDragId, setActiveDragId] = useState<string | null>(null)

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

  // Lista plana para el contexto de DnD
  const flatItems = useMemo(() => flattenTree(categories ?? []), [categories])
  const sortableIds = useMemo(() => flatItems.map((i) => i.id), [flatItems])

  // Nombre del item siendo arrastrado (para el overlay)
  const activeDragName = useMemo(
    () => (activeDragId ? flatItems.find((i) => i.id === activeDragId)?.name ?? null : null),
    [activeDragId, flatItems]
  )

  // Sensores de DnD — activar con 8px de distancia para evitar conflictos con clicks
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
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

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveDragId(null)

    if (!over || active.id === over.id) return

    const activeId = active.id as string

    // Soltar en la zona raíz → convertir en categoría de nivel superior
    if (over.id === "root-zone") {
      try {
        await updateCategory({ id: activeId, data: { parentId: null } })
        toast.success("Categoría movida a nivel raíz")
      } catch (err) {
        toast.error(getErrorMessage(err, "Error al mover la categoría"))
      }
      return
    }

    const activeItem = flatItems.find((i) => i.id === activeId)
    const overItem = flatItems.find((i) => i.id === over.id)
    if (!activeItem || !overItem) return

    if (activeItem.parentId === overItem.parentId) {
      // Mismo nivel → reordenar usando el sortOrder del destino
      try {
        await updateCategory({ id: activeId, data: { sortOrder: overItem.sortOrder } })
        toast.success("Orden actualizado")
      } catch (err) {
        toast.error(getErrorMessage(err, "Error al reordenar"))
      }
    } else {
      // Nivel diferente → re-parentar: active pasa a ser hijo de over
      try {
        await updateCategory({ id: activeId, data: { parentId: over.id as string } })
        toast.success(`Categoría movida dentro de "${overItem.name}"`)
      } catch (err) {
        toast.error(getErrorMessage(err, "Error al reasignar la categoría"))
      }
    }
  }

  // ─── Estados de carga y error ────────────────────────────────────────────────

  if (isLoading) return <LoadingSpinner className="py-16" />
  if (isError) return <ErrorState message="Error al cargar las categorías" retry={refetch} />

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
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <div className="rounded-xl border bg-card">
            <div className="p-3">
              {/* Zona drop para hacer raíz — visible solo durante drag */}
              <RootDropZone visible={!!activeDragId} />

              {!categories || categories.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No hay categorías aún. Crea tu primera categoría raíz.
                </p>
              ) : (
                <div className="flex flex-col">
                  {categories.map((cat) => (
                    <CategoryNode
                      key={cat.id}
                      cat={cat}
                      depth={0}
                      isDragActive={!!activeDragId}
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
        <DragOverlay dropAnimation={null}>
          {activeDragName && (
            <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm font-medium shadow-lg opacity-95 cursor-grabbing">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              {activeDragName}
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
