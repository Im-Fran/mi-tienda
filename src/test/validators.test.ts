/**
 * Unit tests for lib/validators.ts Zod schemas.
 */
import { describe, expect, it } from 'vitest'
import {
  emailSchema,
  addressSchema,
  guestCheckoutSchema,
  storeSchema,
  productSchema,
  variantSchema,
  couponSchema,
  paymentMethodSchema,
  shippingMethodSchema,
  checkoutContactSchema,
} from '@/lib/validators'

describe('emailSchema', () => {
  it('accepts valid email', () => {
    expect(emailSchema.safeParse('user@example.com').success).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(emailSchema.safeParse('not-an-email').success).toBe(false)
    expect(emailSchema.safeParse('').success).toBe(false)
  })
})

describe('addressSchema', () => {
  const valid = {
    addressLine1: '123 Main St',
    city: 'Anytown',
    countryCode: 'US',
  }

  it('accepts minimal valid address', () => {
    expect(addressSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects missing addressLine1', () => {
    expect(addressSchema.safeParse({ ...valid, addressLine1: '' }).success).toBe(false)
  })

  it('rejects missing city', () => {
    expect(addressSchema.safeParse({ ...valid, city: '' }).success).toBe(false)
  })

  it('rejects countryCode not exactly 2 chars', () => {
    expect(addressSchema.safeParse({ ...valid, countryCode: 'USA' }).success).toBe(false)
    expect(addressSchema.safeParse({ ...valid, countryCode: 'U' }).success).toBe(false)
  })

  it('accepts optional fields', () => {
    const full = {
      ...valid,
      label: 'Home',
      addressLine2: 'Apt 4',
      state: 'CA',
      postalCode: '90210',
    }
    expect(addressSchema.safeParse(full).success).toBe(true)
  })
})

describe('guestCheckoutSchema', () => {
  it('accepts valid guest data', () => {
    const result = guestCheckoutSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    expect(
      guestCheckoutSchema.safeParse({ name: '', email: 'john@example.com' }).success
    ).toBe(false)
  })

  it('rejects invalid email', () => {
    expect(
      guestCheckoutSchema.safeParse({ name: 'John', email: 'bad' }).success
    ).toBe(false)
  })
})

describe('storeSchema', () => {
  it('accepts valid store name', () => {
    expect(storeSchema.safeParse({ name: 'My Shop' }).success).toBe(true)
  })

  it('rejects empty name', () => {
    expect(storeSchema.safeParse({ name: '' }).success).toBe(false)
  })

  it('accepts valid slug', () => {
    expect(storeSchema.safeParse({ name: 'My Shop', slug: 'my-shop' }).success).toBe(true)
  })

  it('rejects slug with uppercase', () => {
    expect(storeSchema.safeParse({ name: 'My Shop', slug: 'My-Shop' }).success).toBe(false)
  })

  it('rejects slug with spaces', () => {
    expect(storeSchema.safeParse({ name: 'My Shop', slug: 'my shop' }).success).toBe(false)
  })
})

describe('productSchema', () => {
  it('accepts minimal product', () => {
    const result = productSchema.safeParse({ name: 'T-Shirt' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.type).toBe('physical')
      expect(result.data.isActive).toBe(true)
    }
  })

  it('rejects empty name', () => {
    expect(productSchema.safeParse({ name: '' }).success).toBe(false)
  })

  it('accepts digital type', () => {
    expect(productSchema.safeParse({ name: 'eBook', type: 'digital' }).success).toBe(true)
  })

  it('rejects invalid type', () => {
    expect(productSchema.safeParse({ name: 'X', type: 'other' }).success).toBe(false)
  })
})

describe('variantSchema', () => {
  it('accepts valid variant', () => {
    const result = variantSchema.safeParse({ name: 'Small', price: 1500 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.stock).toBe(0)
      expect(result.data.options).toEqual([])
    }
  })

  it('rejects empty name', () => {
    expect(variantSchema.safeParse({ name: '', price: 1000 }).success).toBe(false)
  })

  it('rejects negative price', () => {
    expect(variantSchema.safeParse({ name: 'S', price: -1 }).success).toBe(false)
  })

  it('accepts options array', () => {
    const result = variantSchema.safeParse({
      name: 'XL',
      price: 2000,
      options: [{ optionName: 'size', optionValue: 'XL' }],
    })
    expect(result.success).toBe(true)
  })
})

describe('couponSchema', () => {
  const valid = { code: 'SAVE10', type: 'percentage' as const, value: 10 }

  it('accepts valid coupon', () => {
    const result = couponSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.appliesTo).toBe('all')
      expect(result.data.isActive).toBe(true)
    }
  })

  it('rejects empty code', () => {
    expect(couponSchema.safeParse({ ...valid, code: '' }).success).toBe(false)
  })

  it('rejects negative value', () => {
    expect(couponSchema.safeParse({ ...valid, value: -5 }).success).toBe(false)
  })

  it('rejects invalid type', () => {
    expect(couponSchema.safeParse({ ...valid, type: 'invalid' }).success).toBe(false)
  })
})

describe('paymentMethodSchema', () => {
  it('accepts in_person type', () => {
    expect(paymentMethodSchema.safeParse({ type: 'in_person' }).success).toBe(true)
  })

  it('accepts bank_transfer type', () => {
    expect(paymentMethodSchema.safeParse({ type: 'bank_transfer' }).success).toBe(true)
  })

  it('rejects unknown type', () => {
    expect(paymentMethodSchema.safeParse({ type: 'crypto' }).success).toBe(false)
  })
})

describe('shippingMethodSchema', () => {
  it('accepts valid shipping method', () => {
    const result = shippingMethodSchema.safeParse({
      type: 'store_pickup',
      name: 'Pick up at store',
      cost: 0,
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing name', () => {
    expect(
      shippingMethodSchema.safeParse({ type: 'store_pickup', name: '', cost: 0 }).success
    ).toBe(false)
  })

  it('rejects negative cost', () => {
    expect(
      shippingMethodSchema.safeParse({ type: 'generic_delivery', name: 'Ship', cost: -1 }).success
    ).toBe(false)
  })
})

describe('checkoutContactSchema', () => {
  it('accepts minimal contact', () => {
    const result = checkoutContactSchema.safeParse({
      name: 'Jane Doe',
      email: 'jane@example.com',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.documentType).toBe('receipt')
    }
  })

  it('accepts invoice documentType', () => {
    const result = checkoutContactSchema.safeParse({
      name: 'Corp',
      email: 'corp@example.com',
      documentType: 'invoice',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(
      checkoutContactSchema.safeParse({ name: 'Jane', email: 'bad' }).success
    ).toBe(false)
  })

  it('rejects empty name', () => {
    expect(
      checkoutContactSchema.safeParse({ name: '', email: 'jane@example.com' }).success
    ).toBe(false)
  })
})
