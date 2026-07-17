import { BrowserRouter, Routes, Route, Navigate, Outlet, useParams } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"

import { useAuthStore } from "@/stores/auth.store"
import { useCustomerAuthStore } from "@/stores/auth.store"

import { DashboardLayout } from "@/layouts/DashboardLayout"
import { StorefrontLayout } from "@/layouts/StorefrontLayout"
import { ErrorBoundary } from "@/components/shared/ErrorBoundary"
import { NotFoundPage } from "@/pages/not-found"

// Admin pages
import { AdminLoginPage } from "@/pages/admin/auth/login"
import { DashboardPage } from "@/pages/admin/dashboard"
import { StoresPage } from "@/pages/admin/stores/list"
import { NewStorePage } from "@/pages/admin/stores/new"
import { ProductsPage } from "@/pages/admin/products/list"
import { ProductFormPage } from "@/pages/admin/products/edit"
import { CategoriesPage } from "@/pages/admin/categories"
import { CouponsPage } from "@/pages/admin/coupons"
import { CustomersPage } from "@/pages/admin/customers/list"
import { CustomerDetailPage } from "@/pages/admin/customers/view"
import { CartsPage } from "@/pages/admin/carts"
import { OrdersPage } from "@/pages/admin/orders/list"
import { OrderDetailPage } from "@/pages/admin/orders/view"
import { PaymentsPage } from "@/pages/admin/payments"
import { ShippingPage } from "@/pages/admin/shipping"
import { SettingsPage } from "@/pages/admin/settings"
import { StatsPage } from "@/pages/admin/stats"
import { SystemUsersPage } from "@/pages/admin/system/users"
import { SystemRolesPage } from "@/pages/admin/system/roles"

// Storefront pages
import { StorefrontHomePage } from "@/pages/storefront/home"
import { ProductsListPage } from "@/pages/storefront/products/list"
import { ProductDetailPage } from "@/pages/storefront/products/view"
import { CartPage } from "@/pages/storefront/cart"
import { CheckoutPage } from "@/pages/storefront/checkout"
import { CheckoutSuccessPage } from "@/pages/storefront/checkout/success"
import { CustomerLoginPage } from "@/pages/storefront/auth/login"
import { AccountPage } from "@/pages/storefront/account"
import { OrderHistoryPage } from "@/pages/storefront/orders/list"
import { StorefrontOrderDetailPage } from "@/pages/storefront/orders/view"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Route guard: requires authenticated user session
function RequireUserAuth() {
  const session = useAuthStore((s) => s.session)
  if (!session) return <Navigate to="/admin/login" replace />
  return <Outlet />
}

// Route guard: requires system role (optimistic — API returns 403 if unauthorized)
function RequireSystemRole() {
  const session = useAuthStore((s) => s.session)
  if (!session) return <Navigate to="/admin/login" replace />
  return <Outlet />
}

// Route guard: requires authenticated customer session
function RequireCustomerAuth() {
  const session = useCustomerAuthStore((s) => s.session)
  const { storeSlug } = useParams<{ storeSlug: string }>()
  if (!session) return <Navigate to={`/store/${storeSlug}/login`} replace />
  return <Outlet />
}

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              {/* Root redirect */}
              <Route path="/" element={<Navigate to="/admin/login" replace />} />

              {/* Admin - public */}
              <Route path="/admin/login" element={<AdminLoginPage />} />

              {/* Admin - protected */}
              <Route element={<RequireUserAuth />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/admin/dashboard" element={<DashboardPage />} />
                  <Route path="/admin/stores" element={<StoresPage />} />
                  <Route path="/admin/stores/new" element={<NewStorePage />} />
                  <Route path="/admin/stores/:storeId/products" element={<ProductsPage />} />
                  <Route path="/admin/stores/:storeId/products/new" element={<ProductFormPage />} />
                  <Route path="/admin/stores/:storeId/products/:id" element={<ProductFormPage />} />
                  <Route path="/admin/stores/:storeId/categories" element={<CategoriesPage />} />
                  <Route path="/admin/stores/:storeId/coupons" element={<CouponsPage />} />
                  <Route path="/admin/stores/:storeId/customers" element={<CustomersPage />} />
                  <Route path="/admin/stores/:storeId/customers/:id" element={<CustomerDetailPage />} />
                  <Route path="/admin/stores/:storeId/carts" element={<CartsPage />} />
                  <Route path="/admin/stores/:storeId/orders" element={<OrdersPage />} />
                  <Route path="/admin/stores/:storeId/orders/:id" element={<OrderDetailPage />} />
                  <Route path="/admin/stores/:storeId/payments" element={<PaymentsPage />} />
                  <Route path="/admin/stores/:storeId/shipping" element={<ShippingPage />} />
                  <Route path="/admin/stores/:storeId/settings" element={<SettingsPage />} />
                  <Route path="/admin/stores/:storeId/stats" element={<StatsPage />} />

                  {/* System admin - role gated */}
                  <Route element={<RequireSystemRole />}>
                    <Route path="/admin/system/users" element={<SystemUsersPage />} />
                    <Route path="/admin/system/roles" element={<SystemRolesPage />} />
                  </Route>
                </Route>
              </Route>

              {/* Storefront */}
              <Route path="/store/:storeSlug" element={<StorefrontLayout />}>
                <Route index element={<StorefrontHomePage />} />
                <Route path="products" element={<ProductsListPage />} />
                <Route path="products/:id" element={<ProductDetailPage />} />
                <Route path="cart" element={<CartPage />} />
                <Route path="checkout" element={<CheckoutPage />} />
                <Route path="checkout/success" element={<CheckoutSuccessPage />} />
                <Route path="login" element={<CustomerLoginPage />} />

                {/* Customer-authenticated storefront routes */}
                <Route element={<RequireCustomerAuth />}>
                  <Route path="account" element={<AccountPage />} />
                  <Route path="orders" element={<OrderHistoryPage />} />
                  <Route path="orders/:id" element={<StorefrontOrderDetailPage />} />
                </Route>
              </Route>

              {/* Catch-all 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
