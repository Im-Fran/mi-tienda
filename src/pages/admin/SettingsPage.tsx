import { useEffect } from "react"
import { useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { ErrorState } from "@/components/shared/ErrorState"
import { useStoreSettings, useUpdateStoreSettings, useStore, useUpdateStore } from "@/hooks/useStores"
import { storeSettingsSchema, storeSchema } from "@/lib/validators"
import { ApiError } from "@/api/client"

// Popular country codes for selection
const COUNTRY_CODES = [
  { code: "US", name: "United States" }, { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" }, { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" }, { code: "FR", name: "France" },
  { code: "ES", name: "Spain" }, { code: "MX", name: "Mexico" },
  { code: "AR", name: "Argentina" }, { code: "CL", name: "Chile" },
  { code: "CO", name: "Colombia" }, { code: "BR", name: "Brazil" },
  { code: "PE", name: "Peru" }, { code: "UY", name: "Uruguay" },
]

type SettingsForm = z.infer<typeof storeSettingsSchema>
type StoreForm = z.infer<typeof storeSchema>

export function SettingsPage() {
  const { storeId } = useParams<{ storeId: string }>()
  const { data: settings, isLoading: loadingSettings, isError, refetch } = useStoreSettings(storeId!)
  const { data: store, isLoading: loadingStore } = useStore(storeId!)
  const { mutateAsync: updateSettings, isPending: savingSettings } = useUpdateStoreSettings(storeId!)
  const { mutateAsync: updateStore, isPending: savingStore } = useUpdateStore(storeId!)

  const { register: regSettings, handleSubmit: handleSettings, setValue: setVal, watch, reset: resetSettings } =
    useForm<SettingsForm>({ resolver: zodResolver(storeSettingsSchema) })

  const { register: regStore, handleSubmit: handleStore, reset: resetStore, formState: { errors: storeErrors } } =
    useForm<StoreForm>({ resolver: zodResolver(storeSchema) })

  useEffect(() => {
    if (settings) {
      resetSettings({
        requireCustomerIdDocument: settings.requireCustomerIdDocument,
        taxLabel: settings.taxLabel,
        taxRate: settings.taxRate,
        decimalSeparator: settings.decimalSeparator ?? ".",
        decimalPlaces: settings.decimalPlaces ?? 2,
        currencyCode: settings.currencyCode,
        currencySymbol: settings.currencySymbol ?? "$",
        countryMode: settings.countryMode,
        countries: settings.countries ?? [],
        bankTransferInfo: settings.bankTransferInfo ?? undefined,
      })
    }
  }, [settings, resetSettings])

  useEffect(() => {
    if (store) {
      resetStore({ name: store.name, slug: store.slug })
    }
  }, [store, resetStore])

  if (loadingSettings || loadingStore) return <LoadingSpinner className="py-16" />
  if (isError) return <ErrorState message="Failed to load settings" retry={refetch} />

  async function onSaveSettings(data: SettingsForm) {
    try {
      await updateSettings(data)
      toast.success("Settings saved")
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to save"
      toast.error(msg)
    }
  }

  async function onSaveStore(data: StoreForm) {
    try {
      await updateStore({ name: data.name, slug: data.slug })
      toast.success("Store updated")
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to save"
      toast.error(msg)
    }
  }

  const watchedCountries = watch("countries") ?? []

  function toggleCountry(code: string) {
    const current = watchedCountries
    if (current.includes(code)) {
      setVal("countries", current.filter((c) => c !== code))
    } else {
      setVal("countries", [...current, code])
    }
  }

  return (
    <div className="max-w-6xl">
      <PageHeader title="Store Settings" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* General */}
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
              <CardDescription>Basic information about your store.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStore(onSaveStore)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Store name</Label>
                  <Input {...regStore("name")} />
                  {storeErrors.name && <p className="text-sm text-destructive">{storeErrors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input {...regStore("slug")} />
                </div>
                <Button type="submit" disabled={savingStore}>
                  {savingStore ? "Saving..." : "Save General Settings"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Currency */}
          <Card>
            <CardHeader>
              <CardTitle>Currency</CardTitle>
              <CardDescription>How prices are formatted and displayed.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSettings(onSaveSettings)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Currency code (ISO)</Label>
                    <Input {...regSettings("currencyCode")} placeholder="USD" maxLength={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency symbol</Label>
                    <Input {...regSettings("currencySymbol")} placeholder="$" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Decimal places</Label>
                    <Input type="number" min={0} max={6} {...regSettings("decimalPlaces", { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Decimal separator</Label>
                    <Select value={watch("decimalSeparator")} onValueChange={(v) => setVal("decimalSeparator", v as "." | ",")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value=".">Period (.)</SelectItem>
                        <SelectItem value=",">Comma (,)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" disabled={savingSettings}>
                  {savingSettings ? "Saving..." : "Save Currency Settings"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Tax */}
          <Card>
            <CardHeader>
              <CardTitle>Tax</CardTitle>
              <CardDescription>Configure how tax is calculated and displayed.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSettings(onSaveSettings)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Tax label</Label>
                  <Input {...regSettings("taxLabel")} placeholder="VAT" />
                </div>
                <div className="space-y-2">
                  <Label>Tax rate (%)</Label>
                  <Input type="number" step="0.01" {...regSettings("taxRate", { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Tax mode</Label>
                  <Select value={watch("countryMode")} onValueChange={(v) => setVal("countryMode", v as "inclusive" | "exclusive")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inclusive">Inclusive (tax included in price)</SelectItem>
                      <SelectItem value="exclusive">Exclusive (tax added at checkout)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={savingSettings}>
                  {savingSettings ? "Saving..." : "Save Tax Settings"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Countries */}
          <Card>
            <CardHeader>
              <CardTitle>Countries</CardTitle>
              <CardDescription>Select countries you ship to.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {COUNTRY_CODES.map(({ code, name }) => (
                    <div key={code} className="flex items-center gap-2">
                      <Checkbox
                        id={`country-${code}`}
                        checked={watchedCountries.includes(code)}
                        onCheckedChange={() => toggleCountry(code)}
                      />
                      <Label htmlFor={`country-${code}`}>{name} ({code})</Label>
                    </div>
                  ))}
                </div>
                <Button onClick={handleSettings(onSaveSettings)} disabled={savingSettings}>
                  {savingSettings ? "Saving..." : "Save Countries"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bank Transfer */}
          <Card>
            <CardHeader>
              <CardTitle>Bank Transfer</CardTitle>
              <CardDescription>Bank account details shown to customers when they choose bank transfer payment.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSettings(onSaveSettings)} className="space-y-4">
                <div className="space-y-2"><Label>Bank name</Label><Input {...regSettings("bankTransferInfo.bankName")} /></div>
                <div className="space-y-2"><Label>Account type</Label><Input {...regSettings("bankTransferInfo.accountType")} /></div>
                <div className="space-y-2"><Label>Account number</Label><Input {...regSettings("bankTransferInfo.accountNumber")} /></div>
                <div className="space-y-2"><Label>Holder name</Label><Input {...regSettings("bankTransferInfo.holderName")} /></div>
                <div className="space-y-2"><Label>Holder document</Label><Input {...regSettings("bankTransferInfo.holderDocument")} /></div>
                <div className="space-y-2"><Label>Contact email</Label><Input type="email" {...regSettings("bankTransferInfo.email")} /></div>
                <div className="space-y-2"><Label>Transfer instructions</Label><Input {...regSettings("bankTransferInfo.instructions")} /></div>
                <Button type="submit" disabled={savingSettings}>
                  {savingSettings ? "Saving..." : "Save Bank Transfer Details"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Customers */}
          <Card>
            <CardHeader>
              <CardTitle>Customers</CardTitle>
              <CardDescription>Checkout requirements for customers.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSettings(onSaveSettings)} className="space-y-4">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={watch("requireCustomerIdDocument")}
                    onCheckedChange={(v) => setVal("requireCustomerIdDocument", v)}
                  />
                  <div>
                    <Label>Require ID document at checkout</Label>
                    <p className="text-xs text-muted-foreground">
                      Customers must provide an ID document number during checkout.
                    </p>
                  </div>
                </div>
                <Button type="submit" disabled={savingSettings}>
                  {savingSettings ? "Saving..." : "Save Customer Settings"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
