import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { z } from "zod"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { ImageUploader } from "@/components/shared/ImageUploader"
import { useProduct, useCreateProduct, useUpdateProduct, useUploadProductImages, useDeleteProductImage, useSetMainProductImage, useAddVariant, useUpdateVariant, useDeleteVariant } from "@/hooks/useProducts"
import { useCategories } from "@/hooks/useCategories"
import { productSchema, variantSchema } from "@/lib/validators"
import { ApiError } from "@/api/client"
import type { Category } from "@/api/types"
import type { Resolver } from "react-hook-form"

type ProductForm = z.output<typeof productSchema>
type VariantForm = z.output<typeof variantSchema> & { id?: string }

function CategoryCheckboxTree({
  categories,
  selected,
  onToggle,
  depth = 0,
}: {
  categories: Category[]
  selected: string[]
  onToggle: (id: string) => void
  depth?: number
}) {
  return (
    <div style={{ paddingLeft: depth * 16 }}>
      {categories.map((cat) => (
        <div key={cat.id}>
          <div className="flex items-center gap-2 py-1">
            <Checkbox
              id={`cat-${cat.id}`}
              checked={selected.includes(cat.id)}
              onCheckedChange={() => onToggle(cat.id)}
            />
            <Label htmlFor={`cat-${cat.id}`} className="cursor-pointer">{cat.name}</Label>
          </div>
          {cat.children.length > 0 && (
            <CategoryCheckboxTree
              categories={cat.children}
              selected={selected}
              onToggle={onToggle}
              depth={depth + 1}
            />
          )}
        </div>
      ))}
    </div>
  )
}

export function ProductFormPage() {
  const { storeId, id } = useParams<{ storeId: string; id?: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const { data: product, isLoading: loadingProduct } = useProduct(storeId!, id ?? "")
  const { data: categoriesTree } = useCategories(storeId!)
  const { mutateAsync: createProduct, isPending: creating } = useCreateProduct(storeId!)
  const { mutateAsync: updateProduct, isPending: updating } = useUpdateProduct(storeId!, id ?? "")
  const { mutateAsync: uploadImages } = useUploadProductImages(storeId!, id ?? "")
  const { mutateAsync: deleteImage } = useDeleteProductImage(storeId!, id ?? "")
  const { mutateAsync: setMainImage } = useSetMainProductImage(storeId!, id ?? "")
  const { mutateAsync: addVariant } = useAddVariant(storeId!, id ?? "")
  const { mutateAsync: updateVariant } = useUpdateVariant(storeId!, id ?? "")
  const { mutateAsync: deleteVariant } = useDeleteVariant(storeId!, id ?? "")

  const [variants, setVariants] = useState<VariantForm[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<ProductForm>({
    resolver: zodResolver(productSchema) as Resolver<ProductForm>,
    defaultValues: { name: "", type: "physical", isActive: true, categoryIds: [] },
  })

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        shortDescription: product.shortDescription ?? "",
        fullDescription: product.fullDescription ?? "",
        type: product.type,
        isActive: product.isActive,
        categoryIds: [],
      })
      setVariants(product.variants.map((v) => ({
        id: v.id,
        name: v.name,
        sku: v.sku ?? "",
        price: v.price / 100,
        compareAtPrice: v.compareAtPrice ? v.compareAtPrice / 100 : undefined,
        stock: v.stock,
        weight: v.weight ?? undefined,
        options: v.options.map((o) => ({ optionName: o.optionName, optionValue: o.optionValue })),
      })))
    }
  }, [product, reset])

  function toggleCategory(catId: string) {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((x) => x !== catId) : [...prev, catId]
    )
  }

  async function onSubmit(data: ProductForm) {
    try {
      if (isEdit) {
        await updateProduct({
          name: data.name,
          shortDescription: data.shortDescription,
          fullDescription: data.fullDescription,
          type: data.type,
          isActive: data.isActive,
          categoryIds: selectedCategories,
        })
        toast.success("Product updated")
      } else {
        const result = await createProduct({
          name: data.name,
          shortDescription: data.shortDescription,
          fullDescription: data.fullDescription,
          type: data.type,
          isActive: data.isActive,
          categoryIds: selectedCategories,
          variants: variants.map((v) => ({
            name: v.name,
            sku: v.sku || undefined,
            price: Math.round((v.price ?? 0) * 100),
            compareAtPrice: v.compareAtPrice ? Math.round(v.compareAtPrice * 100) : undefined,
            stock: v.stock ?? 0,
            options: v.options ?? [],
          })),
        })
        toast.success("Product created")
        navigate(`/admin/stores/${storeId}/products/${result.product.id}`)
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to save product"
      toast.error(msg)
    }
  }

  if (isEdit && loadingProduct) return <LoadingSpinner className="py-16" />

  const images = product?.images.map((img) => ({
    id: img.id,
    url: `${import.meta.env.VITE_API_BASE_URL}/cdn/${img.r2Key}`,
    isMain: img.isMain,
  })) ?? []

  return (
    <div className="max-w-4xl">
      <PageHeader title={isEdit ? "Edit Product" : "New Product"} />

      <Tabs defaultValue="general">
        <TabsList className="mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          {isEdit && <TabsTrigger value="images">Images</TabsTrigger>}
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit(onSubmit)}>
          <TabsContent value="general" className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input {...register("name")} placeholder="Product name" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Short description</Label>
              <Textarea {...register("shortDescription")} placeholder="Brief description" rows={2} />
            </div>

            <div className="space-y-2">
              <Label>Full description (Markdown)</Label>
              <Textarea
                {...register("fullDescription")}
                placeholder="Supports **markdown** formatting"
                rows={8}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <RadioGroup
                value={watch("type")}
                onValueChange={(v) => setValue("type", v as "physical" | "digital")}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="physical" id="type-physical" />
                  <Label htmlFor="type-physical">Physical</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="digital" id="type-digital" />
                  <Label htmlFor="type-digital">Digital</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="isActive"
                checked={watch("isActive")}
                onCheckedChange={(v) => setValue("isActive", v)}
              />
              <Label htmlFor="isActive">Active (visible in storefront)</Label>
            </div>

            <Button type="submit" disabled={creating || updating}>
              {creating || updating ? "Saving..." : isEdit ? "Save Changes" : "Create Product"}
            </Button>
          </TabsContent>
        </form>

        <TabsContent value="variants" className="space-y-4">
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">SKU</th>
                  <th className="text-left px-3 py-2">Price</th>
                  <th className="text-left px-3 py-2">Stock</th>
                  <th className="text-left px-3 py-2">Options</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2">
                      <Input
                        value={v.name}
                        onChange={(e) => {
                          const updated = [...variants]
                          updated[i] = { ...updated[i], name: e.target.value }
                          setVariants(updated)
                        }}
                        className="h-8"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={v.sku ?? ""}
                        onChange={(e) => {
                          const updated = [...variants]
                          updated[i] = { ...updated[i], sku: e.target.value }
                          setVariants(updated)
                        }}
                        className="h-8 w-24"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={v.price ?? 0}
                        onChange={(e) => {
                          const updated = [...variants]
                          updated[i] = { ...updated[i], price: parseFloat(e.target.value) || 0 }
                          setVariants(updated)
                        }}
                        className="h-8 w-24"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        value={v.stock ?? 0}
                        onChange={(e) => {
                          const updated = [...variants]
                          updated[i] = { ...updated[i], stock: parseInt(e.target.value) || 0 }
                          setVariants(updated)
                        }}
                        className="h-8 w-20"
                      />
                    </td>
                    <td className="px-3 py-2 text-muted-foreground text-xs">
                      {v.options?.map((o) => `${o.optionName}: ${o.optionValue}`).join(", ") || "-"}
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={async () => {
                          if (v.id && isEdit) {
                            await deleteVariant(v.id)
                          }
                          setVariants(variants.filter((_, j) => j !== i))
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setVariants([...variants, { name: "New Variant", price: 0, stock: 0, options: [] }])
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Variant
          </Button>
          {isEdit && (
            <Button
              onClick={async () => {
                for (const v of variants) {
                  if (v.id) {
                    await updateVariant({
                      variantId: v.id,
                      data: {
                        name: v.name,
                        sku: v.sku || undefined,
                        price: Math.round((v.price ?? 0) * 100),
                        stock: v.stock ?? 0,
                      },
                    })
                  } else {
                    await addVariant({
                      name: v.name,
                      sku: v.sku || undefined,
                      price: Math.round((v.price ?? 0) * 100),
                      stock: v.stock ?? 0,
                      options: v.options ?? [],
                    })
                  }
                }
                toast.success("Variants saved")
              }}
            >
              Save Variants
            </Button>
          )}
        </TabsContent>

        {isEdit && (
          <TabsContent value="images">
            <ImageUploader
              value={images}
              multiple
              onUpload={async (files) => {
                await uploadImages(files)
                toast.success("Images uploaded")
              }}
              onDelete={async (imgId) => {
                await deleteImage(imgId)
                toast.success("Image deleted")
              }}
              onSetMain={async (imgId) => {
                await setMainImage(imgId)
                toast.success("Main image updated")
              }}
            />
          </TabsContent>
        )}

        <TabsContent value="categories">
          <Card>
            <CardContent className="pt-4">
              {categoriesTree && categoriesTree.length > 0 ? (
                <CategoryCheckboxTree
                  categories={categoriesTree}
                  selected={selectedCategories}
                  onToggle={toggleCategory}
                />
              ) : (
                <p className="text-muted-foreground text-sm">No categories yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
