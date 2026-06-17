import { apiClient } from '@/api/client'
import type { User, Customer } from '@/api/types'

// ---------- User auth ----------

export function sendMagicLink(email: string) {
  return apiClient.post<{ sent: boolean }>('/api/auth/magic-link', { email })
}

export function verifyMagicLink(token: string, email: string) {
  return apiClient.get<{ token: string; user: User }>(
    `/api/auth/magic-link/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`
  )
}

export function getOAuthUrl(provider: 'google' | 'github') {
  return `${import.meta.env.VITE_API_BASE_URL}/api/auth/oauth/${provider}`
}

export function logout() {
  return apiClient.post<{ loggedOut: boolean }>('/api/auth/logout')
}

export function getMe() {
  return apiClient.get<{ user: User }>('/api/auth/me')
}

// ---------- Customer auth ----------

export function sendCustomerMagicLink(email: string) {
  return apiClient.post<{ sent: boolean }>('/api/auth/customer/magic-link', { email })
}

export function verifyCustomerMagicLink(token: string, email: string) {
  return apiClient.get<{ token: string; customer: Customer }>(
    `/api/auth/customer/magic-link/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`
  )
}

export function getCustomerOAuthUrl(provider: 'google' | 'github', storeSlug?: string) {
  const base = `${import.meta.env.VITE_API_BASE_URL}/api/auth/customer/oauth/${provider}`
  return storeSlug ? `${base}?store_slug=${encodeURIComponent(storeSlug)}` : base
}

export function customerLogout() {
  return apiClient.post<{ loggedOut: boolean }>('/api/auth/customer/logout')
}

export function getCustomerMe() {
  return apiClient.get<{ customer: Customer }>('/api/auth/customer/me')
}
