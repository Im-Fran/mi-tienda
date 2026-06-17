import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStores, useStoreSettings } from "@/hooks/useStores"

export function CheckoutSuccessPage() {
  const { storeSlug } = useParams<{ storeSlug: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const orderId = searchParams.get("orderId")
  const paymentType = searchParams.get("paymentType")

  const { data: stores } = useStores()
  const store = stores?.find((s) => s.slug === storeSlug)
  const storeId = store?.id ?? ""

  const { data: settings } = useStoreSettings(storeId)

  const isBankTransfer = paymentType === "bank_transfer"

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
      <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
      {orderId && (
        <p className="text-muted-foreground mb-2">
          Order ID: <span className="font-mono text-sm">{orderId.slice(0, 12)}...</span>
        </p>
      )}
      <p className="text-muted-foreground mb-8">
        Thank you for your purchase. You will receive a confirmation email shortly.
      </p>

      {isBankTransfer && settings?.bankTransferInfo && (
        <Card className="border-blue-200 bg-blue-50 text-left mb-8">
          <CardHeader>
            <CardTitle className="text-blue-900 text-base">Bank Transfer Instructions</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-blue-800">
            <p className="font-medium">Please transfer the order total to the following account:</p>
            <div className="space-y-1 mt-3">
              <p><span className="font-medium">Bank:</span> {settings.bankTransferInfo.bankName}</p>
              <p><span className="font-medium">Account type:</span> {settings.bankTransferInfo.accountType}</p>
              <p><span className="font-medium">Account number:</span> {settings.bankTransferInfo.accountNumber}</p>
              <p><span className="font-medium">Account holder:</span> {settings.bankTransferInfo.holderName}</p>
              <p><span className="font-medium">Holder document:</span> {settings.bankTransferInfo.holderDocument}</p>
              <p><span className="font-medium">Contact email:</span> {settings.bankTransferInfo.email}</p>
            </div>
            {settings.bankTransferInfo.instructions && (
              <p className="mt-3 text-blue-700 italic">{settings.bankTransferInfo.instructions}</p>
            )}
          </CardContent>
        </Card>
      )}

      <Button onClick={() => navigate(`/store/${storeSlug}/products`)}>
        Continue Shopping
      </Button>
    </div>
  )
}
