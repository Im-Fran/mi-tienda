import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable, type Column } from "@/components/shared/DataTable"
import { ProviderBadge } from "@/components/shared/ProviderBadge"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { ErrorState } from "@/components/shared/ErrorState"
import { useCustomers } from "@/hooks/useCustomers"
import { formatDate } from "@/lib/utils"
import type { Customer } from "@/api/types"

export function CustomersPage() {
  const { storeId } = useParams<{ storeId: string }>()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, error, refetch } = useCustomers(storeId!, page)

  if (isLoading) return <LoadingSpinner className="py-16" />
  if (isError) return <ErrorState message="Failed to load customers" error={error} retry={refetch} />

  const columns: Column<Customer>[] = [
    {
      key: "name",
      header: "Name",
      cell: (c) => <span className="font-medium">{c.name ?? "-"}</span>,
    },
    {
      key: "email",
      header: "Email",
      cell: (c) => <span className="text-muted-foreground">{c.email}</span>,
    },
    {
      key: "provider",
      header: "Auth",
      cell: (c) => <ProviderBadge provider={c.provider} />,
    },
    {
      key: "joined",
      header: "Joined",
      cell: (c) => <span className="text-muted-foreground text-sm">{formatDate(c.createdAt)}</span>,
    },
  ]

  return (
    <div>
      <PageHeader title="Customers" />
      <DataTable
        columns={columns}
        data={data?.customers ?? []}
        pagination={data?.pagination}
        onPageChange={setPage}
        onRowClick={(c) => navigate(`/admin/stores/${storeId}/customers/${c.id}`)}
      />
    </div>
  )
}
