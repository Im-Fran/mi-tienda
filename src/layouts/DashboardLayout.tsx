import { Outlet, NavLink, useNavigate, useParams } from "react-router-dom"
import {
  LayoutDashboard, Store, Package, FolderTree, Tag, Users,
  ShoppingCart, ClipboardList, CreditCard, Truck, Settings,
  BarChart3, Shield, UserCog, ChevronDown, LogOut, User,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuthStore } from "@/stores/auth.store"
import { useLogout } from "@/hooks/useAuth"
import { useStores } from "@/hooks/useStores"
import { cn } from "@/lib/utils"

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
}

function NavSection({ title, items }: { title?: string; items: NavItem[] }) {
  return (
    <div className="space-y-1">
      {title && (
        <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          {title}
        </p>
      )}
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )
          }
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {item.label}
        </NavLink>
      ))}
    </div>
  )
}

export function DashboardLayout() {
  const { storeId } = useParams<{ storeId?: string }>()
  const session = useAuthStore((s) => s.session)
  const navigate = useNavigate()
  const { mutate: doLogout } = useLogout()
  const { data: stores } = useStores()

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : session?.user?.email?.[0]?.toUpperCase() ?? "U"

  const globalNav: NavItem[] = [
    { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/stores", icon: Store, label: "My Stores" },
  ]

  const storeNav: NavItem[] = storeId
    ? [
        { to: `/admin/stores/${storeId}/products`, icon: Package, label: "Products" },
        { to: `/admin/stores/${storeId}/categories`, icon: FolderTree, label: "Categories" },
        { to: `/admin/stores/${storeId}/coupons`, icon: Tag, label: "Coupons" },
        { to: `/admin/stores/${storeId}/customers`, icon: Users, label: "Customers" },
        { to: `/admin/stores/${storeId}/carts`, icon: ShoppingCart, label: "Carts" },
        { to: `/admin/stores/${storeId}/orders`, icon: ClipboardList, label: "Orders" },
        { to: `/admin/stores/${storeId}/payments`, icon: CreditCard, label: "Payments" },
        { to: `/admin/stores/${storeId}/shipping`, icon: Truck, label: "Shipping" },
        { to: `/admin/stores/${storeId}/stats`, icon: BarChart3, label: "Stats" },
        { to: `/admin/stores/${storeId}/settings`, icon: Settings, label: "Settings" },
      ]
    : []

  const systemNav: NavItem[] = [
    { to: "/admin/system/users", icon: UserCog, label: "Users" },
    { to: "/admin/system/roles", icon: Shield, label: "Roles" },
  ]

  const currentStore = stores?.find((s) => s.id === storeId)

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-60 border-r bg-sidebar flex flex-col shrink-0">
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b">
          <span className="font-bold text-lg text-sidebar-foreground">Mi Tienda</span>
        </div>

        {/* Store selector */}
        {stores && stores.length > 0 && (
          <div className="px-3 py-3 border-b">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-xs hover:bg-accent hover:text-accent-foreground focus:outline-none">
                <span className="truncate">
                  {currentStore?.name ?? "Select store"}
                </span>
                <ChevronDown className="h-3 w-3 shrink-0 ml-1" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52">
                {stores.map((s) => (
                  <DropdownMenuItem
                    key={s.id}
                    onClick={() => navigate(`/admin/stores/${s.id}/products`)}
                  >
                    {s.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/admin/stores/new")}>
                  + New store
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <NavSection items={globalNav} />
          {storeNav.length > 0 && (
            <NavSection title={currentStore?.name ?? "Store"} items={storeNav} />
          )}
          <NavSection title="System" items={systemNav} />
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 border-b flex items-center justify-between px-6 bg-background shrink-0">
          <div className="text-sm text-muted-foreground">
            {currentStore ? (
              <span>{currentStore.name}</span>
            ) : (
              <span>Admin Dashboard</span>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground focus:outline-none">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm">{session?.user?.name ?? session?.user?.email}</span>
              <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate("/admin/dashboard")}>
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => doLogout(undefined, { onSuccess: () => navigate("/admin/login") })}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
