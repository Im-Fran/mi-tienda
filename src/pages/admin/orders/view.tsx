import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { ErrorState } from "@/components/shared/ErrorState"
import { useOrder, useUpdateOrderStatus } from "@/hooks/useOrders"
import { useStoreSettings } from "@/hooks/useStores"
import { usePaymentMethods } from "@/hooks/usePayments"
import { formatDate, formatCurrency } from "@/lib/utils"
import type { OrderStatus } from "@/api/types"
import { ApiError } from "@/api/client"

const ALL_STATUSES: OrderStatus[] = [
  "pending_payment", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"
]

export function OrderDetailPage() {
  const { storeId, id } = useParams<{ storeId: string; id: string }>()
  const navigate = useNavigate()
  const { data: order, isLoading, isError, error, refetch } = useOrder(storeId!, id!)
  const { data: settings } = useStoreSettings(storeId!)
  const { data: paymentMethods } = usePaymentMethods(storeId!)
  const { mutate: updateStatus } = useUpdateOrderStatus(storeId!, id!)

  if (isLoading) return <LoadingSpinner className="py-16" />
  if (isError || !order) return <ErrorState message="Order not found" error={error} retry={refetch} />

  const symbol = settings?.currencySymbol ?? "$"
  const decimals = settings?.decimalPlaces ?? 2
  const separator = settings?.decimalSeparator ?? "."

  const paymentMethod = paymentMethods?.find((p) => p.id === order.paymentMethodId)
  const isBankTransfer = paymentMethod?.type === "bank_transfer"

  function handleStatusChange(status: OrderStatus) {
    updateStatus(status, {
      onSuccess: () => toast.success("Status updated"),
      onError: (err) => {
        const msg = err instanceof ApiError ? err.message : "Failed to update status"
        toast.error(msg)
      },
    })
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">Order <span className="font-mono text-base">{order.id.slice(0, 8)}...</span></h1>
          <StatusBadge status={order.status} />
        </div>
        <div className="ml-auto">
          <Select value={order.status} onValueChange={(v) => handleStatusChange(v as OrderStatus)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{item.productSnapshot.productName}</p>
                      <p className="text-xs text-muted-foreground">{item.productSnapshot.variantName}</p>
                      {item.productSnapshot.sku && (
                        <p className="text-xs text-muted-foreground">SKU: {item.productSnapshot.sku}</p>
                      )}
                    </div>
                    <div className="text-right text-sm">
                      <p>{formatCurrency(item.unitPrice, symbol, decimals, separator)} x {item.quantity}</p>
                      <p className="font-medium">{formatCurrency(item.totalPrice, symbol, decimals, separator)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(order.subtotal, symbol, decimals, separator)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(order.discountAmount, symbol, decimals, separator)}</span>
                  </div>
                )}
                {order.shippingAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{formatCurrency(order.shippingAmount, symbol, decimals, separator)}</span>
                  </div>
                )}
                {order.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{settings?.taxLabel ?? "Tax"}</span>
                    <span>{formatCurrency(order.taxAmount, symbol, decimals, separator)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span>{formatCurrency(order.total, symbol, decimals, separator)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {isBankTransfer && settings?.bankTransferInfo && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-base text-blue-900">Bank Transfer Details</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2 text-blue-800">
                <p><span className="font-medium">Bank:</span> {settings.bankTransferInfo.bankName}</p>
                <p><span className="font-medium">Account:</span> {settings.bankTransferInfo.accountNumber}</p>
                <p><span className="font-medium">Type:</span> {settings.bankTransferInfo.accountType}</p>
                <p><span className="font-medium">Holder:</span> {settings.bankTransferInfo.holderName}</p>
                <p><span className="font-medium">Document:</span> {settings.bankTransferInfo.holderDocument}</p>
                {settings.bankTransferInfo.instructions && (
                  <p className="mt-2 text-xs">{settings.bankTransferInfo.instructions}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Payment</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              <p><span className="text-muted-foreground">Method:</span> {paymentMethod?.type ?? "—"}</p>
              {paymentMethod?.providerName && (
                <p><span className="text-muted-foreground">Provider:</span> {paymentMethod.providerName}</p>
              )}
              {order.paymentReference && (
                <p><span className="text-muted-foreground">Ref:</span> {order.paymentReference}</p>
              )}
            </CardContent>
          </Card>

          {order.guestSnapshot && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Customer</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                <p className="font-medium">{order.guestSnapshot.name}</p>
                <p className="text-muted-foreground">{order.guestSnapshot.email}</p>
                {order.guestSnapshot.phone && <p>{order.guestSnapshot.phone}</p>}
                {order.guestSnapshot.idDocument && (
                  <p><span className="text-muted-foreground">ID:</span> {order.guestSnapshot.idDocument}</p>
                )}
              </CardContent>
            </Card>
          )}

          {order.shippingSnapshot && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Shipping Address</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-0.5">
                <p>{order.shippingSnapshot.addressLine1}</p>
                {order.shippingSnapshot.addressLine2 && <p>{order.shippingSnapshot.addressLine2}</p>}
                <p>{order.shippingSnapshot.city}{order.shippingSnapshot.state ? `, ${order.shippingSnapshot.state}` : ""}</p>
                <p>{order.shippingSnapshot.countryCode} {order.shippingSnapshot.postalCode}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-4 text-xs text-muted-foreground space-y-1">
              <p>Created: {formatDate(order.createdAt)}</p>
              <p>Updated: {formatDate(order.updatedAt)}</p>
              <p>Document: {order.documentType}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
