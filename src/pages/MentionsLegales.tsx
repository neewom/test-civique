import type { ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { PageFrame } from '@/components/PageFrame'
import { BackLink } from '@/components/BackLink'
import { OrganicBackground } from '@/components/OrganicBackground'
import { useRouteTitle } from '@/lib/use-document-title'

// To keep up to date whenever the data collected by the site changes (ads, payment, new events)
export const LAST_UPDATED = '27 novembre 2026'
export const CONTACT_EMAIL = 'contact@futurcitoyen.fr'
export const CNIL_URL = 'https://www.cnil.fr'

const linkClass = 'rounded-sm font-bold break-words underline underline-offset-4'

/** White card of the page (DESIGN.md « card »), titled by an h2 or an h3. */
function InfoCard({
  title,
  level,
  className = '',
  children,
}: {
  title: string
  level: 2 | 3
  className?: string
  children: ReactNode
}) {
  const Heading = level === 2 ? 'h2' : 'h3'
  return (
    <section
      className={`flex flex-col gap-2 rounded-xl bg-card p-4 text-[0.9375rem] leading-[1.45] text-card-foreground md:text-base ${className}`}
    >
      <Heading className="text-[1.0625rem] leading-snug font-bold">{title}</Heading>
      {children}
    </section>
  )
}

function ContactLink() {
  return (
    <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
      {CONTACT_EMAIL}
    </a>
  )
}

/** « Mentions légales et confidentialité » (maquette Ml2), opened from the home page footer. */
export default function MentionsLegales() {
  useRouteTitle('/mentions-legales')

  return (
    <PageFrame className="relative overflow-hidden" background={<OrganicBackground shape="crest" />}>
      <div className="relative mx-auto flex w-full max-w-[30rem] flex-col gap-3.5 px-[22px] pt-0 pb-8 md:max-w-[36rem] md:px-8 md:pb-10">
        <BackLink />
        <h1 className="mt-4 max-w-[20rem] text-[2.125rem] leading-none font-bold tracking-[-0.04em] text-balance hyphens-auto md:max-w-none md:text-[3rem]">
          Mentions légales et confidentialité
        </h1>
        <p className="mt-[3.75rem] text-base leading-[1.45] md:text-[1.0625rem]">
          Futur Citoyen est un site indépendant d'entraînement à l'examen civique. Il n'est pas un site officiel de
          l'État.
        </p>

        <h2 id="vos-donnees" className="mt-[1.125rem] scroll-mt-6 text-2xl leading-[1.1] font-bold tracking-[-0.02em]">
          Vos données
        </h2>

        <InfoCard title="Ce qui reste sur votre appareil" level={3}>
          <p>Le site ne demande ni compte, ni nom, ni adresse e-mail.</p>
          <p>
            Vos examens, votre progression, vos réglages et votre dernière position en révision, le titre que vous préparez, le thème clair ou sombre et votre choix d'animations
            (activées ou désactivées) sont enregistrés seulement dans votre navigateur. Ils ne nous sont jamais envoyés.
          </p>
          <p>
            Ils restent donc sur cet appareil, dans ce navigateur : vous les retrouvez à chaque visite, mais pas sur un
            autre téléphone ou un autre navigateur, ni en navigation privée.
          </p>
          <p>
            Pour fonctionner sans connexion Internet, le site garde aussi dans le cache de votre navigateur ses
            propres fichiers et les questions du titre que vous préparez. Ce sont des données techniques du site, rien
            de personnel, qui ne nous sont pas envoyées.
          </p>
          <p>Pour les effacer, supprimez les données du site dans les réglages de votre navigateur.</p>
        </InfoCard>

        <InfoCard title="Statistiques de visite" level={3}>
          <p>
            Pour savoir combien de personnes utilisent le site, nous comptons les pages vues et deux actions : examen
            commencé, examen terminé (réussi ou pas encore). Le nom de ces actions indique le titre que vous préparez. Pour chaque page vue, la page consultée (les adresses
            d'examen sont regroupées, sans identifiant d'examen) et la largeur de votre écran sont transmises ; à la
            première page de la visite, le site d'où vous arrivez l'est aussi.
          </p>
          <p>
            Ce comptage passe par GoatCounter : sans cookie, sans identifiant, sans suivi d'une visite à l'autre.
            GoatCounter en déduit aussi votre navigateur, votre système et votre pays, sans les relier à vous.
            Votre adresse IP sert seulement, pendant 8 heures au plus, à ne pas compter deux fois la même visite ;
            elle n'est jamais enregistrée. Seuls des totaux sont conservés, hébergés dans l'Union européenne.
          </p>
          <p>Base légale : notre intérêt légitime à connaître la fréquentation du site.</p>
        </InfoCard>

        <InfoCard title="Cookies" level={3}>
          <p>Le site ne dépose aucun cookie. Il n'y a donc rien à accepter.</p>
        </InfoCard>

        <InfoCard title="Journaux de l'hébergeur" level={3}>
          <p>
            Comme tout hébergeur, Netlify enregistre des journaux techniques, dont l'adresse IP, pour faire
            fonctionner et protéger le site. Netlify est situé aux États-Unis : ce transfert est encadré par le Data
            Privacy Framework UE–États-Unis, auquel Netlify adhère.
          </p>
          <p>Base légale : notre intérêt légitime à faire fonctionner et protéger le site.</p>
        </InfoCard>

        <InfoCard title="Vos droits" level={3}>
          <p>
            Le responsable du traitement est CHITHDA. Vous pouvez demander l'accès, la rectification ou l'effacement
            des données vous concernant en écrivant à <ContactLink />.
          </p>
          <p>
            Vous pouvez aussi adresser une réclamation à la CNIL :{' '}
            <a href={CNIL_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
              cnil.fr
              <ArrowUpRight aria-hidden="true" className="ml-1 inline-block size-[1em] align-[-0.125em]" />
              <span className="sr-only">(nouvel onglet)</span>
            </a>
          </p>
        </InfoCard>

        <InfoCard title="Éditeur du site" level={2} className="mt-[1.125rem]">
          <div className="flex flex-col gap-1.5 break-words">
            <p>CHITHDA, EURL au capital de 1 000 €</p>
            <p>9 Grande Allée de la Faisanderie, 77185 Lognes</p>
            <p>RCS Meaux 994 815 553 · SIRET 994 815 553 00015</p>
            <p>TVA intracommunautaire : FR44994815553</p>
            <p>Directeur de la publication : V. Boulom</p>
            <p>
              Téléphone :{' '}
              <a href="tel:+33164611183" className={`${linkClass} whitespace-nowrap`}>
                01 64 61 11 83
              </a>
            </p>
            <p>
              Contact : <ContactLink />
            </p>
          </div>
        </InfoCard>

        <InfoCard title="Hébergement" level={2}>
          <p>Netlify, Inc., 101 2nd Street, San Francisco, CA 94105, États-Unis</p>
        </InfoCard>

        <p className="mt-1.5 text-sm text-muted-foreground">Dernière mise à jour : {LAST_UPDATED}</p>
      </div>
    </PageFrame>
  )
}
