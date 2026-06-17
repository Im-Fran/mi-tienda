import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartState {
  cartId: string | null
  guestToken: string | null
  itemCount: number
  setCart: (cartId: string, itemCount: number, guestToken?: string) => void
  clearCart: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cartId: null,
      guestToken: null,
      itemCount: 0,
      setCart: (cartId, itemCount, guestToken) =>
        set({ cartId, itemCount, guestToken: guestToken ?? null }),
      clearCart: () => set({ cartId: null, guestToken: null, itemCount: 0 }),
    }),
    { name: 'mitenda-cart' }
  )
)
