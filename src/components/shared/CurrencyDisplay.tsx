import { formatCurrency } from "@/lib/utils"
import type { StoreSettings } from "@/api/types"

interface CurrencyDisplayProps {
  amount: number
  storeSettings: Pick<StoreSettings, "currencySymbol" | "decimalPlaces" | "decimalSeparator">
  className?: string
}

export function CurrencyDisplay({ amount, storeSettings, className }: CurrencyDisplayProps) {
  const formatted = formatCurrency(
    amount,
    storeSettings.currencySymbol ?? "$",
    storeSettings.decimalPlaces ?? 2,
    storeSettings.decimalSeparator ?? "."
  )
  return <span className={className}>{formatted}</span>
}
