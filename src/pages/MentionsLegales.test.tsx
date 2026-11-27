import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import MentionsLegales, { CNIL_URL, CONTACT_EMAIL, LAST_UPDATED } from './MentionsLegales'

function LocationProbe() {
  return <p data-testid="location">{useLocation().pathname}</p>
}

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/mentions-legales']}>
      <Routes>
        <Route path="/mentions-legales" element={<MentionsLegales />} />
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Page « Mentions légales et confidentialité »', () => {
  it('a son titre de page et d\'onglet', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1, name: 'Mentions légales et confidentialité' })).toBeInTheDocument()
    expect(document.title).toBe('Mentions légales et confidentialité · Futur Citoyen')
  })

  it('présente l\'éditeur et l\'hébergeur', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 2, name: 'Éditeur du site' })).toBeInTheDocument()
    expect(screen.getByText('CHITHDA, EURL au capital de 1 000 €')).toBeInTheDocument()
    expect(screen.getByText('RCS Meaux 994 815 553 · SIRET 994 815 553 00015')).toBeInTheDocument()
    expect(screen.getByText('Directeur de la publication : V. Boulom')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Hébergement' })).toBeInTheDocument()
    expect(screen.getByText('Netlify, Inc., 101 2nd Street, San Francisco, CA 94105, États-Unis')).toBeInTheDocument()
  })

  it('détaille les données dans des sections de niveau 3', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 2, name: 'Vos données' })).toBeInTheDocument()
    for (const name of [
      'Ce qui reste sur votre appareil',
      'Statistiques de visite',
      'Cookies',
      "Journaux de l'hébergeur",
      'Vos droits',
    ]) {
      expect(screen.getByRole('heading', { level: 3, name })).toBeInTheDocument()
    }
    expect(screen.getByText('Le site ne dépose aucun cookie. Il n\'y a donc rien à accepter.')).toBeInTheDocument()
    expect(screen.getByText(`Dernière mise à jour : ${LAST_UPDATED}`)).toBeInTheDocument()
  })

  it('cite la dernière position en révision parmi les données gardées', () => {
    renderPage()
    expect(screen.getByText(/votre dernière position en révision/)).toBeInTheDocument()
  })

  it('précise que les données restent sur cet appareil et ce navigateur', () => {
    renderPage()
    expect(
      screen.getByText(
        'Ils restent donc sur cet appareil, dans ce navigateur : vous les retrouvez à chaque visite, mais pas sur un autre téléphone ou un autre navigateur, ni en navigation privée.',
      ),
    ).toBeInTheDocument()
  })

  it('le titre « Vos données » porte l\'ancre #vos-donnees', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 2, name: 'Vos données' })).toHaveAttribute('id', 'vos-donnees')
  })

  it('donne la base légale des statistiques et des journaux de l\'hébergeur', () => {
    renderPage()
    expect(
      screen.getByText('Base légale : notre intérêt légitime à connaître la fréquentation du site.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Base légale : notre intérêt légitime à faire fonctionner et protéger le site.'),
    ).toBeInTheDocument()
    expect(screen.getByText(/ce transfert est encadré par le Data Privacy Framework UE–États-Unis/)).toBeInTheDocument()
    expect(screen.getByText(/elle n'est jamais enregistrée/)).toBeInTheDocument()
  })

  it('donne le téléphone et l\'adresse de contact en liens', () => {
    renderPage()
    expect(screen.getByRole('link', { name: '01 64 61 11 83' })).toHaveAttribute('href', 'tel:+33164611183')
    const mails = screen.getAllByRole('link', { name: CONTACT_EMAIL })
    expect(mails).toHaveLength(2)
    for (const mail of mails) expect(mail).toHaveAttribute('href', 'mailto:contact@futurcitoyen.fr')
  })

  it('renvoie vers la CNIL dans un nouvel onglet', () => {
    renderPage()
    const link = screen.getByRole('link', { name: /cnil\.fr/ })
    expect(link).toHaveAttribute('href', CNIL_URL)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('« Retour » ramène à l\'accueil', () => {
    renderPage()
    const back = screen.getByRole('link', { name: 'Retour' })
    expect(back).toHaveAttribute('href', '/')
    fireEvent.click(back)
    expect(screen.getByTestId('location')).toHaveTextContent('/')
  })
})
