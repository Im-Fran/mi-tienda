import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  deleteProductImage,
  setMainProductImage,
  addVariant,
  updateVariant,
  deleteVariant,
  type ListProductsParams,
} from "@/api/endpoints/products"

export function useProducts(storeId: string, params: ListProductsParams = {}) {
  return useQuery({
    queryKey: ["stores", storeId, "products", params],
    queryFn: () => listProducts(storeId, params),
    enabled: !!storeId,
    staleTime: 30_000,
  })
}

export function useProduct(storeId: string, id: string) {
  return useQuery({
    queryKey: ["stores", storeId, "products", id],
    queryFn: async () => {
      const data = await getProduct(storeId, id)
      return data.product
    },
    enabled: !!storeId && !!id,
    staleTime: 60_000,
  })
}

export function useCreateProduct(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof createProduct>[1]) =>
      createProduct(storeId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stores", storeId, "products"] }),
  })
}

export function useUpdateProduct(storeId: string, id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof updateProduct>[2]) =>
      updateProduct(storeId, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stores", storeId, "products"] })
      qc.invalidateQueries({ queryKey: ["stores", storeId, "products", id] })
    },
  })
}

export function useDeleteProduct(storeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteProduct(storeId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stores", storeId, "products"] }),
  })
}

export function useUploadProductImages(storeId: string, productId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (files: File[]) => uploadProductImages(storeId, productId, files),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["stores", storeId, "products", productId] }),
  })
}

export function useDeleteProductImage(storeId: string, productId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (imageId: string) => deleteProductImage(storeId, productId, imageId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["stores", storeId, "products", productId] }),
  })
}

export function useSetMainProductImage(storeId: string, productId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (imageId: string) => setMainProductImage(storeId, productId, imageId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["stores", storeId, "products", productId] }),
  })
}

export function useAddVariant(storeId: string, productId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof addVariant>[2]) =>
      addVariant(storeId, productId, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["stores", storeId, "products", productId] }),
  })
}

export function useUpdateVariant(storeId: string, productId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ variantId, data }: { variantId: string; data: Parameters<typeof updateVariant>[3] }) =>
      updateVariant(storeId, productId, variantId, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["stores", storeId, "products", productId] }),
  })
}

export function useDeleteVariant(storeId: string, productId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (variantId: string) => deleteVariant(storeId, productId, variantId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["stores", storeId, "products", productId] }),
  })
}
