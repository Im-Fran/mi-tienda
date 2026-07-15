import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable, type Column } from "@/components/shared/DataTable"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { ErrorState } from "@/components/shared/ErrorState"
import { useProducts, useUpdateProduct, useDeleteProduct } from "@/hooks/useProducts"
import { formatCurrency } from "@/lib/utils"
import type { Product } from "@/api/types"
import { ApiError } from "@/api/client"

export function ProductsPage() {
  const { storeId } = useParams<{ storeId: string }>()
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | "physical" | "digital">("all")
  const [activeFilter, setActiveFilter] = useState<"all" | "true" | "false">("all")
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)

  const params = {
    search: search || undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
    active: activeFilter !== "all" ? activeFilter : undefined,
    page,
    perPage: 20,
  }

  const { data, isLoading, isError, error, refetch } = useProducts(storeId!, params)
  const { mutate: updateProduct } = useUpdateProduct(storeId!, "")
  const { mutate: deleteProduct, isPending: deleting } = useDeleteProduct(storeId!)

  if (isLoading) return <LoadingSpinner className="py-16" />
  if (isError) return <ErrorState message="Failed to load products" error={error} retry={refetch} />

  function handleToggleActive(product: Product) {
    updateProduct(
      { isActive: !product.isActive },
      {
        onError: (err) => {
          const msg = err instanceof ApiError ? err.message : "Update failed"
          toast.error(msg)
        },
      }
    )
  }

  const columns: Column<Product>[] = [
    {
      key: "name",
      header: "Name",
      cell: (p) => <span className="font-medium">{p.name}</span>,
    },
    {
      key: "type",
      header: "Type",
      cell: (p) => <Badge variant="outline">{p.type}</Badge>,
    },
    {
      key: "variants",
      header: "Variants",
      cell: (p) => <span className="text-muted-foreground">{p.variants.length}</span>,
    },
    {
      key: "price",
      header: "Price (from)",
      cell: (p) => {
        const minPrice = Math.min(...(p.variants.map((v) => v.price).filter((x) => x >= 0)))
        return minPrice === Infinity ? "-" : formatCurrency(minPrice, "$")
      },
    },
    {
      key: "active",
      header: "Active",
      cell: (p) => (
        <Switch
          checked={p.isActive}
          onCheckedChange={() => handleToggleActive(p)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (p) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/admin/stores/${storeId}/products/${p.id}`)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={() => setDeleteTarget(p)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Products"
        actions={
          <Button onClick={() => navigate(`/admin/stores/${storeId}/products/new`)}>
            <Plus className="h-4 w-4 mr-2" />
            New Product
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data?.products ?? []}
        pagination={data?.pagination}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search products..."
        filters={
          <>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="physical">Physical</SelectItem>
                <SelectItem value="digital">Digital</SelectItem>
              </SelectContent>
            </Select>
            <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as typeof activeFilter)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Product"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={() => {
          if (!deleteTarget) return
          deleteProduct(deleteTarget.id, {
            onSuccess: () => {
              toast.success("Product deleted")
              setDeleteTarget(null)
            },
            onError: (err) => {
              const msg = err instanceof ApiError ? err.message : "Delete failed"
              toast.error(msg)
              setDeleteTarget(null)
            },
          })
        }}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel="Delete"
        destructive
        loading={deleting}
      />
    </div>
  )
}
