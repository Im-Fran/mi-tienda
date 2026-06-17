import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  listStores,
  getStore,
  createStore,
  updateStore,
  deleteStore,
  getStoreSettings,
  updateStoreSettings,
  uploadStoreLogo,
} from "@/api/endpoints/stores"

export function useStores() {
  return useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const data = await listStores()
      return data.stores
    },
    staleTime: 30_000,
  })
}

export function useStore(storeId: string) {
  return useQuery({
    queryKey: ["stores", storeId],
    queryFn: async () => {
      const data = await getStore(storeId)
      return data.store
    },
    enabled: !!storeId,
    staleTime: 60_000,
  })
}

export function useCreateStore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; slug?: string }) => createStore(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stores"] }),
  })
}

export function useUpdateStore(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name?: string; slug?: string; isActive?: boolean }) =>
      updateStore(storeId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stores"] })
      qc.invalidateQueries({ queryKey: ["stores", storeId] })
    },
  })
}

export function useDeleteStore(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => deleteStore(storeId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stores"] }),
  })
}

export function useUploadStoreLogo(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => uploadStoreLogo(storeId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stores"] })
      qc.invalidateQueries({ queryKey: ["stores", storeId] })
    },
  })
}

export function useStoreSettings(storeId: string) {
  return useQuery({
    queryKey: ["stores", storeId, "settings"],
    queryFn: async () => {
      const data = await getStoreSettings(storeId)
      return data.settings
    },
    enabled: !!storeId,
    staleTime: 60_000,
  })
}

export function useUpdateStoreSettings(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof updateStoreSettings>[1]) =>
      updateStoreSettings(storeId, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["stores", storeId, "settings"] }),
  })
}
