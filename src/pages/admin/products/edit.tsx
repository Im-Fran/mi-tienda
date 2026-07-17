import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { z } from "zod"
import { Plus, Trash2, ChevronLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { ImageUploader } from "@/components/shared/ImageUploader"
import {
  useProduct,
  useCreateProduct,
  useUpdateProduct,
  useUploadProductImages,
  useDeleteProductImage,
  useSetMainProductImage,
  useAddVariant,
  useUpdateVariant,
  useDeleteVariant,
} from "@/hooks/useProducts"
import { useCategories } from "@/hooks/useCategories"
import { productSchema, variantSchema } from "@/lib/validators"
import { ApiError } from "@/api/client"
import { cn } from "@/lib/utils"
import type { Resolver } from "react-hook-form"
import {
  CategoryCheckboxTree,
  getAncestorIds,
  getDescendantIds,
  findCategory,
} from "./components/CategoryCheckboxTree"

type ProductForm = z.output<typeof productSchema>
type VariantForm = z.output<typeof variantSchema> & { id?: string }

export function ProductFormPage() {
  const { storeId, id } = useParams<{ storeId: string; id?: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const { data: product, isLoading: loadingProduct } = useProduct(storeId!, id ?? "")
  const { data: categoriesTree } = useCategories(storeId!)
  const { mutateAsync: createProduct, isPending: creating } = useCreateProduct(storeId!)
  const { mutateAsync: updateProduct, isPending: updating } = useUpdateProduct(storeId!)
  const { mutateAsync: uploadImages } = useUploadProductImages(storeId!, id ?? "")
  const { mutateAsync: deleteImage } = useDeleteProductImage(storeId!, id ?? "")
  const { mutateAsync: setMainImage } = useSetMainProductImage(storeId!, id ?? "")
  const { mutateAsync: addVariant } = useAddVariant(storeId!, id ?? "")
  const { mutateAsync: updateVariant } = useUpdateVariant(storeId!, id ?? "")
  const { mutateAsync: deleteVariant } = useDeleteVariant(storeId!, id ?? "")

  const [variants, setVariants] = useState<VariantForm[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<ProductForm>({
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
        categoryIds: product.categoryIds ?? [],
      })
      setSelectedCategories(product.categoryIds ?? [])
      setVariants(
        product.variants.map((v) => ({
          id: v.id,
          name: v.name,
          sku: v.sku ?? "",
          price: v.price / 100,
          compareAtPrice: v.compareAtPrice ? v.compareAtPrice / 100 : undefined,
          stock: v.stock,
          weight: v.weight ?? undefined,
          options: v.options.map((o) => ({ optionName: o.optionName, optionValue: o.optionValue })),
        }))
      )
    }
  }, [product, reset])

  function toggleCategory(catId: string) {
    const tree = categoriesTree ?? []
    setSelectedCategories((prev) => {
      if (prev.includes(catId)) {
        const cat = findCategory(tree, catId)
        const descendants = cat ? getDescendantIds(cat) : []
        return prev.filter((x) => x !== catId && !descendants.includes(x))
      } else {
        const ancestors = getAncestorIds(tree, catId) ?? []
        const toAdd = [catId, ...ancestors].filter((x) => !prev.includes(x))
        return [...prev, ...toAdd]
      }
    })
  }

  async function onSubmit(data: ProductForm) {
    try {
      if (isEdit) {
        await updateProduct({
          id: id!,
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

  const images =
    product?.images.map((img) => ({
      id: img.id,
      url: `${import.meta.env.VITE_API_BASE_URL}/cdn/${img.r2Key}`,
      isMain: img.isMain,
    })) ?? []

  const isActive = watch("isActive")
  const productType = watch("type")

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold truncate">
            {isEdit ? (product?.name ?? "Edit Product") : "New Product"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? "Update product details" : "Add a new product to your store"}
          </p>
        </div>
        <Badge variant={isActive ? "default" : "secondary"} className="shrink-0">
          {isActive ? "Active" : "Draft"}
        </Badge>
        <Button
          type="button"
          disabled={creating || updating}
          onClick={handleSubmit(onSubmit)}
          className="shrink-0"
        >
          <Save className="h-4 w-4 mr-2" />
          {creating || updating ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Information */}
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input {...register("name")} placeholder="Product name" />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Short description</Label>
                  <Textarea
                    {...register("shortDescription")}
                    placeholder="Brief description"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Full description</Label>
                  <Textarea
                    {...register("fullDescription")}
                    placeholder="Supports **markdown** formatting"
                    rows={8}
                    className="font-mono text-sm resize-y"
                  />
                  <p className="text-xs text-muted-foreground">Markdown supported</p>
                </div>
              </CardContent>
            </Card>

            {/* Variants */}
            <Card>
              <CardHeader>
                <CardTitle>Variants</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                              type="button"
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
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setVariants([
                        ...variants,
                        { name: "New Variant", price: 0, stock: 0, options: [] },
                      ])
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Variant
                  </Button>
                  {isEdit && (
                    <Button
                      type="button"
                      size="sm"
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
                </div>
              </CardContent>
            </Card>

            {/* Images (solo en edición) */}
            {isEdit && (
              <Card>
                <CardHeader>
                  <CardTitle>Images</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar derecho */}
          <div className="space-y-6">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{isActive ? "Active" : "Draft"}</p>
                    <p className="text-xs text-muted-foreground">
                      {isActive ? "Visible in storefront" : "Hidden from customers"}
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={(v) => setValue("isActive", v)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Product Type */}
            <Card>
              <CardHeader>
                <CardTitle>Product Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(["physical", "digital"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setValue("type", type)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-md border text-sm transition-colors",
                      productType === type
                        ? "border-primary bg-primary/5 font-medium"
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Categories</CardTitle>
                  {selectedCategories.length > 0 && (
                    <Badge variant="secondary">{selectedCategories.length}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {categoriesTree && categoriesTree.length > 0 ? (
                  <div className="max-h-72 overflow-y-auto">
                    <CategoryCheckboxTree
                      categories={categoriesTree}
                      selected={selectedCategories}
                      onToggle={toggleCategory}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No categories yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
