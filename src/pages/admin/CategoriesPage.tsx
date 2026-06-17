import { useState } from "react"
import { useParams } from "react-router-dom"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { ErrorState } from "@/components/shared/ErrorState"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useCategories"
import type { Category } from "@/api/types"
import { ApiError } from "@/api/client"

interface CategoryNodeProps {
  cat: Category
  storeId: string
  onEdit: (cat: Category) => void
  onDelete: (cat: Category) => void
  onAddChild: (parentId: string) => void
  depth?: number
}

function CategoryNode({ cat, storeId, onEdit, onDelete, onAddChild, depth = 0 }: CategoryNodeProps) {
  const [open, setOpen] = useState(true)
  const hasChildren = cat.children.length > 0

  return (
    <div style={{ paddingLeft: depth * 20 }}>
      <div className="flex items-center gap-2 py-2 group">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setOpen(!open)}
        >
          {hasChildren ? (
            open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
          ) : <span className="h-3 w-3 block" />}
        </Button>
        <span className="flex-1 text-sm font-medium">{cat.name}</span>
        <span className="text-xs text-muted-foreground">/{cat.slug}</span>
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddChild(cat.id)}>
            <Plus className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(cat)}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Tooltip>
            <TooltipTrigger>
              <span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => onDelete(cat)}
                  disabled={hasChildren}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </span>
            </TooltipTrigger>
            {hasChildren && (
              <TooltipContent>Cannot delete category with subcategories</TooltipContent>
            )}
          </Tooltip>
        </div>
      </div>
      {open && hasChildren && (
        <div>
          {cat.children.map((child) => (
            <CategoryNode
              key={child.id}
              cat={child}
              storeId={storeId}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function CategoriesPage() {
  const { storeId } = useParams<{ storeId: string }>()
  const { data: categories, isLoading, isError, refetch } = useCategories(storeId!)
  const { mutateAsync: createCategory } = useCreateCategory(storeId!)
  const { mutateAsync: updateCategory } = useUpdateCategory(storeId!)
  const { mutateAsync: deleteCategory, isPending: deleting } = useDeleteCategory(storeId!)

  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [editName, setEditName] = useState("")
  const [addParentId, setAddParentId] = useState<string | null>(null)
  const [newName, setNewName] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  if (isLoading) return <LoadingSpinner className="py-16" />
  if (isError) return <ErrorState message="Failed to load categories" retry={refetch} />

  async function handleCreate() {
    if (!newName.trim()) return
    try {
      await createCategory({ name: newName.trim(), parentId: addParentId ?? undefined })
      toast.success("Category created")
      setNewName("")
      setAddParentId(null)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to create"
      toast.error(msg)
    }
  }

  async function handleUpdate() {
    if (!editTarget || !editName.trim()) return
    try {
      await updateCategory({ id: editTarget.id, data: { name: editName.trim() } })
      toast.success("Category updated")
      setEditTarget(null)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to update"
      toast.error(msg)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteCategory({ id: deleteTarget.id })
      toast.success("Category deleted")
      setDeleteTarget(null)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to delete"
      toast.error(msg)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Categories"
        actions={
          <Button onClick={() => { setAddParentId(null); setNewName("") }} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Root Category
          </Button>
        }
      />

      {/* Inline add form */}
      {addParentId !== undefined && (
        <div className="flex gap-2 mb-4">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={addParentId ? "Subcategory name" : "Root category name"}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate() }}
            autoFocus
          />
          <Button onClick={handleCreate}>Add</Button>
          <Button variant="outline" onClick={() => setAddParentId(undefined as unknown as null)}>
            Cancel
          </Button>
        </div>
      )}

      {/* Inline edit form */}
      {editTarget && (
        <div className="flex gap-2 mb-4 bg-muted/50 p-3 rounded-md">
          <span className="text-sm text-muted-foreground self-center">Editing:</span>
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleUpdate() }}
            autoFocus
          />
          <Button onClick={handleUpdate}>Save</Button>
          <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
        </div>
      )}

      <div className="rounded-md border bg-card">
        {!categories || categories.length === 0 ? (
          <p className="text-muted-foreground text-sm p-4">No categories yet.</p>
        ) : (
          <div className="p-2">
            {categories.map((cat) => (
              <CategoryNode
                key={cat.id}
                cat={cat}
                storeId={storeId!}
                onEdit={(c) => { setEditTarget(c); setEditName(c.name) }}
                onDelete={(c) => setDeleteTarget(c)}
                onAddChild={(parentId) => { setAddParentId(parentId); setNewName("") }}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Category"
        description={`Delete "${deleteTarget?.name}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel="Delete"
        destructive
        loading={deleting}
      />
    </div>
  )
}
