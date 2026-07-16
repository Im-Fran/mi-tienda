/**
 * Unit tests for lib/errors.ts (getErrorMessage).
 */
import { describe, expect, it } from 'vitest'
import { getErrorMessage } from '@/lib/errors'
import { ApiError } from '@/api/client'

describe('getErrorMessage', () => {
  it('returns the real backend message for ApiError', () => {
    const err = new ApiError('fail', null, 'El correo ya está registrado')
    expect(getErrorMessage(err, 'fallback')).toBe('El correo ya está registrado')
  })

  it('returns a connectivity message for TypeError (network failure)', () => {
    const err = new TypeError('Failed to fetch')
    expect(getErrorMessage(err, 'fallback')).toBe('Sin conexión a internet')
  })

  it('detects NetworkError message even when not a TypeError', () => {
    const err = new Error('NetworkError when attempting to fetch resource')
    expect(getErrorMessage(err, 'fallback')).toBe('Sin conexión a internet')
  })

  it('falls back to the provided message for unknown errors', () => {
    expect(getErrorMessage(new Error('boom'), 'fallback')).toBe('fallback')
    expect(getErrorMessage('not an error', 'fallback')).toBe('fallback')
    expect(getErrorMessage(undefined, 'fallback')).toBe('fallback')
  })
})
