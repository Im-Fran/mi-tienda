import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { ErrorState } from "@/components/shared/ErrorState"
import { ProviderBadge } from "@/components/shared/ProviderBadge"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { DataTable, type Column } from "@/components/shared/DataTable"
import { useCustomer } from "@/hooks/useCustomers"
import { useOrders } from "@/hooks/useOrders"
import { formatDate, formatCurrency } from "@/lib/utils"
import type { Order } from "@/api/types"

export function CustomerDetailPage() {
  const { storeId, id } = useParams<{ storeId: string; id: string }>()
  const navigate = useNavigate()
  const { data: customer, isLoading, isError, error, refetch } = useCustomer(storeId!, id!)
  const { data: ordersData } = useOrders(storeId!)

  if (isLoading) return <LoadingSpinner className="py-16" />
  if (isError || !customer) return <ErrorState message="Customer not found" error={error} retry={refetch} />

  const initials = customer.name
    ? customer.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : customer.email[0].toUpperCase()

  const customerOrders = ordersData?.orders.filter((o) => o.customerId === id) ?? []

  const orderColumns: Column<Order>[] = [
    { key: "id", header: "Order ID", cell: (o) => <span className="font-mono text-xs">{o.id.slice(0, 8)}...</span> },
    { key: "status", header: "Status", cell: (o) => <StatusBadge status={o.status} /> },
    { key: "total", header: "Total", cell: (o) => formatCurrency(o.total, "$") },
    { key: "date", header: "Date", cell: (o) => formatDate(o.createdAt) },
  ]

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title="Customer Detail" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="md:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <Avatar className="h-16 w-16 mb-3">
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <p className="font-semibold">{customer.name ?? "—"}</p>
            <p className="text-sm text-muted-foreground">{customer.email}</p>
            <div className="mt-3">
              <ProviderBadge provider={customer.provider} />
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              <p>Joined {formatDate(customer.createdAt)}</p>
              {customer.phone && <p className="mt-1">{customer.phone}</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Order History</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={orderColumns}
              data={customerOrders}
              onRowClick={(o) => navigate(`/admin/stores/${storeId}/orders/${o.id}`)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
