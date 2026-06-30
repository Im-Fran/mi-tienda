/**
 * Unit tests for Zustand stores (auth and cart).
 */
import { describe, expect, it, beforeEach } from 'vitest'
import { useCartStore } from '@/stores/cart.store'
import { useAuthStore, useCustomerAuthStore } from '@/stores/auth.store'

describe('cart store', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart()
  })

  it('initial state is empty', () => {
    const state = useCartStore.getState()
    expect(state.cartId).toBeNull()
    expect(state.guestToken).toBeNull()
    expect(state.itemCount).toBe(0)
  })

  it('setCart updates cartId, itemCount and guestToken', () => {
    useCartStore.getState().setCart('cart-123', 5, 'guest-tok')
    const state = useCartStore.getState()
    expect(state.cartId).toBe('cart-123')
    expect(state.itemCount).toBe(5)
    expect(state.guestToken).toBe('guest-tok')
  })

  it('setCart without guestToken sets it to null', () => {
    useCartStore.getState().setCart('cart-456', 2)
    expect(useCartStore.getState().guestToken).toBeNull()
  })

  it('clearCart resets all fields to defaults', () => {
    useCartStore.getState().setCart('cart-789', 3, 'tok-abc')
    useCartStore.getState().clearCart()
    const state = useCartStore.getState()
    expect(state.cartId).toBeNull()
    expect(state.guestToken).toBeNull()
    expect(state.itemCount).toBe(0)
  })

  it('setCart overwrites previous cart', () => {
    useCartStore.getState().setCart('cart-1', 1, 'tok-1')
    useCartStore.getState().setCart('cart-2', 4, 'tok-2')
    const state = useCartStore.getState()
    expect(state.cartId).toBe('cart-2')
    expect(state.guestToken).toBe('tok-2')
    expect(state.itemCount).toBe(4)
  })
})

describe('auth store', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession()
  })

  it('initial session is null', () => {
    expect(useAuthStore.getState().session).toBeNull()
  })

  it('setSession stores the session', () => {
    const fakeSession = {
      token: 'tok-admin',
      user: { id: 'u1', email: 'admin@test.com', name: null, avatarUrl: null, provider: 'email' as const, emailVerified: null, createdAt: 0, updatedAt: 0 },
    }
    useAuthStore.getState().setSession(fakeSession)
    expect(useAuthStore.getState().session).toEqual(fakeSession)
  })

  it('token() returns session token when set', () => {
    const fakeSession = {
      token: 'tok-admin',
      user: { id: 'u1', email: 'admin@test.com', name: null, avatarUrl: null, provider: 'email' as const, emailVerified: null, createdAt: 0, updatedAt: 0 },
    }
    useAuthStore.getState().setSession(fakeSession)
    expect(useAuthStore.getState().token()).toBe('tok-admin')
  })

  it('token() returns null when no session', () => {
    expect(useAuthStore.getState().token()).toBeNull()
  })

  it('clearSession resets session to null', () => {
    const fakeSession = {
      token: 'tok-admin',
      user: { id: 'u1', email: 'admin@test.com', name: null, avatarUrl: null, provider: 'email' as const, emailVerified: null, createdAt: 0, updatedAt: 0 },
    }
    useAuthStore.getState().setSession(fakeSession)
    useAuthStore.getState().clearSession()
    expect(useAuthStore.getState().session).toBeNull()
  })
})

describe('customer auth store', () => {
  beforeEach(() => {
    useCustomerAuthStore.getState().clearSession()
  })

  it('initial session is null', () => {
    expect(useCustomerAuthStore.getState().session).toBeNull()
  })

  it('setSession and clearSession work correctly', () => {
    const fakeSession = {
      token: 'tok-customer',
      customer: {
        id: 'c1',
        email: 'customer@test.com',
        name: null,
        avatarUrl: null,
        provider: 'email' as const,
        phone: null,
        idDocument: null,
        emailVerified: null,
        createdAt: 0,
        updatedAt: 0,
      },
    }
    useCustomerAuthStore.getState().setSession(fakeSession)
    expect(useCustomerAuthStore.getState().token()).toBe('tok-customer')
    useCustomerAuthStore.getState().clearSession()
    expect(useCustomerAuthStore.getState().session).toBeNull()
  })
})
