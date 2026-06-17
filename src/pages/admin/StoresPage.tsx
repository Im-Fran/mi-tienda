import { useNavigate } from "react-router-dom"
import { Settings, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { ErrorState } from "@/components/shared/ErrorState"
import { EmptyState } from "@/components/shared/EmptyState"
import { useStores } from "@/hooks/useStores"

export function StoresPage() {
  const navigate = useNavigate()
  const { data: stores, isLoading, isError, refetch } = useStores()

  const atLimit = (stores?.length ?? 0) >= 3

  if (isLoading) return <LoadingSpinner className="py-16" />
  if (isError) return <ErrorState message="Failed to load stores" retry={refetch} />

  return (
    <div>
      <PageHeader
        title="My Stores"
        actions={
          <Tooltip>
            <TooltipTrigger>
              <span>
                <Button
                  onClick={() => navigate("/admin/stores/new")}
                  disabled={atLimit}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Store
                </Button>
              </span>
            </TooltipTrigger>
            {atLimit && (
              <TooltipContent>
                You've reached the 3-store limit
              </TooltipContent>
            )}
          </Tooltip>
        }
      />

      {!stores || stores.length === 0 ? (
        <EmptyState
          message="You don't have any stores yet."
          action={{ label: "Create your first store", onClick: () => navigate("/admin/stores/new") }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((store) => (
            <Card key={store.id} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{store.name}</CardTitle>
                    <CardDescription className="mt-1">/{store.slug}</CardDescription>
                  </div>
                  <Badge variant={store.isActive ? "default" : "secondary"}>
                    {store.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/admin/stores/${store.id}/products`)}
                  >
                    Manage
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/admin/stores/${store.id}/settings`)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
