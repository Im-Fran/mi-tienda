import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable, type Column } from "@/components/shared/DataTable"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { ErrorState } from "@/components/shared/ErrorState"
import { EmptyState } from "@/components/shared/EmptyState"
import { useMyOrders } from "@/hooks/useCustomers"
import { formatDate, formatCurrency, truncate } from "@/lib/utils"
import type { Order } from "@/api/types"

export function OrderHistoryPage() {
  const { storeSlug } = useParams<{ storeSlug: string }>()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, refetch } = useMyOrders(page)

  if (isLoading) return <LoadingSpinner className="py-16" />
  if (isError) return <ErrorState message="Failed to load orders" retry={refetch} />

  const columns: Column<Order>[] = [
    { key: "id", header: "Order", cell: (o) => <span className="font-mono text-xs">{truncate(o.id, 12)}</span> },
    { key: "status", header: "Status", cell: (o) => <StatusBadge status={o.status} /> },
    { key: "total", header: "Total", cell: (o) => formatCurrency(o.total, "$") },
    { key: "date", header: "Date", cell: (o) => formatDate(o.createdAt) },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <PageHeader title="My Orders" />
      {!data?.orders?.length ? (
        <EmptyState
          message="You haven't placed any orders yet."
          action={{ label: "Browse products", onClick: () => navigate(`/store/${storeSlug}/products`) }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={data.orders}
          pagination={data.pagination}
          onPageChange={setPage}
          onRowClick={(o) => navigate(`/store/${storeSlug}/orders/${o.id}`)}
        />
      )}
    </div>
  )
}
