import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { ErrorState } from "@/components/shared/ErrorState"
import { EmptyState } from "@/components/shared/EmptyState"
import { useProducts } from "@/hooks/useProducts"
import { useCategories } from "@/hooks/useCategories"
import { useStores } from "@/hooks/useStores"
import { formatCurrency } from "@/lib/utils"
import type { Product, Category } from "@/api/types"

function CategoryFilter({
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
    <div style={{ paddingLeft: depth * 12 }}>
      {categories.map((cat) => (
        <div key={cat.id}>
          <div className="flex items-center gap-2 py-1">
            <Checkbox
              id={`filter-${cat.id}`}
              checked={selected.includes(cat.id)}
              onCheckedChange={() => onToggle(cat.id)}
            />
            <Label htmlFor={`filter-${cat.id}`} className="text-sm cursor-pointer">{cat.name}</Label>
          </div>
          {cat.children.length > 0 && (
            <CategoryFilter categories={cat.children} selected={selected} onToggle={onToggle} depth={depth + 1} />
          )}
        </div>
      ))}
    </div>
  )
}

export function ProductsListPage() {
  const { storeSlug } = useParams<{ storeSlug: string }>()
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [page, setPage] = useState(1)

  const { data: stores } = useStores()
  const store = stores?.find((s) => s.slug === storeSlug)
  const storeId = store?.id ?? ""

  const { data: categoriesData } = useCategories(storeId)
  const { data, isLoading, isError, refetch } = useProducts(storeId, {
    search: search || undefined,
    category: selectedCategories[0],
    active: "true",
    page,
    perPage: 20,
  })

  function toggleCategory(id: string) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [id]
    )
    setPage(1)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="w-52 shrink-0 hidden md:block">
          <div className="sticky top-24">
            <h3 className="font-semibold text-sm mb-3">Categories</h3>
            {categoriesData && categoriesData.length > 0 ? (
              <CategoryFilter
                categories={categoriesData}
                selected={selectedCategories}
                onToggle={toggleCategory}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No categories</p>
            )}
            {selectedCategories.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 w-full"
                onClick={() => setSelectedCategories([])}
              >
                Clear filter
              </Button>
            )}
          </div>
        </aside>

        {/* Products */}
        <div className="flex-1">
          <div className="mb-4">
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="max-w-sm"
            />
          </div>

          {isLoading ? (
            <LoadingSpinner className="py-16" />
          ) : isError ? (
            <ErrorState message="Failed to load products" retry={refetch} />
          ) : !data?.products?.length ? (
            <EmptyState message="No products found." />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {data.products.map((product) => (
                  <ProductCard key={product.id} product={product} storeSlug={storeSlug!} onNavigate={navigate} />
                ))}
              </div>

              {data.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {page} / {data.pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= data.pagination.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ProductCard({
  product,
  storeSlug,
  onNavigate,
}: {
  product: Product
  storeSlug: string
  onNavigate: (path: string) => void
}) {
  const minPrice = product.variants.length > 0
    ? Math.min(...product.variants.map((v) => v.price))
    : null
  const mainImage = product.images.find((i) => i.isMain) ?? product.images[0]

  return (
    <Card
      className="cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
      onClick={() => onNavigate(`/store/${storeSlug}/products/${product.id}`)}
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
