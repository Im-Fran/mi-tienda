import { Badge } from "@/components/ui/badge"
import type { OrderStatus } from "@/api/types"
import { cn } from "@/lib/utils"

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  pending_payment: { label: "Pending Payment", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  paid:            { label: "Paid",            className: "bg-blue-100 text-blue-800 border-blue-200" },
  processing:      { label: "Processing",      className: "bg-purple-100 text-purple-800 border-purple-200" },
  shipped:         { label: "Shipped",         className: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  delivered:       { label: "Delivered",       className: "bg-green-100 text-green-800 border-green-200" },
  cancelled:       { label: "Cancelled",       className: "bg-red-100 text-red-800 border-red-200" },
  refunded:        { label: "Refunded",        className: "bg-gray-100 text-gray-800 border-gray-200" },
}

interface StatusBadgeProps {
  status: OrderStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, className: "" }
  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  )
}
