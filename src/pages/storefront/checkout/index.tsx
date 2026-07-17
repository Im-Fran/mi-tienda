import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { useCart } from "@/hooks/useCarts"
import { useStores, useStoreSettings } from "@/hooks/useStores"
import { usePaymentMethods } from "@/hooks/usePayments"
import { useShippingMethods } from "@/hooks/useShipping"
import { useCartStore } from "@/stores/cart.store"
import { useCustomerAuthStore } from "@/stores/auth.store"
import { checkout } from "@/api/endpoints/carts"
import { checkoutContactSchema, addressSchema } from "@/lib/validators"
import { formatCurrency } from "@/lib/utils"
import { ApiError } from "@/api/client"
import type { Resolver } from "react-hook-form"

type ContactForm = z.output<typeof checkoutContactSchema>
type AddressForm = z.output<typeof addressSchema>

const STEPS = ["Contact", "Shipping", "Billing", "Payment", "Review"]

export function CheckoutPage() {
  const { storeSlug } = useParams<{ storeSlug: string }>()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [sameAsBilling, setSameAsBilling] = useState(true)
  const [selectedPaymentId, setSelectedPaymentId] = useState("")
  const [selectedShippingId, setSelectedShippingId] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [contactData, setContactData] = useState<ContactForm | null>(null)
  const [shippingData, setShippingData] = useState<AddressForm | null>(null)
  const [billingData, setBillingData] = useState<AddressForm | null>(null)

  const { data: stores } = useStores()
  const store = stores?.find((s) => s.slug === storeSlug)
  const storeId = store?.id ?? ""

  const { data: settings } = useStoreSettings(storeId)
  const { data: paymentMethods } = usePaymentMethods(storeId)
  const { data: shippingMethods } = useShippingMethods(storeId)
  const cartId = useCartStore((s) => s.cartId)
  const clearCart = useCartStore((s) => s.clearCart)
  const { data: cart, isLoading } = useCart(storeId)
  const customerSession = useCustomerAuthStore((s) => s.session)

  const contactForm = useForm<ContactForm>({
    resolver: zodResolver(checkoutContactSchema) as Resolver<ContactForm>,
    defaultValues: { documentType: "receipt" },
  })

  const shippingForm = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
  })

  const billingForm = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
  })

  const symbol = settings?.currencySymbol ?? "$"
  const decimals = settings?.decimalPlaces ?? 2
  const separator = settings?.decimalSeparator ?? "."

  if (isLoading) return <LoadingSpinner className="py-16" />

  const items = cart?.items ?? []
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  const selectedShipping = shippingMethods?.find((m) => m.id === selectedShippingId)
  const selectedPayment = paymentMethods?.find((m) => m.id === selectedPaymentId)
  const total = subtotal + (selectedShipping?.cost ?? 0)

  async function handlePlaceOrder() {
    if (!cartId || !contactData || !shippingData || !selectedPaymentId) return
    setSubmitting(true)
    try {
      const result = await checkout(storeId, cartId, {
        guest: customerSession ? undefined : {
          name: contactData.name,
          email: contactData.email,
          phone: contactData.phone,
          idDocument: contactData.idDocument,
        },
        documentType: contactData.documentType,
        paymentMethodId: selectedPaymentId,
        shippingMethodId: selectedShippingId || undefined,
        shippingAddress: shippingData,
        billingAddress: sameAsBilling ? shippingData : billingData ?? undefined,
      })
      clearCart()
      navigate(`/store/${storeSlug}/checkout/success?orderId=${result.order.id}&paymentType=${selectedPayment?.type ?? ""}`)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Checkout failed"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  function stepDot(i: number) {
    return (
      <div
        key={i}
        className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium border-2 ${
          i === step
            ? "border-primary bg-primary text-primary-foreground"
            : i < step
            ? "border-green-500 bg-green-500 text-white"
            : "border-muted text-muted-foreground"
        }`}
      >
        {i + 1}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-1 shrink-0">
            {stepDot(i)}
            <span className={`text-xs ${i === step ? "font-medium" : "text-muted-foreground"}`}>{label}</span>
            {i < STEPS.length - 1 && <div className="h-px w-6 bg-muted" />}
          </div>
        ))}
      </div>

      {/* Step 0: Contact */}
      {step === 0 && (
        <form onSubmit={contactForm.handleSubmit((data) => { setContactData(data); setStep(1) })} className="space-y-4">
          <h2 className="font-semibold text-lg">Contact Information</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input {...contactForm.register("name")} />
              {contactForm.formState.errors.name && <p className="text-sm text-destructive">{contactForm.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" {...contactForm.register("email")} />
              {contactForm.formState.errors.email && <p className="text-sm text-destructive">{contactForm.formState.errors.email.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input {...contactForm.register("phone")} />
          </div>
          {settings?.requireCustomerIdDocument && (
            <div className="space-y-2">
              <Label>ID Document *</Label>
              <Input {...contactForm.register("idDocument")} />
            </div>
          )}
          <div className="space-y-2">
            <Label>Document type</Label>
            <RadioGroup
              value={contactForm.watch("documentType")}
              onValueChange={(v) => contactForm.setValue("documentType", v as "receipt" | "invoice")}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="receipt" id="doc-receipt" />
                <Label htmlFor="doc-receipt">Receipt</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="invoice" id="doc-invoice" />
                <Label htmlFor="doc-invoice">Invoice</Label>
              </div>
            </RadioGroup>
          </div>
          <Button type="submit" className="w-full">Continue to Shipping</Button>
        </form>
      )}

      {/* Step 1: Shipping */}
      {step === 1 && (
        <form onSubmit={shippingForm.handleSubmit((data) => { setShippingData(data); setStep(2) })} className="space-y-4">
          <h2 className="font-semibold text-lg">Shipping Address</h2>
          <div className="space-y-2">
            <Label>Address *</Label>
            <Input {...shippingForm.register("addressLine1")} placeholder="123 Main St" />
          </div>
          <div className="space-y-2">
            <Label>Address line 2</Label>
            <Input {...shippingForm.register("addressLine2")} placeholder="Apt 4B" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>City *</Label>
              <Input {...shippingForm.register("city")} />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input {...shippingForm.register("state")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Country *</Label>
              {settings?.countries && settings.countries.length > 0 ? (
                <Select onValueChange={(v) => { if (v) shippingForm.setValue("countryCode", v as string) }}>
                  <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent>
                    {settings.countries.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input {...shippingForm.register("countryCode")} placeholder="US" maxLength={2} />
              )}
            </div>
            <div className="space-y-2">
              <Label>Postal code</Label>
              <Input {...shippingForm.register("postalCode")} />
            </div>
          </div>

          {shippingMethods && shippingMethods.filter((m) => m.isActive).length > 0 && (
            <div className="space-y-2">
              <Label>Shipping method</Label>
              <RadioGroup value={selectedShippingId} onValueChange={setSelectedShippingId}>
                {shippingMethods.filter((m) => m.isActive).map((m) => (
                  <div key={m.id} className="flex items-center gap-2 border rounded p-3">
                    <RadioGroupItem value={m.id} id={`ship-${m.id}`} />
                    <Label htmlFor={`ship-${m.id}`} className="flex-1 cursor-pointer">
                      <span className="font-medium">{m.name}</span>
                      {m.estimatedDays && <span className="text-muted-foreground ml-2 text-sm">{m.estimatedDays} days</span>}
                    </Label>
                    <span className="font-medium">{formatCurrency(m.cost, symbol, decimals, separator)}</span>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setStep(0)}>Back</Button>
            <Button type="submit" className="flex-1">Continue to Billing</Button>
          </div>
        </form>
      )}

      {/* Step 2: Billing */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-lg">Billing Address</h2>
          <div className="flex items-center gap-2">
            <Checkbox
              id="same-as-shipping"
              checked={sameAsBilling}
              onCheckedChange={(v) => setSameAsBilling(!!v)}
            />
            <Label htmlFor="same-as-shipping">Same as shipping address</Label>
          </div>
          {!sameAsBilling && (
            <form onSubmit={billingForm.handleSubmit((data) => { setBillingData(data); setStep(3) })} className="space-y-3">
              <div className="space-y-2"><Label>Address *</Label><Input {...billingForm.register("addressLine1")} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>City *</Label><Input {...billingForm.register("city")} /></div>
                <div className="space-y-2">
                  <Label>Country *</Label>
                  <Input {...billingForm.register("countryCode")} placeholder="US" maxLength={2} />
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button type="submit" className="flex-1">Continue to Payment</Button>
              </div>
            </form>
          )}
          {sameAsBilling && (
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1" onClick={() => setStep(3)}>Continue to Payment</Button>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Payment */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-lg">Payment Method</h2>
          {paymentMethods && paymentMethods.filter((m) => m.isActive).length > 0 ? (
            <RadioGroup value={selectedPaymentId} onValueChange={setSelectedPaymentId}>
              {paymentMethods.filter((m) => m.isActive).map((m) => (
                <div key={m.id} className="border rounded p-4">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value={m.id} id={`pay-${m.id}`} />
                    <Label htmlFor={`pay-${m.id}`} className="cursor-pointer">
                      <span className="font-medium">{m.type.replace("_", " ")}</span>
                      {m.providerName && <span className="text-muted-foreground ml-2 text-sm">({m.providerName})</span>}
                    </Label>
                  </div>
                  {selectedPaymentId === m.id && m.type === "bank_transfer" && settings?.bankTransferInfo && (
                    <div className="mt-3 p-3 bg-blue-50 rounded text-sm space-y-1 text-blue-800">
                      <p className="font-medium">Bank transfer details:</p>
                      <p>Bank: {settings.bankTransferInfo.bankName}</p>
                      <p>Account: {settings.bankTransferInfo.accountNumber}</p>
                      <p>Holder: {settings.bankTransferInfo.holderName}</p>
                    </div>
                  )}
                </div>
              ))}
            </RadioGroup>
          ) : (
            <p className="text-muted-foreground text-sm">No payment methods available.</p>
          )}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
            <Button className="flex-1" disabled={!selectedPaymentId} onClick={() => setStep(4)}>Review Order</Button>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && contactData && (
        <div className="space-y-5">
          <h2 className="font-semibold text-lg">Review Your Order</h2>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Contact</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>{contactData.name} — {contactData.email}</p>
              {contactData.phone && <p>{contactData.phone}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Shipping</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {shippingData && <p>{shippingData.addressLine1}, {shippingData.city}, {shippingData.countryCode}</p>}
              {selectedShipping && <p className="mt-1">Via: {selectedShipping.name}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Order Summary</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span className="text-muted-foreground">Item x{item.quantity}</span>
                  <span>{formatCurrency(item.unitPrice * item.quantity, symbol, decimals, separator)}</span>
                </div>
              ))}
              {selectedShipping && selectedShipping.cost > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{formatCurrency(selectedShipping.cost, symbol, decimals, separator)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(total, symbol, decimals, separator)}</span>
              </div>
            </CardContent>
          </Card>

          {selectedPayment?.type === "bank_transfer" && settings?.bankTransferInfo && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-4 text-sm space-y-1 text-blue-800">
                <p className="font-medium">After placing your order, transfer the total to:</p>
                <p>Bank: {settings.bankTransferInfo.bankName}</p>
                <p>Account: {settings.bankTransferInfo.accountNumber}</p>
                <p>Holder: {settings.bankTransferInfo.holderName}</p>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
            <Button className="flex-1" disabled={submitting} onClick={handlePlaceOrder}>
              {submitting ? "Placing Order..." : "Place Order"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
