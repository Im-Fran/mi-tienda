import { useNavigate } from "react-router-dom"
import { Store, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { useAuthStore } from "@/stores/auth.store"
import { useStores } from "@/hooks/useStores"

export function DashboardPage() {
  const session = useAuthStore((s) => s.session)
  const { data: stores, isLoading } = useStores()
  const navigate = useNavigate()

  const name = session?.user?.name ?? session?.user?.email ?? "there"

  if (isLoading) return <LoadingSpinner className="py-16" />

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${name}`}
        actions={
          <Button onClick={() => navigate("/admin/stores/new")}
            disabled={(stores?.length ?? 0) >= 3}
          >
            New Store
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Your Stores</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stores?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">of 3 maximum</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate("/admin/stores")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Manage Stores</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">View and manage your stores</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate("/admin/system/users")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">System Admin</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Manage users and roles</p>
          </CardContent>
        </Card>
      </div>

      {stores && stores.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Your Stores</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stores.map((store) => (
              <Card
                key={store.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate(`/admin/stores/${store.id}/products`)}
              >
                <CardHeader>
                  <CardTitle className="text-base">{store.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">/{store.slug}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
