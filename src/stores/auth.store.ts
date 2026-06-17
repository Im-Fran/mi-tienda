import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Customer } from '@/api/types'

// ---------- User session (owner / admin) ----------

interface UserSession {
  token: string
  user: User
}

interface AuthStore {
  session: UserSession | null
  setSession: (session: UserSession) => void
  clearSession: () => void
  token: () => string | null
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      session: null,
      setSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),
      token: () => get().session?.token ?? null,
    }),
    { name: 'mitenda-user-session' }
  )
)

// ---------- Customer session (buyer) ----------

interface CustomerSession {
  token: string
  customer: Customer
}

interface CustomerAuthStore {
  session: CustomerSession | null
  setSession: (session: CustomerSession) => void
  clearSession: () => void
  token: () => string | null
}

export const useCustomerAuthStore = create<CustomerAuthStore>()(
  persist(
    (set, get) => ({
      session: null,
      setSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),
      token: () => get().session?.token ?? null,
    }),
    { name: 'mitenda-customer-session' }
  )
)
