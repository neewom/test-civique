import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import Centres from './Centres'
import { OFFICIAL_ORGANISMES_URL, ORGANISMES } from '@/lib/centres'

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

  it("signale l'existence de centres en outre-mer, sans nommer de territoire", () => {
    renderCentres()
    expect(
      screen.getByText(/Des centres existent aussi en outre-mer : cherchez votre ville sur les deux cartes\./),
    ).toBeInTheDocument()
  })

  it('présente France Éducation International avec sa carte et sa pré-inscription', () => {
    renderCentres()
    const card = screen.getByRole('region', { name: 'France Éducation International' })
    expect(within(card).getByText(/pré-inscription en ligne, obligatoire dans ce réseau/)).toBeInTheDocument()
    expectNewTab(
      within(card).getByRole('link', { name: /Voir la carte des centres/ }),
      'https://www.france-education-international.fr/centres-d-examen/carte?type-centre=examen_civique',
    )
    expectNewTab(within(card).getByRole('link', { name: /Se pré-inscrire/ }), 'https://test-civique.fr/inscription')
  })

  it('présente la CCIP avec son lien', () => {
    renderCentres()
    const card = screen.getByRole('region', { name: "Chambre de commerce et d'industrie de Paris (CCIP)" })
    expect(within(card).getByText(/centres dans toute la France/)).toBeInTheDocument()
    expectNewTab(
      within(card).getByRole('link', { name: /Trouver une session/ }),
      'https://francais.cci-paris-idf.fr/candidat?produit=21',
    )
  })

  it('met la CCIP en premier, et la pré-inscription FEI en lien secondaire', () => {
    expect(ORGANISMES.map((o) => o.name)).toEqual([
      "Chambre de commerce et d'industrie de Paris (CCIP)",
      'France Éducation International',
    ])
    const fei = ORGANISMES[1].links
    expect(fei.map((l) => [l.label, !!l.primary])).toEqual([
      ['Voir la carte des centres', true],
      ['Se pré-inscrire', false],
    ])
    renderCentres()
    const regions = screen.getAllByRole('region')
    expect(regions[0]).toHaveAccessibleName("Chambre de commerce et d'industrie de Paris (CCIP)")
  })

  it('annonce l\'ouverture dans un nouvel onglet et renvoie vers la liste officielle', () => {
    renderCentres()
    expect(screen.getByRole('link', { name: 'Voir la carte des centres (nouvel onglet)' })).toBeInTheDocument()
    expectNewTab(screen.getByRole('link', { name: /Liste officielle des organismes/ }), OFFICIAL_ORGANISMES_URL)
    expect(screen.getByText(/Futur Citoyen n'est lié à aucun d'eux/)).toBeInTheDocument()
  })
})
