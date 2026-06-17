import { BrowserRouter, Routes, Route, Navigate, Outlet, useParams } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"

import { useAuthStore } from "@/stores/auth.store"
import { useCustomerAuthStore } from "@/stores/auth.store"

import { DashboardLayout } from "@/layouts/DashboardLayout"
import { StorefrontLayout } from "@/layouts/StorefrontLayout"

// Admin pages
import { AdminLoginPage } from "@/pages/admin/LoginPage"
import { DashboardPage } from "@/pages/admin/DashboardPage"
import { StoresPage } from "@/pages/admin/StoresPage"
import { NewStorePage } from "@/pages/admin/NewStorePage"
import { ProductsPage } from "@/pages/admin/ProductsPage"
import { ProductFormPage } from "@/pages/admin/ProductFormPage"
import { CategoriesPage } from "@/pages/admin/CategoriesPage"
import { CouponsPage } from "@/pages/admin/CouponsPage"
import { CustomersPage } from "@/pages/admin/CustomersPage"
import { CustomerDetailPage } from "@/pages/admin/CustomerDetailPage"
import { CartsPage } from "@/pages/admin/CartsPage"
import { OrdersPage } from "@/pages/admin/OrdersPage"
import { OrderDetailPage } from "@/pages/admin/OrderDetailPage"
import { PaymentsPage } from "@/pages/admin/PaymentsPage"
import { ShippingPage } from "@/pages/admin/ShippingPage"
import { SettingsPage } from "@/pages/admin/SettingsPage"
import { StatsPage } from "@/pages/admin/StatsPage"
import { SystemUsersPage } from "@/pages/admin/SystemUsersPage"
import { SystemRolesPage } from "@/pages/admin/SystemRolesPage"

// Storefront pages
import { StorefrontHomePage } from "@/pages/storefront/StorefrontHomePage"
import { ProductsListPage } from "@/pages/storefront/ProductsListPage"
import { ProductDetailPage } from "@/pages/storefront/ProductDetailPage"
import { CartPage } from "@/pages/storefront/CartPage"
import { CheckoutPage } from "@/pages/storefront/CheckoutPage"
import { CheckoutSuccessPage } from "@/pages/storefront/CheckoutSuccessPage"
import { CustomerLoginPage } from "@/pages/storefront/CustomerLoginPage"
import { AccountPage } from "@/pages/storefront/AccountPage"
import { OrderHistoryPage } from "@/pages/storefront/OrderHistoryPage"
import { StorefrontOrderDetailPage } from "@/pages/storefront/StorefrontOrderDetailPage"

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
          </Routes>
        </BrowserRouter>
        <Toaster richColors position="top-right" />
      </TooltipProvider>
    </QueryClientProvider>
  )
}
