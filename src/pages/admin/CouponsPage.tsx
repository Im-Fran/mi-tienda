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
import {
  Sheet, SheetContent, SheetHeader, SheetTitle
} from "@/components/ui/sheet"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable, type Column } from "@/components/shared/DataTable"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { ErrorState } from "@/components/shared/ErrorState"
import { useCoupons, useCreateCoupon, useUpdateCoupon, useDeleteCoupon } from "@/hooks/useCoupons"
import { couponSchema } from "@/lib/validators"
import { formatDate } from "@/lib/utils"
import type { Coupon } from "@/api/types"
import { ApiError } from "@/api/client"
import type { Resolver } from "react-hook-form"

type CouponForm = z.output<typeof couponSchema>

export function CouponsPage() {
  const { storeId } = useParams<{ storeId: string }>()
  const [page, setPage] = useState(1)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Coupon | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null)

  const { data, isLoading, isError, error, refetch } = useCoupons(storeId!, page)
  const { mutateAsync: createCoupon, isPending: creating } = useCreateCoupon(storeId!)
  const { mutateAsync: updateCoupon, isPending: updating } = useUpdateCoupon(storeId!)
  const { mutate: deleteCoupon, isPending: deleting } = useDeleteCoupon(storeId!)

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<CouponForm>({
    resolver: zodResolver(couponSchema) as Resolver<CouponForm>,
    defaultValues: { code: "", type: "percentage", value: 0, appliesTo: "all", isActive: true, productIds: [], categoryIds: [] },
  })

  function openCreate() {
    setEditTarget(null)
    reset({ code: "", type: "percentage", value: 0, appliesTo: "all", isActive: true, productIds: [], categoryIds: [] })
    setSheetOpen(true)
  }

  function openEdit(coupon: Coupon) {
    setEditTarget(coupon)
    reset({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      appliesTo: coupon.appliesTo,
      isActive: coupon.isActive,
      productIds: coupon.productIds,
      categoryIds: coupon.categoryIds,
      occasion: coupon.occasion ?? undefined,
      minOrderAmount: coupon.minOrderAmount ?? undefined,
      maxUses: coupon.maxUses ?? undefined,
      startsAt: coupon.startsAt ?? undefined,
      expiresAt: coupon.expiresAt ?? undefined,
    })
    setSheetOpen(true)
  }

  async function onSubmit(formData: CouponForm) {
    try {
      if (editTarget) {
        await updateCoupon({ id: editTarget.id, data: formData })
        toast.success("Coupon updated")
      } else {
        await createCoupon(formData)
        toast.success("Coupon created")
      }
      setSheetOpen(false)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to save coupon"
      toast.error(msg)
    }
  }

  if (isLoading) return <LoadingSpinner className="py-16" />
  if (isError) return <ErrorState message="Failed to load coupons" error={error} retry={refetch} />

  const columns: Column<Coupon>[] = [
    { key: "code", header: "Code", cell: (c) => <code className="font-mono text-sm bg-muted px-1 rounded">{c.code}</code> },
    { key: "type", header: "Type", cell: (c) => <Badge variant="outline">{c.type}</Badge> },
    { key: "value", header: "Value", cell: (c) => c.type === "percentage" ? `${c.value}%` : `${c.value / 100}` },
    { key: "appliesTo", header: "Applies To", cell: (c) => c.appliesTo },
    { key: "uses", header: "Uses", cell: (c) => `${c.usedCount}${c.maxUses ? `/${c.maxUses}` : ""}` },
    { key: "expires", header: "Expires", cell: (c) => c.expiresAt ? formatDate(new Date(c.expiresAt).getTime() / 1000) : "-" },
    { key: "active", header: "Active", cell: (c) => <Badge variant={c.isActive ? "default" : "secondary"}>{c.isActive ? "Yes" : "No"}</Badge> },
    {
      key: "actions",
      header: "",
      cell: (c) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(c)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Coupons"
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />New Coupon</Button>}
      />

      <DataTable columns={columns} data={data?.coupons ?? []} pagination={data?.pagination} onPageChange={setPage} />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editTarget ? "Edit Coupon" : "New Coupon"}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label>Code *</Label>
              <Input {...register("code")} placeholder="SUMMER20" className="uppercase" />
              {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={watch("type")} onValueChange={(v) => setValue("type", v as "percentage" | "fixed")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value *</Label>
                <Input type="number" {...register("value", { valueAsNumber: true })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Applies To</Label>
              <Select value={watch("appliesTo")} onValueChange={(v) => setValue("appliesTo", v as "all" | "products" | "categories")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All products</SelectItem>
                  <SelectItem value="products">Specific products</SelectItem>
                  <SelectItem value="categories">Specific categories</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Min order amount (cents)</Label>
              <Input type="number" {...register("minOrderAmount", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Max uses</Label>
              <Input type="number" {...register("maxUses", { valueAsNumber: true })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Starts at</Label>
                <Input type="datetime-local" {...register("startsAt")} />
              </div>
              <div className="space-y-2">
                <Label>Expires at</Label>
                <Input type="datetime-local" {...register("expiresAt")} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={watch("isActive")}
                onCheckedChange={(v) => setValue("isActive", v)}
              />
              <Label>Active</Label>
            </div>
            <Button type="submit" className="w-full" disabled={creating || updating}>
              {creating || updating ? "Saving..." : editTarget ? "Update Coupon" : "Create Coupon"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Coupon"
        description={`Delete coupon "${deleteTarget?.code}"?`}
        onConfirm={() => {
          if (!deleteTarget) return
          deleteCoupon(deleteTarget.id, {
            onSuccess: () => { toast.success("Coupon deleted"); setDeleteTarget(null) },
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
