import type React from "react"
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown, GripVertical } from "lucide-react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { FlatCategory } from "@/lib/categoryTree"
import type { Category } from "@/api/types"
import { INDENTATION_WIDTH } from "../index"

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

export function CategoryRow({
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
