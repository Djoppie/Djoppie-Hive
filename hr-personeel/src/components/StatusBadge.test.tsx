import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusBadge from './StatusBadge'
import type { ValidatieStatus } from '../types'

describe('StatusBadge', () => {
  const statusTests: Array<{ status: ValidatieStatus; expectedLabel: string; expectedClass: string }> = [
    { status: 'nieuw', expectedLabel: 'Nieuw', expectedClass: 'badge-nieuw' },
    { status: 'in_review', expectedLabel: 'In Review', expectedClass: 'badge-review' },
    { status: 'goedgekeurd', expectedLabel: 'Goedgekeurd', expectedClass: 'badge-goedgekeurd' },
    { status: 'afgekeurd', expectedLabel: 'Afgekeurd', expectedClass: 'badge-afgekeurd' },
    { status: 'aangepast', expectedLabel: 'Aangepast', expectedClass: 'badge-aangepast' },
  ]

  statusTests.forEach(({ status, expectedLabel, expectedClass }) => {
    it(`renders ${status} status correctly`, () => {
      render(<StatusBadge status={status} />)

      const badge = screen.getByText(expectedLabel)
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('badge-status')
      expect(badge).toHaveClass(expectedClass)
    })
  })

  it('applies correct base class to all badges', () => {
    render(<StatusBadge status="nieuw" />)

    const badge = screen.getByText('Nieuw')
    expect(badge.className).toContain('badge-status')
  })
})
