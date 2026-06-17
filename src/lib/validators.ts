import { z } from "zod"

export const emailSchema = z.string().email("Invalid email address")

export const addressSchema = z.object({
  label: z.string().max(60).optional(),
  addressLine1: z.string().min(1, "Address is required").max(200),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(1, "City is required").max(120),
  state: z.string().max(120).optional(),
  countryCode: z.string().length(2, "Country code must be 2 characters"),
  postalCode: z.string().max(20).optional(),
})

export const guestCheckoutSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: emailSchema,
  phone: z.string().max(40).optional(),
  idDocument: z.string().max(40).optional(),
})

export const storeSchema = z.object({
  name: z.string().min(1, "Store name is required").max(120),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
})

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  shortDescription: z.string().max(300).optional(),
  fullDescription: z.string().optional(),
  type: z.enum(["physical", "digital"]).default("physical"),
  isActive: z.boolean().default(true),
  categoryIds: z.array(z.string()).default([]),
})

export const variantSchema = z.object({
  name: z.string().min(1, "Variant name is required").max(120),
  sku: z.string().max(80).optional(),
  price: z.number().min(0, "Price must be non-negative"),
  compareAtPrice: z.number().min(0).optional(),
  stock: z.number().int().min(0).default(0),
  weight: z.number().int().min(0).optional(),
  options: z
    .array(
      z.object({
        optionName: z.string().min(1).max(60),
        optionValue: z.string().min(1).max(120),
      })
    )
    .default([]),
})

export const couponSchema = z.object({
  code: z.string().min(1, "Code is required").max(40),
  type: z.enum(["percentage", "fixed"]),
  value: z.number().min(0, "Value must be non-negative"),
  appliesTo: z.enum(["all", "products", "categories"]).default("all"),
  occasion: z.string().optional(),
  minOrderAmount: z.number().min(0).optional(),
  maxUses: z.number().int().min(1).optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
  isActive: z.boolean().default(true),
  productIds: z.array(z.string()).default([]),
  categoryIds: z.array(z.string()).default([]),
})

export const paymentMethodSchema = z.object({
  type: z.enum(["in_person", "bank_transfer", "external"]),
  providerName: z.string().optional(),
  isActive: z.boolean().default(true),
  bankName: z.string().optional(),
  accountType: z.string().optional(),
  accountNumber: z.string().optional(),
  holderName: z.string().optional(),
  holderDocument: z.string().optional(),
  bankEmail: z.string().email().optional().or(z.literal("")),
  instructions: z.string().optional(),
})

export const shippingMethodSchema = z.object({
  type: z.enum(["store_pickup", "generic_delivery"]),
  name: z.string().min(1, "Name is required").max(120),
  cost: z.number().min(0, "Cost must be non-negative"),
  maxDistanceKm: z.number().int().min(0).optional(),
  estimatedDays: z.number().int().min(0).optional(),
  isActive: z.boolean().default(true),
})

export const storeSettingsSchema = z.object({
  requireCustomerIdDocument: z.boolean(),
  taxLabel: z.string().max(40),
  taxRate: z.number().min(0).max(100),
  decimalSeparator: z.enum([".", ","]),
  decimalPlaces: z.number().int().min(0).max(6),
  currencyCode: z.string().length(3),
  currencySymbol: z.string().min(1).max(8),
  countryMode: z.enum(["inclusive", "exclusive"]),
  countries: z.array(z.string().length(2)),
  bankTransferInfo: z
    .object({
      bankName: z.string(),
      accountType: z.string(),
      accountNumber: z.string(),
      holderName: z.string(),
      holderDocument: z.string(),
      email: z.string().email(),
      instructions: z.string(),
    })
    .optional(),
})

export const loginSchema = z.object({
  email: emailSchema,
})

export const checkoutContactSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: emailSchema,
  phone: z.string().max(40).optional(),
  idDocument: z.string().max(40).optional(),
  documentType: z.enum(["receipt", "invoice"]).default("receipt"),
})
