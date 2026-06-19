/**
 * Unit tests for API endpoint functions.
 * Verifies correct URL construction and HTTP methods.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: { getState: () => ({ token: () => 'user-token', clearSession: vi.fn() }) },
  useCustomerAuthStore: { getState: () => ({ token: () => null, clearSession: vi.fn() }) },
}))
vi.mock('@/stores/cart.store', () => ({
  useCartStore: { getState: () => ({ guestToken: null }) },
}))

import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/api/endpoints/products'
import {
  listOrders,
  getOrder,
  updateOrderStatus,
} from '@/api/endpoints/orders'
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/api/endpoints/categories'
import {
  getStatsSummary,
  getTopProducts,
  getOrdersByStatus,
  getRevenueOverTime,
} from '@/api/endpoints/stats'
import {
  listAdminCarts,
  getAdminCart,
  createCart,
} from '@/api/endpoints/carts'

function mockSuccess(data: unknown) {
  global.fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ status: 'success', data }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  )
}

// URL captured from fetch call (path portion only, strip any base)
function captureUrl(): string {
  const raw = vi.mocked(global.fetch).mock.calls[0][0] as string
  try {
    return new URL(raw).pathname + (new URL(raw).search || '')
  } catch {
    return raw
  }
}

function captureMethod(): string {
  return ((vi.mocked(global.fetch).mock.calls[0][1] as RequestInit).method ?? 'GET')
}

function captureBody(): unknown {
  const body = (vi.mocked(global.fetch).mock.calls[0][1] as RequestInit).body
  return body ? JSON.parse(body as string) : undefined
}

const STORE = 'store-abc'

describe('products endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSuccess({ products: [], pagination: { page: 1, perPage: 20, total: 0, totalPages: 0 } })
  })

  it('listProducts calls GET /api/stores/:id/products', async () => {
    await listProducts(STORE)
    expect(captureUrl()).toBe(`/api/stores/${STORE}/products`)
    expect(captureMethod()).toBe('GET')
  })

  it('listProducts appends query params', async () => {
    await listProducts(STORE, { search: 'hoodie', type: 'physical', page: 2, perPage: 10 })
    const url = captureUrl()
    expect(url).toContain('search=hoodie')
    expect(url).toContain('type=physical')
    expect(url).toContain('page=2')
    expect(url).toContain('perPage=10')
  })

  it('getProduct calls GET /api/stores/:id/products/:productId', async () => {
    mockSuccess({ product: {} })
    await getProduct(STORE, 'p1')
    expect(captureUrl()).toBe(`/api/stores/${STORE}/products/p1`)
  })

  it('createProduct calls POST /api/stores/:id/products with body', async () => {
    mockSuccess({ product: {} })
    await createProduct(STORE, { name: 'T-Shirt', type: 'physical' })
    expect(captureMethod()).toBe('POST')
    expect(captureUrl()).toBe(`/api/stores/${STORE}/products`)
    expect(captureBody()).toMatchObject({ name: 'T-Shirt', type: 'physical' })
  })

  it('updateProduct calls PATCH', async () => {
    mockSuccess({ product: {} })
    await updateProduct(STORE, 'p1', { isActive: false })
    expect(captureMethod()).toBe('PATCH')
    expect(captureUrl()).toBe(`/api/stores/${STORE}/products/p1`)
  })

  it('deleteProduct calls DELETE', async () => {
    mockSuccess({ deleted: true })
    await deleteProduct(STORE, 'p1')
    expect(captureMethod()).toBe('DELETE')
    expect(captureUrl()).toBe(`/api/stores/${STORE}/products/p1`)
  })
})

describe('orders endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSuccess({ orders: [], pagination: { page: 1, perPage: 20, total: 0, totalPages: 0 } })
  })

  it('listOrders calls GET /api/stores/:id/orders', async () => {
    await listOrders(STORE)
    expect(captureUrl()).toBe(`/api/stores/${STORE}/orders`)
  })

  it('listOrders appends status filter', async () => {
    await listOrders(STORE, { status: 'paid' })
    expect(captureUrl()).toContain('status=paid')
  })

  it('getOrder calls GET /api/stores/:id/orders/:orderId', async () => {
    mockSuccess({ order: {} })
    await getOrder(STORE, 'o1')
    expect(captureUrl()).toBe(`/api/stores/${STORE}/orders/o1`)
  })

  it('updateOrderStatus calls PATCH /orders/:id/status with { status }', async () => {
    mockSuccess({ order: {} })
    await updateOrderStatus(STORE, 'o1', 'paid')
    expect(captureMethod()).toBe('PATCH')
    expect(captureUrl()).toBe(`/api/stores/${STORE}/orders/o1/status`)
    expect(captureBody()).toEqual({ status: 'paid' })
  })
})

describe('categories endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSuccess({ categories: [] })
  })

  it('listCategories calls GET /api/stores/:id/categories', async () => {
    await listCategories(STORE)
    expect(captureUrl()).toBe(`/api/stores/${STORE}/categories`)
  })

  it('createCategory calls POST with body', async () => {
    mockSuccess({ category: {} })
    await createCategory(STORE, { name: 'Shoes' })
    expect(captureMethod()).toBe('POST')
    expect(captureBody()).toMatchObject({ name: 'Shoes' })
  })

  it('updateCategory calls PATCH', async () => {
    mockSuccess({ category: {} })
    await updateCategory(STORE, 'c1', { name: 'Boots' })
    expect(captureMethod()).toBe('PATCH')
    expect(captureUrl()).toBe(`/api/stores/${STORE}/categories/c1`)
  })

  it('deleteCategory appends recursive param', async () => {
    mockSuccess({ deleted: true })
    await deleteCategory(STORE, 'c1', true)
    expect(captureUrl()).toContain('recursive=true')
    expect(captureMethod()).toBe('DELETE')
  })
})

describe('stats endpoints', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getStatsSummary calls GET /stats/summary', async () => {
    mockSuccess({ totalRevenue: 0, totalOrders: 0, averageOrderValue: 0, currencyCode: 'USD' })
    await getStatsSummary(STORE)
    expect(captureUrl()).toBe(`/api/stores/${STORE}/stats/summary`)
  })

  it('getStatsSummary appends from/to params', async () => {
    mockSuccess({ totalRevenue: 0, totalOrders: 0, averageOrderValue: 0, currencyCode: 'USD' })
    await getStatsSummary(STORE, { from: '2024-01-01', to: '2024-12-31' })
    const url = captureUrl()
    expect(url).toContain('from=2024-01-01')
    expect(url).toContain('to=2024-12-31')
  })

  it('getTopProducts calls GET /stats/top-products', async () => {
    mockSuccess({ products: [] })
    await getTopProducts(STORE)
    expect(captureUrl()).toBe(`/api/stores/${STORE}/stats/top-products`)
  })

  it('getOrdersByStatus calls GET /stats/orders-by-status', async () => {
    mockSuccess({ data: [] })
    await getOrdersByStatus(STORE)
    expect(captureUrl()).toBe(`/api/stores/${STORE}/stats/orders-by-status`)
  })

  it('getRevenueOverTime calls GET /stats/revenue-over-time', async () => {
    mockSuccess({ data: [] })
    await getRevenueOverTime(STORE)
    expect(captureUrl()).toBe(`/api/stores/${STORE}/stats/revenue-over-time`)
  })
})

describe('carts endpoints', () => {
  beforeEach(() => vi.clearAllMocks())

  it('listAdminCarts calls GET /api/stores/:id/carts', async () => {
    mockSuccess({ carts: [], pagination: { page: 1, perPage: 20, total: 0, totalPages: 0 } })
    await listAdminCarts(STORE)
    expect(captureUrl()).toBe(`/api/stores/${STORE}/carts`)
  })

  it('listAdminCarts appends status=active (valid backend status)', async () => {
    mockSuccess({ carts: [], pagination: { page: 1, perPage: 20, total: 0, totalPages: 0 } })
    await listAdminCarts(STORE, { status: 'active' })
    expect(captureUrl()).toContain('status=active')
  })

  it('listAdminCarts appends status=abandoned (valid backend status)', async () => {
    mockSuccess({ carts: [], pagination: { page: 1, perPage: 20, total: 0, totalPages: 0 } })
    await listAdminCarts(STORE, { status: 'abandoned' })
    expect(captureUrl()).toContain('status=abandoned')
  })

  it('getAdminCart calls GET /api/stores/:id/carts/:cartId', async () => {
    mockSuccess({ cart: {} })
    await getAdminCart(STORE, 'cart-1')
    expect(captureUrl()).toBe(`/api/stores/${STORE}/carts/cart-1`)
  })

  it('createCart calls POST /api/stores/:id/cart', async () => {
    mockSuccess({ cart: {}, guestToken: 'tok-abc' })
    await createCart(STORE)
    expect(captureMethod()).toBe('POST')
    expect(captureUrl()).toBe(`/api/stores/${STORE}/cart`)
  })
})
