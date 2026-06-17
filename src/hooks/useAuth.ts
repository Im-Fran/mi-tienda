import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getMe, logout, sendMagicLink, verifyMagicLink } from "@/api/endpoints/auth"
import { useAuthStore } from "@/stores/auth.store"

export function useCurrentUser() {
  const token = useAuthStore((s) => s.session?.token)
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const data = await getMe()
      return data.user
    },
    enabled: !!token,
    staleTime: 60_000,
  })
}

export function useSendMagicLink() {
  return useMutation({
    mutationFn: (email: string) => sendMagicLink(email),
  })
}

export function useVerifyMagicLink() {
  const setSession = useAuthStore((s) => s.setSession)
  return useMutation({
    mutationFn: ({ token, email }: { token: string; email: string }) =>
      verifyMagicLink(token, email),
    onSuccess: (data) => {
      setSession({ token: data.token, user: data.user })
    },
  })
}

export function useLogout() {
  const clearSession = useAuthStore((s) => s.clearSession)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      clearSession()
      queryClient.clear()
    },
    onError: () => {
      clearSession()
      queryClient.clear()
    },
  })
}
