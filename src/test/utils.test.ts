/**
 * Unit tests for lib/utils.ts helper functions.
 */
import { describe, expect, it } from 'vitest'
import { formatCurrency, formatDate, formatDateTime, truncate, slugify, cn } from '@/lib/utils'

describe('formatCurrency', () => {
  it('formats minor-unit amount with default 2 decimal places', () => {
    expect(formatCurrency(1999, '$')).toBe('$19.99')
  })

  it('formats zero correctly', () => {
    expect(formatCurrency(0, '$')).toBe('$0.00')
  })

  it('uses comma as decimal separator when specified', () => {
    expect(formatCurrency(1999, '€', 2, ',')).toBe('€19,99')
  })

  it('respects decimalPlaces=0', () => {
    expect(formatCurrency(2000, '$', 0)).toBe('$20')
  })

  it('respects decimalPlaces=3', () => {
    expect(formatCurrency(1990, '$', 3)).toBe('$19.900')
  })

  it('handles large amounts', () => {
    expect(formatCurrency(100000, '$')).toBe('$1000.00')
  })

  it('uses custom currency symbol', () => {
    expect(formatCurrency(500, 'S/.', 2)).toBe('S/.5.00')
  })
})

describe('truncate', () => {
  it('returns string unchanged when within maxLength', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('truncates long string and appends ellipsis', () => {
    // truncate slices to (maxLength-1) then appends '...'
    // truncate('hello world', 7) → 'hello ' + '...' = 'hello ...'
    const result = truncate('hello world', 7)
    expect(result.endsWith('...')).toBe(true)
    expect(result.startsWith('hello')).toBe(true)
  })

  it('handles exact maxLength without truncation', () => {
    expect(truncate('hello', 5)).toBe('hello')
  })

  it('handles empty string', () => {
    expect(truncate('', 5)).toBe('')
  })

  it('truncated result ends with ellipsis when over maxLength', () => {
    const result = truncate('abcdefghij', 5)
    expect(result.endsWith('...')).toBe(true)
    expect(result.startsWith('abcd')).toBe(true)
  })
})

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('collapses multiple spaces/hyphens', () => {
    expect(slugify('a  b--c')).toBe('a-b-c')
  })

  it('strips leading/trailing hyphens', () => {
    expect(slugify('  hello  ')).toBe('hello')
  })

  it('handles already-slugified string', () => {
    expect(slugify('my-product')).toBe('my-product')
  })

  it('produces non-empty string for simple names', () => {
    expect(slugify('Shoes').length).toBeGreaterThan(0)
  })
})

describe('formatDate', () => {
  it('formats a unix timestamp to a readable date string', () => {
    // Use a fixed timestamp and just verify the year appears
    const unix = 1700000000 // Nov 2023
    const result = formatDate(unix)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
    expect(result).toContain('2023')
  })

  it('returns a non-empty string for timestamp 0', () => {
    const result = formatDate(0)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns a non-empty string for recent timestamps', () => {
    const unix = Math.floor(Date.now() / 1000)
    expect(formatDate(unix).length).toBeGreaterThan(0)
  })
})

describe('formatDateTime', () => {
  it('returns a non-empty string for any valid timestamp', () => {
    const unix = 1700000000
    const result = formatDateTime(unix)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
    expect(result).toContain('2023')
  })
})

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })

  it('deduplicates tailwind classes (last wins)', () => {
    const result = cn('p-4', 'p-8')
    expect(result).toBe('p-8')
  })

  it('handles empty input', () => {
    expect(cn()).toBe('')
  })
})
