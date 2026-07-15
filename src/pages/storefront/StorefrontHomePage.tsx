import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { ErrorState } from "@/components/shared/ErrorState"
import { useProducts } from "@/hooks/useProducts"
import { useStores } from "@/hooks/useStores"
import { formatCurrency } from "@/lib/utils"
import type { Product } from "@/api/types"

function ProductCard({ product, storeSlug }: { product: Product; storeSlug: string }) {
  const navigate = useNavigate()
  const minPrice = product.variants.length > 0
    ? Math.min(...product.variants.map((v) => v.price))
    : null
  const mainImage = product.images.find((i) => i.isMain) ?? product.images[0]

  return (
    <Card
      className="cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
      onClick={() => navigate(`/store/${storeSlug}/products/${product.id}`)}
    >
      <div className="aspect-square bg-muted">
        {mainImage ? (
          <img
            src={`${import.meta.env.VITE_API_BASE_URL}/cdn/${mainImage.r2Key}`}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            No image
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <p className="font-medium text-sm truncate">{product.name}</p>
        <div className="flex items-center justify-between mt-1">
          {minPrice !== null && (
            <span className="text-sm font-semibold">{formatCurrency(minPrice, "$")}</span>
          )}
          <Badge variant="outline" className="text-xs">{product.type}</Badge>
        </div>
      </CardContent>
    </Card>
  )
}

export function StorefrontHomePage() {
  const { storeSlug } = useParams<{ storeSlug: string }>()
  const navigate = useNavigate()
  const { data: stores } = useStores()
  const store = stores?.find((s) => s.slug === storeSlug)

  // Get first store that matches slug from list, or use a dummy storeId
  // For storefront, we need to find storeId from slug
  const storeId = store?.id

  const { data, isLoading, isError, error } = useProducts(storeId ?? "", { perPage: 8, active: "true" })

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Store header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-2">{store?.name ?? storeSlug}</h1>
        <p className="text-muted-foreground">Welcome to our store</p>
        <Button className="mt-4" onClick={() => navigate(`/store/${storeSlug}/products`)}>
          Browse All Products
        </Button>
      </div>

      {/* Featured products */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Featured Products</h2>
        {isLoading ? (
          <LoadingSpinner className="py-8" />
        ) : isError ? (
          <ErrorState message="Failed to load products" error={error} />
        ) : !data?.products?.length ? (
          <p className="text-muted-foreground">No products available yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.products.map((product) => (
              <ProductCard key={product.id} product={product} storeSlug={storeSlug!} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
