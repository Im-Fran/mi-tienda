import { useState } from "react"
import { useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { z } from "zod"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { ErrorState } from "@/components/shared/ErrorState"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { useShippingMethods, useCreateShippingMethod, useUpdateShippingMethod, useDeleteShippingMethod } from "@/hooks/useShipping"
import { shippingMethodSchema } from "@/lib/validators"
import { formatCurrency } from "@/lib/utils"
import type { ShippingMethod } from "@/api/types"
import { ApiError } from "@/api/client"
import type { Resolver } from "react-hook-form"

type ShippingForm = z.output<typeof shippingMethodSchema>

export function ShippingPage() {
  const { storeId } = useParams<{ storeId: string }>()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ShippingMethod | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ShippingMethod | null>(null)

  const { data: methods, isLoading, isError, error, refetch } = useShippingMethods(storeId!)
  const { mutateAsync: createMethod, isPending: creating } = useCreateShippingMethod(storeId!)
  const { mutateAsync: updateMethod, isPending: updating } = useUpdateShippingMethod(storeId!)
  const { mutate: deleteMethod, isPending: deleting } = useDeleteShippingMethod(storeId!)

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<ShippingForm>({
    resolver: zodResolver(shippingMethodSchema) as Resolver<ShippingForm>,
    defaultValues: { type: "generic_delivery", name: "", cost: 0, isActive: true },
  })

  function openCreate() {
    setEditTarget(null)
    reset({ type: "generic_delivery", name: "", cost: 0, isActive: true })
    setSheetOpen(true)
  }

  function openEdit(method: ShippingMethod) {
    setEditTarget(method)
    reset({
      type: method.type,
      name: method.name,
      cost: method.cost / 100,
      maxDistanceKm: method.maxDistanceKm ?? undefined,
      estimatedDays: method.estimatedDays ?? undefined,
      isActive: method.isActive,
    })
    setSheetOpen(true)
  }

  async function onSubmit(data: ShippingForm) {
    const payload = { ...data, cost: Math.round((data.cost ?? 0) * 100) }
    try {
      if (editTarget) {
        await updateMethod({ id: editTarget.id, data: payload })
        toast.success("Shipping method updated")
      } else {
        await createMethod(payload)
        toast.success("Shipping method created")
      }
      setSheetOpen(false)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to save"
      toast.error(msg)
    }
  }

  if (isLoading) return <LoadingSpinner className="py-16" />
  if (isError) return <ErrorState message="Failed to load shipping methods" error={error} retry={refetch} />

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Shipping Methods"
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Method</Button>}
      />

      {!methods || methods.length === 0 ? (
        <p className="text-muted-foreground text-sm">No shipping methods configured.</p>
      ) : (
        <div className="space-y-3">
          {methods.map((m) => (
            <Card key={m.id}>
              <CardContent className="pt-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{m.name}</span>
                    <Badge variant="outline">{m.type.replace("_", " ")}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatCurrency(m.cost, "$")}
                    {m.estimatedDays ? ` · ${m.estimatedDays} days` : ""}
                    {m.maxDistanceKm ? ` · max ${m.maxDistanceKm}km` : ""}
                  </p>
                  <Badge variant={m.isActive ? "default" : "secondary"} className="mt-1">
                    {m.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteTarget(m)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editTarget ? "Edit Shipping Method" : "Add Shipping Method"}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label>Type</Label>
              <RadioGroup
                value={watch("type")}
                onValueChange={(v) => setValue("type", v as "store_pickup" | "generic_delivery")}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="generic_delivery" id="ship-delivery" />
                  <Label htmlFor="ship-delivery">Delivery</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="store_pickup" id="ship-pickup" />
                  <Label htmlFor="ship-pickup">Store Pickup</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Name *</Label>
              <Input {...register("name")} placeholder="Standard Delivery" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Cost *</Label>
              <Input type="number" step="0.01" {...register("cost", { valueAsNumber: true })} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Estimated days</Label>
                <Input type="number" {...register("estimatedDays", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>Max distance (km)</Label>
                <Input type="number" {...register("maxDistanceKm", { valueAsNumber: true })} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={watch("isActive")} onCheckedChange={(v) => setValue("isActive", v)} />
              <Label>Active</Label>
            </div>

            <Button type="submit" className="w-full" disabled={creating || updating}>
              {creating || updating ? "Saving..." : editTarget ? "Update" : "Add Method"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Shipping Method"
        description={`Delete "${deleteTarget?.name}"?`}
        onConfirm={() => {
          if (!deleteTarget) return
          deleteMethod(deleteTarget.id, {
            onSuccess: () => { toast.success("Deleted"); setDeleteTarget(null) },
            onError: () => { toast.error("Failed to delete"); setDeleteTarget(null) },
          })
        }}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel="Delete"
        destructive
        loading={deleting}
      />
    </div>
  )
}
