import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { Minus, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { ErrorState } from "@/components/shared/ErrorState"
import { EmptyState } from "@/components/shared/EmptyState"
import { useCart, useUpdateCartItem, useRemoveCartItem, useApplyCoupon, useRemoveCoupon } from "@/hooks/useCarts"
import { useCartStore } from "@/stores/cart.store"
import { useStores } from "@/hooks/useStores"
import { useStoreSettings } from "@/hooks/useStores"
import { formatCurrency } from "@/lib/utils"
import { ApiError } from "@/api/client"

export function CartPage() {
  const { storeSlug } = useParams<{ storeSlug: string }>()
  const navigate = useNavigate()
  const [couponCode, setCouponCode] = useState("")
  const [couponError, setCouponError] = useState("")

  const { data: stores } = useStores()
  const store = stores?.find((s) => s.slug === storeSlug)
  const storeId = store?.id ?? ""

  const { data: settings } = useStoreSettings(storeId)
  const { data: cart, isLoading, isError, refetch } = useCart(storeId)
  const { mutateAsync: updateItem } = useUpdateCartItem(storeId)
  const { mutateAsync: removeItem } = useRemoveCartItem(storeId)
  const { mutateAsync: applyCoupon, isPending: applyingCoupon } = useApplyCoupon(storeId)
  const { mutateAsync: removeCoupon } = useRemoveCoupon(storeId)

  const cartId = useCartStore((s) => s.cartId)
  const symbol = settings?.currencySymbol ?? "$"
  const decimals = settings?.decimalPlaces ?? 2
  const separator = settings?.decimalSeparator ?? "."

  if (!cartId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <EmptyState
          message="Your cart is empty."
          action={{ label: "Browse products", onClick: () => navigate(`/store/${storeSlug}/products`) }}
        />
      </div>
    )
  }

  if (isLoading) return <LoadingSpinner className="py-16" />
  if (isError) return <ErrorState message="Failed to load cart" retry={refetch} />

  const items = cart?.items ?? []
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)

  async function handleApplyCoupon() {
    setCouponError("")
    try {
      await applyCoupon(couponCode)
      toast.success("Coupon applied!")
      setCouponCode("")
    } catch (err) {
      if (err instanceof ApiError && err.status === "fail") {
        const data = err.data as Record<string, string[]> | string | undefined
        if (typeof data === "string") {
          setCouponError(data)
        } else if (data && typeof data === "object") {
          const firstKey = Object.keys(data)[0]
          setCouponError(firstKey ? (data[firstKey]?.[0] ?? err.message) : err.message)
        } else {
          setCouponError(err.message)
        }
      } else {
        setCouponError("Invalid coupon")
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

      {items.length === 0 ? (
        <EmptyState
          message="Your cart is empty."
          action={{ label: "Browse products", onClick: () => navigate(`/store/${storeSlug}/products`) }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Line items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 border rounded-lg p-4">
                <div className="flex-1">
                  <p className="font-medium text-sm font-mono text-muted-foreground">{item.variantId.slice(0, 8)}...</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Unit: {formatCurrency(item.unitPrice, symbol, decimals, separator)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateItem({ itemId: item.id, quantity: item.quantity - 1 })}
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateItem({ itemId: item.id, quantity: item.quantity + 1 })}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">
                    {formatCurrency(item.unitPrice * item.quantity, symbol, decimals, separator)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-4 space-y-3">
                {/* Coupon */}
                {cart?.couponId ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-600">Coupon applied</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive h-7"
                      onClick={() => removeCoupon()}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Coupon code"
                        value={couponCode}
                        onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError("") }}
                        className="h-8 text-sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleApplyCoupon}
                        disabled={!couponCode || applyingCoupon}
                      >
                        Apply
                      </Button>
                    </div>
                    {couponError && (
                      <p className="text-xs text-destructive">{couponError}</p>
                    )}
                  </div>
                )}

                <Separator />

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal, symbol, decimals, separator)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(subtotal, symbol, decimals, separator)}</span>
                </div>

                <Button
                  className="w-full"
                  onClick={() => navigate(`/store/${storeSlug}/checkout`)}
                >
                  Proceed to Checkout
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
