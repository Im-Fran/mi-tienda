import { FolderOpen, Tag } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { Category } from "@/api/types"

export function CategoryCheckboxTree({
  categories,
  selected,
  onToggle,
  depth = 0,
}: {
  categories: Category[]
  selected: string[]
  onToggle: (id: string) => void
  depth?: number
}) {
  return (
    <div className={cn(depth > 0 && "ml-3 border-l border-border pl-3")}>
      {categories.map((cat) => (
        <div key={cat.id}>
          <div className="flex items-center gap-2 py-1.5 px-1 rounded-md hover:bg-muted/50 transition-colors">
            {cat.children.length > 0
              ? <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              : <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
            <Checkbox
              id={`cat-${cat.id}`}
              checked={selected.includes(cat.id)}
              onCheckedChange={() => onToggle(cat.id)}
            />
            <Label htmlFor={`cat-${cat.id}`} className="cursor-pointer text-sm font-normal">
              {cat.name}
            </Label>
          </div>
          {cat.children.length > 0 && (
            <CategoryCheckboxTree
              categories={cat.children}
              selected={selected}
              onToggle={onToggle}
              depth={depth + 1}
            />
          )}
        </div>
      ))}
    </div>
  )
}
