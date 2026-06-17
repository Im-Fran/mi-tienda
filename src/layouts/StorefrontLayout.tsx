import { Outlet, NavLink, useNavigate, useParams } from "react-router-dom"
import { ShoppingCart, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useCustomerAuthStore } from "@/stores/auth.store"
import { useCartStore } from "@/stores/cart.store"
import { cn } from "@/lib/utils"

export function StorefrontLayout() {
  const { storeSlug } = useParams<{ storeSlug: string }>()
  const session = useCustomerAuthStore((s) => s.session)
  const { clearSession } = useCustomerAuthStore()
  const itemCount = useCartStore((s) => s.itemCount)
  const navigate = useNavigate()

  const initials = session?.customer?.name
    ? session.customer.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : session?.customer?.email?.[0]?.toUpperCase() ?? "C"

  const base = `/store/${storeSlug}`

  function handleLogout() {
    clearSession()
    navigate(`${base}/login`)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <NavLink to={base} className="font-bold text-xl text-foreground">
            {storeSlug}
          </NavLink>

          {/* Nav links */}
          <nav className="hidden sm:flex items-center gap-6">
            <NavLink
              to={base}
              end
              className={({ isActive }) =>
                cn("text-sm font-medium transition-colors", isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground")
              }
            >
              Home
            </NavLink>
            <NavLink
              to={`${base}/products`}
              className={({ isActive }) =>
                cn("text-sm font-medium transition-colors", isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground")
              }
            >
              Products
            </NavLink>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => navigate(`${base}/cart`)}
              aria-label="Cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {itemCount > 99 ? "99+" : itemCount}
                </Badge>
              )}
            </Button>

            {/* Customer account */}
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 rounded-md p-1 hover:bg-accent focus:outline-none">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`${base}/account`)}>
                    <User className="h-4 w-4 mr-2" />
                    My Account
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`${base}/orders`)}>
                    My Orders
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`${base}/login`)}
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          {storeSlug} &mdash; &copy; {new Date().getFullYear()} All rights reserved.
        </div>
      </footer>
    </div>
  )
}
