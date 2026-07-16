/**
 * Tests for the shared ErrorState component.
 */
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorState } from '@/components/shared/ErrorState'
import { ApiError } from '@/api/client'

describe('ErrorState', () => {
  it('renders only the title when no error is passed (backwards compatible)', () => {
    render(<ErrorState message="Failed to load products" />)
    expect(screen.getByText('Failed to load products')).toBeInTheDocument()
  })

  it('renders title and derived detail when error is passed', () => {
    render(
      <ErrorState
        message="Failed to load products"
        error={new ApiError('error', null, 'Server error 500')}
      />
    )
    expect(screen.getByText('Failed to load products')).toBeInTheDocument()
    expect(screen.getByText('Server error 500')).toBeInTheDocument()
  })

  it('calls retry when the button is clicked', async () => {
    const retry = vi.fn()
    render(<ErrorState message="Failed to load products" retry={retry} />)
    await userEvent.click(screen.getByRole('button'))
    expect(retry).toHaveBeenCalledOnce()
  })
})
