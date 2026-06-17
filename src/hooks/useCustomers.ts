import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  listCustomers,
  getCustomer,
  getMyProfile,
  getMyAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  getMyOrders,
  getMyOrder,
} from "@/api/endpoints/customers"
import { useCustomerAuthStore } from "@/stores/auth.store"

export function useCustomers(storeId: string, page = 1, perPage = 20) {
  return useQuery({
    queryKey: ["stores", storeId, "customers", { page, perPage }],
    queryFn: () => listCustomers(storeId, page, perPage),
    enabled: !!storeId,
    staleTime: 30_000,
  })
}

export function useCustomer(storeId: string, id: string) {
  return useQuery({
    queryKey: ["stores", storeId, "customers", id],
    queryFn: async () => {
      const data = await getCustomer(storeId, id)
      return data.customer
    },
    enabled: !!storeId && !!id,
    staleTime: 60_000,
  })
}

export function useMyProfile() {
  const token = useCustomerAuthStore((s) => s.session?.token)
  return useQuery({
    queryKey: ["customer", "me"],
    queryFn: async () => {
      const data = await getMyProfile()
      return data.customer
    },
    enabled: !!token,
    staleTime: 60_000,
  })
}

export function useMyAddresses() {
  const token = useCustomerAuthStore((s) => s.session?.token)
  return useQuery({
    queryKey: ["customer", "me", "addresses"],
    queryFn: async () => {
      const data = await getMyAddresses()
      return data.addresses
    },
    enabled: !!token,
    staleTime: 30_000,
  })
}

export function useCreateAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof createAddress>[0]) => createAddress(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customer", "me", "addresses"] }),
  })
}

export function useUpdateAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateAddress>[1] }) =>
      updateAddress(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customer", "me", "addresses"] }),
  })
}

export function useDeleteAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteAddress(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customer", "me", "addresses"] }),
  })
}

export function useMyOrders(page = 1, perPage = 20) {
  const token = useCustomerAuthStore((s) => s.session?.token)
  return useQuery({
    queryKey: ["customer", "me", "orders", { page, perPage }],
    queryFn: () => getMyOrders(page, perPage),
    enabled: !!token,
    staleTime: 30_000,
  })
}

export function useMyOrder(id: string) {
  const token = useCustomerAuthStore((s) => s.session?.token)
  return useQuery({
    queryKey: ["customer", "me", "orders", id],
    queryFn: async () => {
      const data = await getMyOrder(id)
      return data.order
    },
    enabled: !!token && !!id,
    staleTime: 60_000,
  })
}
