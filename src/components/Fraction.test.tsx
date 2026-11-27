import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Fraction } from './Fraction'

describe('Fraction', () => {
  it('montre « 39/40 » et lit « 39 sur 40 »', () => {
    render(
      <p>
        <Fraction value={39} total={40} />
      </p>,
    )
    expect(screen.getByText('39/40')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('39 sur 40')).toHaveClass('sr-only')
  })
})
