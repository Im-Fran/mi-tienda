/**
 * Unit tests for the API client (request, error handling, auth headers).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: {
    getState: () => ({ token: () => 'admin-token', clearSession: vi.fn() }),
  },
  useCustomerAuthStore: {
    getState: () => ({ token: () => null, clearSession: vi.fn() }),
  },
}))
vi.mock('@/stores/cart.store', () => ({
  useCartStore: { getState: () => ({ guestToken: null }) },
}))

import { apiClient, ApiError } from '@/api/client'

function mockFetch(body: unknown, status = 200) {
  global.fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    }),
  )
}

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock location for redirect tests
    Object.defineProperty(window, 'location', {
      value: { pathname: '/admin/dashboard', href: '' },
      writable: true,
    })
  })

  it('GET success: returns data from JSend success', async () => {
    mockFetch({ status: 'success', data: { foo: 'bar' } })
    const result = await apiClient.get<{ foo: string }>('/api/stores/x/products')
    expect(result).toEqual({ foo: 'bar' })
  })

  it('attaches Authorization header for admin paths', async () => {
    mockFetch({ status: 'success', data: {} })
    await apiClient.get('/api/stores/x/products')
    const headers = (vi.mocked(global.fetch).mock.calls[0][1] as RequestInit)
      .headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer admin-token')
  })

  it('throws ApiError with status=fail for JSend fail responses', async () => {
    mockFetch({ status: 'fail', message: 'Not found', data: null }, 404)
    let caught: ApiError | null = null
    try {
      await apiClient.get('/api/stores/x/products')
    } catch (err) {
      caught = err as ApiError
    }
    expect(caught).toBeInstanceOf(ApiError)
    expect(caught!.status).toBe('fail')
    expect(caught!.message).toBe('Not found')
  })

  it('throws ApiError with status=error for JSend error responses', async () => {
    mockFetch({ status: 'error', message: 'Server error' }, 500)
    let caught: ApiError | null = null
    try {
      await apiClient.get('/api/admin/users')
    } catch (err) {
      caught = err as ApiError
    }
    expect(caught).toBeInstanceOf(ApiError)
    expect(caught!.status).toBe('error')
    expect(caught!.message).toBe('Server error')
  })

  it('POST serializes body as JSON', async () => {
    mockFetch({ status: 'success', data: {} })
    await apiClient.post('/api/stores/x/products', { name: 'Hat' })
    const init = vi.mocked(global.fetch).mock.calls[0][1] as RequestInit
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({ name: 'Hat' })
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json')
  })

  it('PATCH serializes body as JSON', async () => {
    mockFetch({ status: 'success', data: {} })
    await apiClient.patch('/api/stores/x/products/1', { isActive: false })
    const init = vi.mocked(global.fetch).mock.calls[0][1] as RequestInit
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body as string)).toEqual({ isActive: false })
  })

  it('DELETE uses DELETE method', async () => {
    mockFetch({ status: 'success', data: { deleted: true } })
    await apiClient.delete('/api/stores/x/products/1')
    const init = vi.mocked(global.fetch).mock.calls[0][1] as RequestInit
    expect(init.method).toBe('DELETE')
  })

  it('handles empty response body gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('', { status: 200 }))
    const result = await apiClient.delete('/api/stores/x/products/1')
    expect(result).toBeUndefined()
  })

  it('throws ApiError on invalid JSON', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response('not-json', { status: 200, headers: { 'content-type': 'text/plain' } }),
    )
    let caught: ApiError | null = null
    try {
      await apiClient.get('/api/stores/x/products')
    } catch (err) {
      caught = err as ApiError
    }
    expect(caught).toBeInstanceOf(ApiError)
  })

  it('throws ApiError on 401 Unauthorized', async () => {
    mockFetch({ status: 'fail', message: 'Unauthorized' }, 401)
    let caught: ApiError | null = null
    try {
      await apiClient.get('/api/stores/x/products')
    } catch (err) {
      caught = err as ApiError
    }
    expect(caught).toBeInstanceOf(ApiError)
    expect(caught!.message).toBe('Unauthorized')
  })
})
