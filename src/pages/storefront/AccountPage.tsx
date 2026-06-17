import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle
} from "@/components/ui/sheet"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { ErrorState } from "@/components/shared/ErrorState"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { ProviderBadge } from "@/components/shared/ProviderBadge"
import { useMyProfile, useMyAddresses, useCreateAddress, useUpdateAddress, useDeleteAddress } from "@/hooks/useCustomers"
import { addressSchema } from "@/lib/validators"
import type { CustomerAddress } from "@/api/types"
import { z } from "zod"
import { ApiError } from "@/api/client"
import { formatDate } from "@/lib/utils"

type AddressForm = z.infer<typeof addressSchema> & { isDefault?: boolean }

export function AccountPage() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editAddress, setEditAddress] = useState<CustomerAddress | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CustomerAddress | null>(null)

  const { data: customer, isLoading, isError, refetch } = useMyProfile()
  const { data: addresses, isLoading: loadingAddresses } = useMyAddresses()
  const { mutateAsync: createAddress } = useCreateAddress()
  const { mutateAsync: updateAddress } = useUpdateAddress()
  const { mutate: deleteAddress, isPending: deleting } = useDeleteAddress()

  const { register, handleSubmit, reset } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema.extend({ isDefault: z.boolean().optional() })),
  })

  function openAdd() {
    setEditAddress(null)
    reset({ addressLine1: "", city: "", countryCode: "" })
    setSheetOpen(true)
  }

  function openEdit(addr: CustomerAddress) {
    setEditAddress(addr)
    reset({
      label: addr.label ?? "",
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 ?? "",
      city: addr.city,
      state: addr.state ?? "",
      countryCode: addr.countryCode,
      postalCode: addr.postalCode ?? "",
    })
    setSheetOpen(true)
  }

  async function onSubmit(data: AddressForm) {
    try {
      if (editAddress) {
        await updateAddress({ id: editAddress.id, data })
        toast.success("Address updated")
      } else {
        await createAddress(data)
        toast.success("Address added")
      }
      setSheetOpen(false)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to save address"
      toast.error(msg)
    }
  }

  if (isLoading) return <LoadingSpinner className="py-16" />
  if (isError || !customer) return <ErrorState message="Failed to load profile" retry={refetch} />

  const initials = customer.name
    ? customer.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : customer.email[0].toUpperCase()

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <PageHeader title="My Account" />

      {/* Profile */}
      <Card className="mb-6">
        <CardContent className="pt-6 flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-xl">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-lg">{customer.name ?? "—"}</p>
            <p className="text-muted-foreground">{customer.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <ProviderBadge provider={customer.provider} />
              <span className="text-xs text-muted-foreground">Member since {formatDate(customer.createdAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address book */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Address Book</CardTitle>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Address
          </Button>
        </CardHeader>
        <CardContent>
          {loadingAddresses ? (
            <LoadingSpinner className="py-4" />
          ) : !addresses || addresses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No addresses saved yet.</p>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <div key={addr.id} className="flex items-start justify-between border rounded p-3">
                  <div className="text-sm">
                    {addr.label && <p className="font-medium">{addr.label}</p>}
                    <p className="text-muted-foreground">{addr.addressLine1}</p>
                    {addr.addressLine2 && <p className="text-muted-foreground">{addr.addressLine2}</p>}
                    <p className="text-muted-foreground">{addr.city}{addr.state ? `, ${addr.state}` : ""} {addr.countryCode}</p>
                    {addr.isDefault && (
                      <div className="flex items-center gap-1 mt-1 text-amber-600 text-xs">
                        <Star className="h-3 w-3" />
                        Default
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(addr)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(addr)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editAddress ? "Edit Address" : "Add Address"}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <div className="space-y-2"><Label>Label</Label><Input {...register("label")} placeholder="Home, Work..." /></div>
            <div className="space-y-2"><Label>Address *</Label><Input {...register("addressLine1")} /></div>
            <div className="space-y-2"><Label>Address line 2</Label><Input {...register("addressLine2")} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>City *</Label><Input {...register("city")} /></div>
              <div className="space-y-2"><Label>State</Label><Input {...register("state")} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Country *</Label><Input {...register("countryCode")} maxLength={2} placeholder="US" /></div>
              <div className="space-y-2"><Label>Postal code</Label><Input {...register("postalCode")} /></div>
            </div>
            <Button type="submit" className="w-full">{editAddress ? "Update" : "Add Address"}</Button>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Address"
        description="Remove this address from your address book?"
        onConfirm={() => {
          if (!deleteTarget) return
          deleteAddress(deleteTarget.id, {
            onSuccess: () => { toast.success("Address deleted"); setDeleteTarget(null) },
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
