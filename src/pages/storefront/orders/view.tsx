import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { ErrorState } from "@/components/shared/ErrorState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { useMyOrder } from "@/hooks/useCustomers"
import { useStores, useStoreSettings } from "@/hooks/useStores"
import { formatDate, formatCurrency, truncate } from "@/lib/utils"

export function StorefrontOrderDetailPage() {
  const { storeSlug, id } = useParams<{ storeSlug: string; id: string }>()
  const navigate = useNavigate()
  const { data: order, isLoading, isError, error, refetch } = useMyOrder(id!)
  const { data: stores } = useStores()
  const store = stores?.find((s) => s.slug === storeSlug)
  const { data: settings } = useStoreSettings(store?.id ?? "")

  if (isLoading) return <LoadingSpinner className="py-16" />
  if (isError || !order) return <ErrorState message="Order not found" error={error} retry={refetch} />

  const symbol = settings?.currencySymbol ?? "$"
  const decimals = settings?.decimalPlaces ?? 2
  const separator = settings?.decimalSeparator ?? "."

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Order {truncate(order.id, 12)}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={order.status} />
        </div>
      </div>

      <Card className="mb-4">
        <CardHeader><CardTitle className="text-sm">Items</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">{item.productSnapshot.productName}</p>
                  <p className="text-xs text-muted-foreground">{item.productSnapshot.variantName}</p>
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

      {order.shippingSnapshot && (
        <Card className="mb-4">
          <CardHeader><CardTitle className="text-sm">Shipping Address</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>{order.shippingSnapshot.addressLine1}</p>
            {order.shippingSnapshot.addressLine2 && <p>{order.shippingSnapshot.addressLine2}</p>}
            <p>{order.shippingSnapshot.city}, {order.shippingSnapshot.countryCode}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
