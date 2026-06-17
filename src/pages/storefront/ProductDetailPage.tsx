import { useState } from "react"
import { useParams } from "react-router-dom"
import { toast } from "sonner"
import { ShoppingCart, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { ErrorState } from "@/components/shared/ErrorState"
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer"
import { useProduct } from "@/hooks/useProducts"
import { useStores } from "@/hooks/useStores"
import { useAddCartItem } from "@/hooks/useCarts"
import { useCartStore } from "@/stores/cart.store"
import { createCart } from "@/api/endpoints/carts"
import { formatCurrency } from "@/lib/utils"
import type { Product, ProductVariant } from "@/api/types"
import { ApiError } from "@/api/client"

function ProductDetail({ product, storeId }: { product: Product; storeId: string }) {
  const { mutateAsync: addToCart, isPending: addingToCart } = useAddCartItem(storeId)
  const cartStore = useCartStore()

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState(1)
  const [mainImageIndex, setMainImageIndex] = useState(0)

  // Get unique option groups
  const allOptions = product.variants.flatMap((v) => v.options)
  const optionGroups = Array.from(new Set(allOptions.map((o) => o.optionName)))

  // Find the selected variant
  function findSelectedVariant(): ProductVariant | null {
    if (product.variants.length === 0) return null
    if (product.variants.length === 1) return product.variants[0]
    return product.variants.find((v) =>
      v.options.every((o) => selectedOptions[o.optionName] === o.optionValue)
    ) ?? null
  }

  const selectedVariant = findSelectedVariant()
  const isOutOfStock = selectedVariant ? selectedVariant.stock === 0 : false
  const images = product.images.sort((a, b) => Number(b.isMain) - Number(a.isMain))

  async function handleAddToCart() {
    if (!selectedVariant) {
      toast.error("Please select a variant")
      return
    }

    try {
      let cartId = cartStore.cartId
      let guestToken = cartStore.guestToken ?? undefined

      if (!cartId) {
        const result = await createCart(storeId)
        cartId = result.cart.id
        guestToken = result.guestToken
        cartStore.setCart(cartId, 0, guestToken)
      }

      await addToCart({ variantId: selectedVariant.id, quantity })
      toast.success(`${product.name} added to cart`)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to add to cart"
      toast.error(msg)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="aspect-square rounded-lg overflow-hidden bg-muted">
            {images[mainImageIndex] ? (
              <img
                src={`${import.meta.env.VITE_API_BASE_URL}/cdn/${images[mainImageIndex].r2Key}`}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No image
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setMainImageIndex(i)}
                  className={`h-16 w-16 rounded border-2 overflow-hidden ${i === mainImageIndex ? "border-primary" : "border-transparent"}`}
                >
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URL}/cdn/${img.r2Key}`}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline">{product.type}</Badge>
              {!product.isActive && <Badge variant="destructive">Unavailable</Badge>}
            </div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            {product.shortDescription && (
              <p className="text-muted-foreground mt-2">{product.shortDescription}</p>
            )}
          </div>

          {/* Price */}
          {selectedVariant && (
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold">
                {formatCurrency(selectedVariant.price, "$")}
              </span>
              {selectedVariant.compareAtPrice && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatCurrency(selectedVariant.compareAtPrice, "$")}
                </span>
              )}
            </div>
          )}

          {/* Variant options */}
          {optionGroups.map((groupName) => {
            const values = Array.from(
              new Set(
                product.variants
                  .flatMap((v) => v.options)
                  .filter((o) => o.optionName === groupName)
                  .map((o) => o.optionValue)
              )
            )
            return (
              <div key={groupName} className="space-y-2">
                <p className="text-sm font-medium">{groupName}</p>
                <div className="flex flex-wrap gap-2">
                  {values.map((val) => (
                    <button
                      key={val}
                      onClick={() => setSelectedOptions((prev) => ({ ...prev, [groupName]: val }))}
                      className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                        selectedOptions[groupName] === val
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Stock indicator */}
          {selectedVariant && (
            <div>
              {isOutOfStock ? (
                <Badge variant="destructive">Out of stock</Badge>
              ) : selectedVariant.stock <= 5 ? (
                <Badge variant="outline" className="text-orange-600 border-orange-300">
                  Only {selectedVariant.stock} left
                </Badge>
              ) : (
                <Badge variant="outline" className="text-green-600 border-green-300">In stock</Badge>
              )}
            </div>
          )}

          {/* Quantity + Add to cart */}
          <div className="flex items-center gap-3">
            <div className="flex items-center border rounded">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="px-3 text-sm font-medium w-10 text-center">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setQuantity((q) => q + 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <Button
              size="lg"
              className="flex-1"
              disabled={isOutOfStock || !selectedVariant || addingToCart}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {isOutOfStock ? "Out of Stock" : addingToCart ? "Adding..." : "Add to Cart"}
            </Button>
          </div>
        </div>
      </div>

      {/* Full description */}
      {product.fullDescription && (
        <div className="mt-12">
          <Separator className="mb-6" />
          <h2 className="text-lg font-semibold mb-4">Description</h2>
          <MarkdownRenderer content={product.fullDescription} />
        </div>
      )}
    </div>
  )
}

export function ProductDetailPage() {
  const { storeSlug, id } = useParams<{ storeSlug: string; id: string }>()
  const { data: stores } = useStores()
  const store = stores?.find((s) => s.slug === storeSlug)
  const storeId = store?.id ?? ""

  const { data: product, isLoading, isError, refetch } = useProduct(storeId, id!)

  if (isLoading) return <LoadingSpinner className="py-16" />
  if (isError || !product) return <ErrorState message="Product not found" retry={refetch} />

  return <ProductDetail product={product} storeId={storeId} />
}
