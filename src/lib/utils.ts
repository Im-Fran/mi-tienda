import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a minor-unit monetary amount for display.
 * e.g. formatCurrency(1999, "$", 2, ".") → "$19.99"
 */
export function formatCurrency(
  amount: number,
  currencySymbol: string,
  decimalPlaces = 2,
  decimalSeparator: "." | "," = "."
): string {
  const major = amount / 100
  const fixed = major.toFixed(decimalPlaces)
  const formatted =
    decimalSeparator === ","
      ? fixed.replace(".", ",")
      : fixed
  return `${currencySymbol}${formatted}`
}

/** Format a Unix timestamp (seconds) as a locale date string. */
export function formatDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

/** Format a Unix timestamp (seconds) as a locale date+time string. */
export function formatDateTime(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/** Truncate a string to maxLength, appending "..." if needed. */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 1) + "..."
}

/** Generate a URL-safe slug from a string. */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
