// All TypeScript types derived from the OpenAPI spec at /api/openapi.json

// ---------- Shared / Utility ----------

export interface Pagination {
  page: number
  perPage: number
  total: number
  totalPages: number
}

export interface JSendSuccess<T> {
  status: 'success'
  data: T
}

export interface JSendFail {
  status: 'fail'
  message: string
  data?: Record<string, string[]> | unknown
}

export interface JSendError {
  status: 'error'
  message: string
  data?: unknown
}

export type JSendResponse<T> = JSendSuccess<T> | JSendFail | JSendError

// ---------- Auth ----------

export interface AuthToken {
  token: string
}

// ---------- User (owner / admin) ----------

export type AuthProvider = 'google' | 'github' | 'email'
export type CustomerProvider = 'google' | 'github' | 'email' | 'guest'

export interface User {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  provider: AuthProvider
  emailVerified: number | null
  createdAt: number
  updatedAt: number
}

// ---------- Customer (buyer) ----------

export interface Customer {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  provider: CustomerProvider
  phone: string | null
  idDocument: string | null
  emailVerified: number | null
  createdAt: number
  updatedAt: number
}

export interface CustomerAddress {
  id: string
  customerId: string
  label: string | null
  addressLine1: string
  addressLine2: string | null
  city: string
  state: string | null
  countryCode: string
  postalCode: string | null
  isDefault: boolean
  createdAt: number
  updatedAt: number
}

// ---------- Store ----------

export interface Store {
  id: string
  userId: string
  name: string
  slug: string
  logoR2Key: string | null
  isActive: boolean
  createdAt: number
  updatedAt: number
}

export interface BankTransferInfo {
  bankName: string
  accountType: string
  accountNumber: string
  holderName: string
  holderDocument: string
  email: string
  instructions: string
}

export interface StoreSettings {
  id: string
  storeId: string
  requireCustomerIdDocument: boolean
  taxLabel: string
  taxRate: number
  decimalSeparator: '.' | ','
  decimalPlaces: number
  currencyCode: string
  currencySymbol: string
  countryMode: 'inclusive' | 'exclusive'
  bankTransferInfo: BankTransferInfo | null
  countries: string[]
  createdAt: number
  updatedAt: number
}

// ---------- Products ----------

export type ProductType = 'physical' | 'digital'

export interface VariantOption {
  id: string
  variantId: string
  optionName: string
  optionValue: string
}

export interface ProductVariant {
  id: string
  productId: string
  name: string
  sku: string | null
  price: number
  compareAtPrice: number | null
  stock: number
  weight: number | null
  digitalFileR2Key: string | null
  options: VariantOption[]
  createdAt: number
  updatedAt: number
}

export interface ProductImage {
  id: string
  productId: string
  r2Key: string
  sortOrder: number
  isMain: boolean
}

export interface Product {
  id: string
  storeId: string
  name: string
  shortDescription: string | null
  fullDescription: string | null
  type: ProductType
  mainImageR2Key: string | null
  isActive: boolean
  variants: ProductVariant[]
  images: ProductImage[]
  createdAt: number
  updatedAt: number
}

// ---------- Categories ----------

export interface Category {
  id: string
  storeId: string
  name: string
  slug: string
  description: string | null
  parentId: string | null
  sortOrder: number
  children: Category[]
  createdAt: number
  updatedAt: number
}

// ---------- Coupons ----------

export type CouponType = 'percentage' | 'fixed'
export type CouponAppliesTo = 'all' | 'products' | 'categories'

export interface Coupon {
  id: string
  storeId: string
  code: string
  type: CouponType
  value: number
  appliesTo: CouponAppliesTo
  occasion: string | null
  minOrderAmount: number | null
  maxUses: number | null
  usedCount: number
  startsAt: string | null
  expiresAt: string | null
  isActive: boolean
  productIds: string[]
  categoryIds: string[]
  createdAt: number
  updatedAt: number
}

// ---------- Cart ----------

export type CartStatus = 'pending' | 'completed'

export interface CartItem {
  id: string
  cartId: string
  variantId: string
  quantity: number
  unitPrice: number
}

export interface Cart {
  id: string
  storeId: string
  customerId: string | null
  guestToken: string | null
  status: CartStatus
  couponId: string | null
  items: CartItem[]
  createdAt: number
  updatedAt: number
}

// ---------- Orders ----------

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export type DocumentType = 'receipt' | 'invoice'

export interface ProductSnapshot {
  productId: string
  productName: string
  variantId: string
  variantName: string
  sku: string | null
  type: ProductType
}

export interface AddressSnapshot {
  label: string | null
  addressLine1: string
  addressLine2: string | null
  city: string
  state: string | null
  countryCode: string
  postalCode: string | null
}

export interface GuestSnapshot {
  name: string
  email: string
  phone: string | null
  idDocument: string | null
  documentType: DocumentType
}

export interface OrderItem {
  id: string
  orderId: string
  variantId: string | null
  productSnapshot: ProductSnapshot
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface Order {
  id: string
  storeId: string
  cartId: string | null
  customerId: string | null
  status: OrderStatus
  documentType: DocumentType
  subtotal: number
  discountAmount: number
  taxAmount: number
  shippingAmount: number
  total: number
  currencyCode: string
  paymentMethodId: string | null
  paymentReference: string | null
  notes: string | null
  items: OrderItem[]
  billingSnapshot: AddressSnapshot | null
  shippingSnapshot: AddressSnapshot | null
  guestSnapshot: GuestSnapshot | null
  createdAt: number
  updatedAt: number
}

// ---------- Payment Methods ----------

export type PaymentMethodType = 'in_person' | 'bank_transfer' | 'external'

export interface PaymentMethod {
  id: string
  storeId: string
  type: PaymentMethodType
  providerName: string | null
  config: Record<string, unknown> | null
  isActive: boolean
  createdAt: number
  updatedAt: number
}

// ---------- Shipping Methods ----------

export type ShippingMethodType = 'store_pickup' | 'generic_delivery'

export interface ShippingMethod {
  id: string
  storeId: string
  type: ShippingMethodType
  name: string
  cost: number
  maxDistanceKm: number | null
  estimatedDays: number | null
  isActive: boolean
  createdAt: number
  updatedAt: number
}

// ---------- System Admin ----------

export interface SystemRole {
  id: string
  name: string
  createdAt: number
}

export interface SystemPermission {
  id: string
  name: string
  description: string | null
  createdAt: number
}

// ---------- Stats ----------

export interface StatsSummary {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  currencyCode: string
}

export interface TopProduct {
  productId: string
  productName: string
  totalRevenue: number
  totalQuantity: number
}

export interface OrdersByStatus {
  status: OrderStatus
  count: number
}

export interface RevenueOverTimePoint {
  date: string
  revenue: number
}

// ---------- Checkout input types ----------

export interface AddressInput {
  label?: string
  addressLine1: string
  addressLine2?: string
  city: string
  state?: string
  countryCode: string
  postalCode?: string
}

export interface GuestCheckoutInput {
  name: string
  email: string
  phone?: string
  idDocument?: string
}

export interface CheckoutInput {
  guest?: GuestCheckoutInput
  documentType?: DocumentType
  paymentMethodId: string
  shippingMethodId?: string
  billingAddressId?: string
  shippingAddressId?: string
  billingAddress?: AddressInput
  shippingAddress?: AddressInput
  notes?: string
}
