import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/PageHeader"
import { useCreateStore, useUploadStoreLogo } from "@/hooks/useStores"
import { storeSchema } from "@/lib/validators"
import { slugify } from "@/lib/utils"
import { ApiError } from "@/api/client"

type StoreForm = z.infer<typeof storeSchema>

export function NewStorePage() {
  const navigate = useNavigate()
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [createdStoreId, setCreatedStoreId] = useState("")
  const { mutateAsync: createStore, isPending } = useCreateStore()
  const { mutateAsync: uploadLogo } = useUploadStoreLogo(createdStoreId)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<StoreForm>({
    resolver: zodResolver(storeSchema),
    defaultValues: { name: "", slug: "" },
  })

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setValue("name", val)
    setValue("slug", slugify(val))
  }

  async function onSubmit(data: StoreForm) {
    try {
      const result = await createStore({ name: data.name, slug: data.slug || undefined })
      const storeId = result.store.id
      setCreatedStoreId(storeId)

      if (logoFile) {
        await uploadLogo(logoFile)
      }

      toast.success("Store created!")
      navigate(`/admin/stores/${storeId}/products`)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to create store"
      toast.error(msg)
    }
  }

  return (
    <div className="max-w-lg">
      <PageHeader title="Create New Store" />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Store details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Store name *</Label>
              <Input
                id="name"
                placeholder="My Awesome Store"
                {...register("name")}
                onChange={handleNameChange}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL slug</Label>
              <div className="flex items-center">
                <span className="text-muted-foreground text-sm mr-1">mitienda.app/store/</span>
                <Input
                  id="slug"
                  placeholder="my-awesome-store"
                  {...register("slug")}
                />
              </div>
              {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Logo (optional)</Label>
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
              />
              {logoFile && (
                <p className="text-xs text-muted-foreground">Selected: {logoFile.name}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : "Create Store"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/admin/stores")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
