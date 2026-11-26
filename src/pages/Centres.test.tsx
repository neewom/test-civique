import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import Centres from './Centres'
import { OFFICIAL_ORGANISMES_URL } from '@/lib/centres'

function renderCentres() {
  render(
    <MemoryRouter>
      <Centres />
    </MemoryRouter>,
  )
}

function expectNewTab(link: HTMLElement, href: string) {
  expect(link).toHaveAttribute('href', href)
  expect(link).toHaveAttribute('target', '_blank')
  expect(link).toHaveAttribute('rel', 'noopener noreferrer')
}

describe('Page « Trouver un centre d\'examen »', () => {
  it('a son titre de page et d\'onglet, et revient au parcours', () => {
    renderCentres()
    expect(screen.getByRole('heading', { level: 1, name: "Trouver un centre d'examen" })).toBeInTheDocument()
    expect(document.title).toBe("Trouver un centre d'examen · Futur Citoyen")
    expect(screen.getByRole('link', { name: 'Mon parcours' })).toHaveAttribute('href', '/')
  })

  it('présente France Éducation International avec sa carte et son inscription', () => {
    renderCentres()
    const card = screen.getByRole('region', { name: 'France Éducation International' })
    expect(within(card).getByText(/Plus de 230 centres en France/)).toBeInTheDocument()
    expectNewTab(
      within(card).getByRole('link', { name: /Voir la carte des centres/ }),
      'https://www.france-education-international.fr/centres-d-examen/carte?type-centre=examen_civique',
    )
    expectNewTab(within(card).getByRole('link', { name: /S'inscrire à l'examen/ }), 'https://test-civique.fr/inscription')
  })

  it('présente la CCI Paris Île-de-France avec son lien', () => {
    renderCentres()
    const card = screen.getByRole('region', { name: 'CCI Paris Île-de-France' })
    expectNewTab(
      within(card).getByRole('link', { name: /Trouver un centre et s'inscrire/ }),
      'https://francais.cci-paris-idf.fr/candidat?produit=21',
    )
  })

  it('annonce l\'ouverture dans un nouvel onglet et renvoie vers la liste officielle', () => {
    renderCentres()
    expect(screen.getByRole('link', { name: 'Voir la carte des centres (nouvel onglet)' })).toBeInTheDocument()
    expectNewTab(screen.getByRole('link', { name: /Liste officielle des organismes/ }), OFFICIAL_ORGANISMES_URL)
    expect(screen.getByText(/Futur Citoyen n'est lié à aucun d'eux/)).toBeInTheDocument()
  })
})
