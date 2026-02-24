import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import BronIndicator from './BronIndicator'

describe('BronIndicator', () => {
  describe('AzureAD source', () => {
    it('renders with Azure class', () => {
      const { container } = render(<BronIndicator bron="AzureAD" />)

      const indicator = container.querySelector('.bron-indicator')
      expect(indicator).toHaveClass('bron-azure')
    })

    it('shows Azure tooltip', () => {
      const { container } = render(<BronIndicator bron="AzureAD" />)

      const indicator = container.querySelector('.bron-indicator')
      expect(indicator).toHaveAttribute('title', 'Gesynchroniseerd vanuit Azure AD')
    })

    it('shows Azure label when showLabel is true', () => {
      render(<BronIndicator bron="AzureAD" showLabel />)

      expect(screen.getByText('Azure')).toBeInTheDocument()
    })
  })

  describe('Handmatig source', () => {
    it('renders with Handmatig class', () => {
      const { container } = render(<BronIndicator bron="Handmatig" />)

      const indicator = container.querySelector('.bron-indicator')
      expect(indicator).toHaveClass('bron-handmatig')
    })

    it('shows Handmatig tooltip', () => {
      const { container } = render(<BronIndicator bron="Handmatig" />)

      const indicator = container.querySelector('.bron-indicator')
      expect(indicator).toHaveAttribute('title', 'Handmatig toegevoegd')
    })

    it('shows Handmatig label when showLabel is true', () => {
      render(<BronIndicator bron="Handmatig" showLabel />)

      expect(screen.getByText('Handmatig')).toBeInTheDocument()
    })
  })

  describe('label visibility', () => {
    it('does not show label by default', () => {
      render(<BronIndicator bron="AzureAD" />)

      expect(screen.queryByText('Azure')).not.toBeInTheDocument()
    })

    it('shows label when showLabel is true', () => {
      render(<BronIndicator bron="AzureAD" showLabel={true} />)

      expect(screen.getByText('Azure')).toBeInTheDocument()
    })
  })
})
