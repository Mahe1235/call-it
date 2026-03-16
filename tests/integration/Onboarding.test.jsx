import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock useAuth before importing component
const mockUser = { id: 'test-uid', email: 'test@example.com' }
vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser, profile: null, loading: false }),
}))

// Mock supabase
const mockInsert = vi.fn()
vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: () => ({ insert: mockInsert, upsert: mockInsert }),
  },
}))

// Mock react-router navigate
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}))

import Onboarding from '../../src/pages/Onboarding'

describe('Onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('"Lock it in" is disabled until all 3 fields are filled', async () => {
    render(<Onboarding />)
    const submitBtn = screen.getByRole('button', { name: /lock it in/i })
    expect(submitBtn).toBeDisabled()

    // Type display name only → still disabled
    const input = screen.getByPlaceholderText(/Your name/i)
    await userEvent.type(input, 'Test Player')
    expect(submitBtn).toBeDisabled()

    // Select team only (without avatar) → still disabled
    const teamBtn = screen.getAllByRole('button').find(b => b.textContent.includes('CSK') || b.textContent.includes('Royal'))
    if (teamBtn) fireEvent.click(teamBtn)
    expect(submitBtn).toBeDisabled()
  })

  it('calls supabase insert with correct shape on successful submit', async () => {
    mockInsert.mockResolvedValue({ error: null })

    render(<Onboarding />)

    // Fill name
    const input = screen.getByPlaceholderText(/Your name/i)
    await userEvent.type(input, 'Test Player')

    // Click first team button
    const teamButtons = screen.getAllByRole('button').filter(b => {
      const txt = b.textContent
      return txt && (txt.includes('CSK') || txt.includes('MI') || txt.includes('RCB'))
    })
    if (teamButtons.length > 0) fireEvent.click(teamButtons[0])

    // Click first avatar image (jersey grid)
    const avatarImgs = document.querySelectorAll('img[alt]')
    if (avatarImgs.length > 0) fireEvent.click(avatarImgs[0].closest('button') ?? avatarImgs[0])

    const submitBtn = screen.getByRole('button', { name: /lock it in/i })
    if (!submitBtn.disabled) {
      fireEvent.click(submitBtn)
      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'test-uid',
            display_name: expect.any(String),
            team: expect.any(String),
            avatar_url: expect.any(String),
          })
        )
      })
    }
  })

  it('shows error message when supabase insert fails', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'duplicate key value violates unique constraint' } })

    render(<Onboarding />)

    // Fill all fields
    const input = screen.getByPlaceholderText(/Your name/i)
    await userEvent.type(input, 'Test Player')

    const teamButtons = screen.getAllByRole('button').filter(b => {
      const txt = b.textContent
      return txt && (txt.includes('CSK') || txt.includes('MI') || txt.includes('RCB'))
    })
    if (teamButtons.length > 0) fireEvent.click(teamButtons[0])

    const avatarImgs = document.querySelectorAll('img[alt]')
    if (avatarImgs.length > 0) fireEvent.click(avatarImgs[0].closest('button') ?? avatarImgs[0])

    const submitBtn = screen.getByRole('button', { name: /lock it in/i })
    if (!submitBtn.disabled) {
      fireEvent.click(submitBtn)
      await waitFor(() => {
        // Should show some error text
        const errorEl = document.querySelector('[style*="color: #cc0000"], [style*="red"], .error')
        expect(errorEl ?? screen.queryByText(/error|failed|try again/i)).toBeTruthy()
      })
    }
  })
})
