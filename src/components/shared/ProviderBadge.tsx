import { Badge } from "@/components/ui/badge"
import type { AuthProvider, CustomerProvider } from "@/api/types"

type Provider = AuthProvider | CustomerProvider

const providerConfig: Record<Provider, { label: string; className: string }> = {
  google:  { label: "Google",  className: "bg-red-100 text-red-800 border-red-200" },
  github:  { label: "GitHub",  className: "bg-gray-100 text-gray-800 border-gray-200" },
  email:   { label: "Email",   className: "bg-blue-100 text-blue-800 border-blue-200" },
  guest:   { label: "Guest",   className: "bg-orange-100 text-orange-800 border-orange-200" },
}

interface ProviderBadgeProps {
  provider: Provider
}

export function ProviderBadge({ provider }: ProviderBadgeProps) {
  const config = providerConfig[provider] ?? { label: provider, className: "" }
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
