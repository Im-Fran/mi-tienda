import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  listAdminCarts,
  getAdminCart,
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  applyCoupon,
  removeCoupon,
} from "@/api/endpoints/carts"
import { useCartStore } from "@/stores/cart.store"

export function useAdminCarts(
  storeId: string,
  params: { status?: "pending" | "completed"; page?: number; perPage?: number } = {}
) {
  return useQuery({
    queryKey: ["stores", storeId, "carts", params],
    queryFn: () => listAdminCarts(storeId, params),
    enabled: !!storeId,
    staleTime: 30_000,
  })
}

export function useAdminCart(storeId: string, id: string) {
  return useQuery({
    queryKey: ["stores", storeId, "carts", id],
    queryFn: async () => {
      const data = await getAdminCart(storeId, id)
      return data.cart
    },
    enabled: !!storeId && !!id,
    staleTime: 60_000,
  })
}

export function useCart(storeId: string) {
  const cartId = useCartStore((s) => s.cartId)
  return useQuery({
    queryKey: ["cart", storeId, cartId],
    queryFn: async () => {
      const data = await getCart(storeId, cartId!)
      return data.cart
    },
    enabled: !!storeId && !!cartId,
    staleTime: 10_000,
  })
}

export function useAddCartItem(storeId: string) {
  const qc = useQueryClient()
  const cartId = useCartStore((s) => s.cartId)
  const setCart = useCartStore((s) => s.setCart)
  const guestToken = useCartStore((s) => s.guestToken)
  return useMutation({
    mutationFn: async ({ variantId, quantity }: { variantId: string; quantity?: number }) => {
      const id = cartId!
      const data = await addCartItem(storeId, id, variantId, quantity ?? 1)
      const itemCount = data.cart.items.reduce((sum, i) => sum + i.quantity, 0)
      setCart(id, itemCount, guestToken ?? undefined)
      return data.cart
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart", storeId] }),
  })
}

export function useUpdateCartItem(storeId: string) {
  const qc = useQueryClient()
  const cartId = useCartStore((s) => s.cartId)
  const setCart = useCartStore((s) => s.setCart)
  const guestToken = useCartStore((s) => s.guestToken)
  return useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const data = await updateCartItem(storeId, cartId!, itemId, quantity)
      const itemCount = data.cart.items.reduce((sum, i) => sum + i.quantity, 0)
      setCart(cartId!, itemCount, guestToken ?? undefined)
      return data.cart
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart", storeId] }),
  })
}

export function useRemoveCartItem(storeId: string) {
  const qc = useQueryClient()
  const cartId = useCartStore((s) => s.cartId)
  const setCart = useCartStore((s) => s.setCart)
  const guestToken = useCartStore((s) => s.guestToken)
  return useMutation({
    mutationFn: async (itemId: string) => {
      const data = await removeCartItem(storeId, cartId!, itemId)
      const itemCount = data.cart.items.reduce((sum, i) => sum + i.quantity, 0)
      setCart(cartId!, itemCount, guestToken ?? undefined)
      return data.cart
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart", storeId] }),
  })
}

export function useApplyCoupon(storeId: string) {
  const qc = useQueryClient()
  const cartId = useCartStore((s) => s.cartId)
  return useMutation({
    mutationFn: (code: string) => applyCoupon(storeId, cartId!, code),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart", storeId] }),
  })
}

export function useRemoveCoupon(storeId: string) {
  const qc = useQueryClient()
  const cartId = useCartStore((s) => s.cartId)
  return useMutation({
    mutationFn: () => removeCoupon(storeId, cartId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart", storeId] }),
  })
}
