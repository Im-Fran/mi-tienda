import { useAuthStore } from '@/stores/auth.store'
import { useCustomerAuthStore } from '@/stores/auth.store'
import { useCartStore } from '@/stores/cart.store'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export class ApiError extends Error {
  status: 'fail' | 'error'
  data: unknown

  constructor(status: 'fail' | 'error', data: unknown, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

function getToken(path: string): string | null {
  // Admin routes use user session; storefront routes use customer session
  if (path.startsWith('/api/admin') || path.startsWith('/api/stores') || path.startsWith('/api/users')) {
    return useAuthStore.getState().token()
  }
  if (path.startsWith('/api/customers') || path.startsWith('/api/auth/customer')) {
    return useCustomerAuthStore.getState().token()
  }
  // For cart paths, try customer token first, then guest flow handles header separately
  return useCustomerAuthStore.getState().token() ?? useAuthStore.getState().token()
}

function getGuestToken(path: string): string | null {
  if (path.includes('/cart')) {
    return useCartStore.getState().guestToken
  }
  return null
}

function handleUnauthorized(): void {
  useAuthStore.getState().clearSession()
  useCustomerAuthStore.getState().clearSession()
  // Use window.location to avoid circular import with router
  const current = window.location.pathname
  if (!current.startsWith('/admin/login') && !current.startsWith('/store')) {
    window.location.href = '/admin/login'
  } else if (current.startsWith('/store')) {
    // Stay on storefront, customer session cleared
  } else {
    window.location.href = '/admin/login'
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken(path)
  const guestToken = getGuestToken(path)

  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  if (guestToken) {
    headers['X-Guest-Token'] = guestToken
  }
  if (!(init.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
  })

  if (response.status === 401) {
    handleUnauthorized()
    throw new ApiError('fail', null, 'Unauthorized')
  }

  // Handle empty responses
  const text = await response.text()
  if (!text) {
    if (!response.ok) throw new ApiError('error', null, `HTTP ${response.status}`)
    return undefined as unknown as T
  }

  let json: { status: string; data?: unknown; message?: string }
  try {
    json = JSON.parse(text)
  } catch {
    throw new ApiError('error', null, `Invalid JSON response: ${text.slice(0, 100)}`)
  }

  if (json.status === 'success') {
    return json.data as T
  }

  if (json.status === 'fail') {
    throw new ApiError('fail', json.data, json.message ?? 'Request failed')
  }

  if (json.status === 'error') {
    throw new ApiError('error', json.data, json.message ?? 'Server error')
  }

  // Fallback: if not JSend format but response was OK
  if (response.ok) return json as unknown as T

  throw new ApiError('error', null, `Unexpected response status: ${json.status}`)
}

export const apiClient = {
  get<T>(path: string, options?: RequestInit): Promise<T> {
    return request<T>(path, { ...options, method: 'GET' })
  },

  post<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return request<T>(path, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  },

  patch<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  },

  delete<T>(path: string, options?: RequestInit): Promise<T> {
    return request<T>(path, { ...options, method: 'DELETE' })
  },

  postForm<T>(path: string, formData: FormData, options?: RequestInit): Promise<T> {
    return request<T>(path, {
      ...options,
      method: 'POST',
      body: formData,
      // Do NOT set Content-Type — browser sets multipart boundary automatically
    })
  },
}
