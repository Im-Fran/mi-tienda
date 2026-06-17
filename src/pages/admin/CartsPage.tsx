import { useState } from "react"
import { useParams } from "react-router-dom"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable, type Column } from "@/components/shared/DataTable"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { ErrorState } from "@/components/shared/ErrorState"
import { useAdminCarts, useAdminCart } from "@/hooks/useCarts"
import { formatDate, formatCurrency, truncate } from "@/lib/utils"
import type { Cart } from "@/api/types"

function CartsTab({ storeId, status }: { storeId: string; status: "pending" | "completed" }) {
  const [page, setPage] = useState(1)
  const [selectedCartId, setSelectedCartId] = useState<string | null>(null)
  const { data, isLoading, isError, refetch } = useAdminCarts(storeId, { status, page })
  const { data: cartDetail } = useAdminCart(storeId, selectedCartId ?? "")

  if (isLoading) return <LoadingSpinner className="py-8" />
  if (isError) return <ErrorState message="Failed to load carts" retry={refetch} />

  const columns: Column<Cart>[] = [
    { key: "id", header: "Cart ID", cell: (c) => <span className="font-mono text-xs">{truncate(c.id, 12)}</span> },
    { key: "customer", header: "Customer", cell: (c) => c.customerId ? truncate(c.customerId, 12) : <Badge variant="outline">Guest</Badge> },
    { key: "items", header: "Items", cell: (c) => c.items.length },
    { key: "date", header: "Created", cell: (c) => formatDate(c.createdAt) },
  ]

  return (
    <>
      <DataTable
        columns={columns}
        data={data?.carts ?? []}
        pagination={data?.pagination}
        onPageChange={setPage}
        onRowClick={(c) => setSelectedCartId(c.id)}
      />

      <Sheet open={!!selectedCartId} onOpenChange={(o) => { if (!o) setSelectedCartId(null) }}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Cart Detail</SheetTitle>
          </SheetHeader>
          {cartDetail ? (
            <div className="mt-6 space-y-4">
              <div className="text-sm space-y-1">
                <p><span className="font-medium">ID:</span> <span className="font-mono text-xs">{cartDetail.id}</span></p>
                <p><span className="font-medium">Status:</span> {cartDetail.status}</p>
                <p><span className="font-medium">Customer:</span> {cartDetail.customerId ?? "Guest"}</p>
                <p><span className="font-medium">Created:</span> {formatDate(cartDetail.createdAt)}</p>
              </div>
              <div>
                <p className="font-medium mb-2">Items ({cartDetail.items.length})</p>
                <div className="space-y-2">
                  {cartDetail.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm border rounded p-2">
                      <div>
                        <p className="font-mono text-xs text-muted-foreground">{truncate(item.variantId, 12)}</p>
                        <p>Qty: {item.quantity}</p>
                      </div>
                      <p>{formatCurrency(item.unitPrice, "$")}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <LoadingSpinner className="py-8" />
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

export function CartsPage() {
  const { storeId } = useParams<{ storeId: string }>()

  return (
    <div>
      <PageHeader title="Carts" />
      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <CartsTab storeId={storeId!} status="pending" />
        </TabsContent>
        <TabsContent value="completed">
          <CartsTab storeId={storeId!} status="completed" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
