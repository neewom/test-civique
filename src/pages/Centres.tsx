import { ExternalLink } from 'lucide-react'
import { PageFrame } from '@/components/PageFrame'
import { BackLink } from '@/components/BackLink'
import { OrganicBackground } from '@/components/OrganicBackground'
import { buttonVariants } from '@/components/ui/button'
import {
  CENTRES_FOOTER,
  CENTRES_INTRO,
  OFFICIAL_ORGANISMES_LABEL,
  OFFICIAL_ORGANISMES_URL,
  ORGANISMES,
} from '@/lib/centres'
import { useRouteTitle } from '@/lib/use-document-title'
import { cn } from '@/lib/utils'

/** « Trouver un centre d'examen » (maquettes Tc2 to Tc4): links to the two approved organisms, step 3 of the journey. */
export default function Centres() {
  useRouteTitle('/centres')

  return (
    <PageFrame className="relative overflow-hidden" background={<OrganicBackground shape="info" />}>
      <div className="relative mx-auto flex w-full max-w-[30rem] flex-col gap-3.5 px-[22px] pt-0 pb-8 md:max-w-[36rem] md:px-8 md:pb-10">
        <BackLink>Mon parcours</BackLink>
        <h1 className="mt-4 max-w-[19rem] text-[2.125rem] leading-none font-bold tracking-[-0.04em] text-balance md:max-w-none md:text-[3rem]">
          Trouver un centre d'examen
        </h1>
        <p className="mt-[3.75rem] text-base leading-snug md:text-[1.0625rem]">{CENTRES_INTRO}</p>

        <ul className="flex flex-col gap-3.5">
          {ORGANISMES.map((o) => (
            <li key={o.name}>
              <section aria-label={o.name} className="flex flex-col gap-3 rounded-[1.75rem] bg-card p-[1.125rem] text-card-foreground">
                <div className="flex flex-col gap-1">
                  <h2 className="text-[1.125rem] leading-tight font-bold">{o.name}</h2>
                  <p className="text-[0.9375rem] leading-snug md:text-base">{o.description}</p>
                </div>
                <div className="flex flex-col gap-2">
                  {o.links.map((l) => (
                    <a
                      key={l.url}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ variant: 'pill-ink', size: 'pill' }),
                        'justify-between no-underline',
                        !l.primary && 'bg-background text-foreground hover:bg-muted',
                      )}
                    >
                      <span className="min-w-0">
                        {l.label}
                        <span className="sr-only"> (nouvel onglet)</span>
                      </span>
                      <ExternalLink aria-hidden="true" className="size-5 shrink-0" strokeWidth={2.2} />
                    </a>
                  ))}
                </div>
              </section>
            </li>
          ))}
        </ul>

        <p className="text-[0.9375rem] leading-snug md:text-base">
          {CENTRES_FOOTER}{' '}
          <a
            href={OFFICIAL_ORGANISMES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block min-h-11 font-bold underline underline-offset-4"
          >
            {OFFICIAL_ORGANISMES_LABEL}
            <span className="sr-only"> (nouvel onglet)</span>
          </a>
        </p>
      </div>
    </PageFrame>
  )
}
