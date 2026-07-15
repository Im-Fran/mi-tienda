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
import {
  Sheet, SheetContent, SheetHeader, SheetTitle
} from "@/components/ui/sheet"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { ErrorState } from "@/components/shared/ErrorState"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { usePaymentMethods, useCreatePaymentMethod, useUpdatePaymentMethod, useDeletePaymentMethod } from "@/hooks/usePayments"
import { paymentMethodSchema } from "@/lib/validators"
import type { PaymentMethod } from "@/api/types"
import { ApiError } from "@/api/client"
import type { Resolver } from "react-hook-form"

type PaymentForm = z.output<typeof paymentMethodSchema>

export function PaymentsPage() {
  const { storeId } = useParams<{ storeId: string }>()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<PaymentMethod | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PaymentMethod | null>(null)

  const { data: methods, isLoading, isError, error, refetch } = usePaymentMethods(storeId!)
  const { mutateAsync: createMethod, isPending: creating } = useCreatePaymentMethod(storeId!)
  const { mutateAsync: updateMethod, isPending: updating } = useUpdatePaymentMethod(storeId!)
  const { mutate: deleteMethod, isPending: deleting } = useDeletePaymentMethod(storeId!)

  const { register, handleSubmit, setValue, watch, reset } = useForm<PaymentForm>({
    resolver: zodResolver(paymentMethodSchema) as Resolver<PaymentForm>,
    defaultValues: { type: "in_person", isActive: true },
  })

  const watchedType = watch("type")

  function openCreate() {
    setEditTarget(null)
    reset({ type: "in_person", isActive: true })
    setSheetOpen(true)
  }

  function openEdit(method: PaymentMethod) {
    setEditTarget(method)
    const cfg = method.config as Record<string, string> | null
    reset({
      type: method.type,
      providerName: method.providerName ?? "",
      isActive: method.isActive,
      bankName: cfg?.bankName ?? "",
      accountType: cfg?.accountType ?? "",
      accountNumber: cfg?.accountNumber ?? "",
      holderName: cfg?.holderName ?? "",
      holderDocument: cfg?.holderDocument ?? "",
      bankEmail: cfg?.email ?? "",
      instructions: cfg?.instructions ?? "",
    })
    setSheetOpen(true)
  }

  async function onSubmit(data: PaymentForm) {
    const config: Record<string, string> = {}
    if (data.type === "bank_transfer") {
      if (data.bankName) config.bankName = data.bankName
      if (data.accountType) config.accountType = data.accountType
      if (data.accountNumber) config.accountNumber = data.accountNumber
      if (data.holderName) config.holderName = data.holderName
      if (data.holderDocument) config.holderDocument = data.holderDocument
      if (data.bankEmail) config.email = data.bankEmail
      if (data.instructions) config.instructions = data.instructions
    }

    try {
      if (editTarget) {
        await updateMethod({ id: editTarget.id, data: { type: data.type, providerName: data.providerName, isActive: data.isActive, config } })
        toast.success("Payment method updated")
      } else {
        await createMethod({ type: data.type, providerName: data.providerName, isActive: data.isActive, config })
        toast.success("Payment method created")
      }
      setSheetOpen(false)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to save"
      toast.error(msg)
    }
  }

  if (isLoading) return <LoadingSpinner className="py-16" />
  if (isError) return <ErrorState message="Failed to load payment methods" error={error} retry={refetch} />

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Payment Methods"
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Method</Button>}
      />

      {!methods || methods.length === 0 ? (
        <p className="text-muted-foreground text-sm">No payment methods configured.</p>
      ) : (
        <div className="space-y-3">
          {methods.map((m) => (
            <Card key={m.id}>
              <CardContent className="pt-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{m.type.replace("_", " ")}</span>
                    {m.providerName && <span className="text-sm text-muted-foreground">({m.providerName})</span>}
                  </div>
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
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editTarget ? "Edit Payment Method" : "Add Payment Method"}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label>Type *</Label>
              <RadioGroup
                value={watchedType}
                onValueChange={(v) => setValue("type", v as PaymentForm["type"])}
                className="flex flex-col gap-2"
              >
                {(["in_person", "bank_transfer", "external"] as const).map((t) => (
                  <div key={t} className="flex items-center gap-2">
                    <RadioGroupItem value={t} id={`type-${t}`} />
                    <Label htmlFor={`type-${t}`}>{t.replace("_", " ")}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {watchedType === "external" && (
              <div className="space-y-2">
                <Label>Provider name</Label>
                <Input {...register("providerName")} placeholder="e.g. Stripe" />
              </div>
            )}

            {watchedType === "bank_transfer" && (
              <>
                <div className="space-y-2"><Label>Bank name</Label><Input {...register("bankName")} /></div>
                <div className="space-y-2"><Label>Account type</Label><Input {...register("accountType")} /></div>
                <div className="space-y-2"><Label>Account number</Label><Input {...register("accountNumber")} /></div>
                <div className="space-y-2"><Label>Holder name</Label><Input {...register("holderName")} /></div>
                <div className="space-y-2"><Label>Holder document</Label><Input {...register("holderDocument")} /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" {...register("bankEmail")} /></div>
                <div className="space-y-2"><Label>Transfer instructions</Label><Input {...register("instructions")} /></div>
              </>
            )}

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
        title="Delete Payment Method"
        description={`Delete this ${deleteTarget?.type.replace("_", " ")} method?`}
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
