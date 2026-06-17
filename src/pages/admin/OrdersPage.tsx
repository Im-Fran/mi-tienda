import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable, type Column } from "@/components/shared/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { ErrorState } from "@/components/shared/ErrorState"
import { useOrders } from "@/hooks/useOrders"
import { formatDate, formatCurrency, truncate } from "@/lib/utils"
import type { Order, OrderStatus } from "@/api/types"

const ALL_STATUSES: OrderStatus[] = [
  "pending_payment", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"
]

export function OrdersPage() {
  const { storeId } = useParams<{ storeId: string }>()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all")

  const { data, isLoading, isError, refetch } = useOrders(storeId!, {
    status: statusFilter !== "all" ? statusFilter : undefined,
    page,
  })

  if (isLoading) return <LoadingSpinner className="py-16" />
  if (isError) return <ErrorState message="Failed to load orders" retry={refetch} />

  const columns: Column<Order>[] = [
    { key: "id", header: "Order ID", cell: (o) => <span className="font-mono text-xs">{truncate(o.id, 12)}</span> },
    { key: "status", header: "Status", cell: (o) => <StatusBadge status={o.status} /> },
    { key: "total", header: "Total", cell: (o) => formatCurrency(o.total, "$") },
    { key: "customer", header: "Customer", cell: (o) => o.customerId ? truncate(o.customerId, 10) : o.guestSnapshot?.email ?? "Guest" },
    { key: "date", header: "Date", cell: (o) => formatDate(o.createdAt) },
  ]

  return (
    <div>
      <PageHeader title="Orders" />
      <DataTable
        columns={columns}
        data={data?.orders ?? []}
        pagination={data?.pagination}
        onPageChange={setPage}
        onRowClick={(o) => navigate(`/admin/stores/${storeId}/orders/${o.id}`)}
        filters={
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as OrderStatus | "all")}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
    </div>
  )
}
