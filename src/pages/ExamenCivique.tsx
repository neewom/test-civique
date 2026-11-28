import { Fragment, useState, type ReactNode } from 'react'
import { ArrowRight, ArrowUpRight, Check, ChevronDown, CircleDot, Info, ListChecks, Target, Timer } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageFrame } from '@/components/PageFrame'
import { BackLink } from '@/components/BackLink'
import { OrganicBackground } from '@/components/OrganicBackground'
import { PillLink } from '@/components/PillButton'
import { loadProgressForTitle } from '@/lib/exam-types'
import { DEFAULT_TITLE, loadTargetTitle } from '@/lib/target-title'
import { useRouteTitle } from '@/lib/use-document-title'
import { cn } from '@/lib/utils'
import {
  AFTER,
  CTA_BLANC,
  CTA_CENTRES,
  CTA_NOW,
  FAQ,
  FAQ_TITLE,
  HOW,
  INDEPENDENT_NOTE,
  INTRO_LEAD,
  INTRO_MORE,
  MARKS,
  PAGE_TITLE,
  PREPARE,
  SOURCES,
  WHAT,
  WHERE,
  WHO,
} from '@/lib/examen-civique'

const h2 = 'text-[1.375rem] leading-tight font-bold tracking-[-0.02em] text-balance md:text-[1.625rem]'
const body = 'text-[0.9375rem] leading-relaxed md:text-base'
const MARK_ICONS = { questions: ListChecks, time: Timer, choices: CircleDot, pass: Target }

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-bold underline underline-offset-4">
      {children}
      <ArrowUpRight aria-hidden="true" className="ml-0.5 inline-block size-[1em] align-[-0.125em]" />
      <span className="sr-only"> (nouvel onglet)</span>
    </a>
  )
}

/** Renders the light markup of `examen-civique.ts`: **bold** and [label](address) */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g)
  return (
    <>
      {parts.map((part, i) => {
        const bold = /^\*\*([^*]+)\*\*$/.exec(part)
        if (bold) return <b key={i}>{bold[1]}</b>
        const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part)
        if (link) {
          return link[2].startsWith('/') ? (
            <Link key={i} to={link[2]} className="font-bold underline underline-offset-4">
              {link[1]}
            </Link>
          ) : (
            <Ext key={i} href={link[2]}>
              {link[1]}
            </Ext>
          )
        }
        return <Fragment key={i}>{part}</Fragment>
      })}
    </>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-7 flex flex-col gap-3 md:mt-9">
      <h2 id={id} className={h2}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function Note({ children }: { children: ReactNode }) {
  return (
    <p className={cn('flex items-start gap-3 px-1', body)}>
      <Info aria-hidden="true" className="mt-1 size-5 shrink-0" strokeWidth={2.2} />
      <span>{children}</span>
    </p>
  )
}

function Checks({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => (
        <li key={item} className={cn('flex items-start gap-3', body)}>
          <Check aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-success dark:text-primary" strokeWidth={2.8} />
          <span>
            <Rich text={item} />
          </span>
        </li>
      ))}
    </ul>
  )
}

/** « L'examen civique : ce qu'il faut savoir », reference page opened from the home page and the pre-exam page. Texts in `src/lib/examen-civique.ts`. */
export default function ExamenCivique() {
  useRouteTitle('/examen-civique')
  // Same as step 2 of the home page: resume the exam in progress of the chosen title, else the page before the exam
  const [hasExamInProgress] = useState(() => loadProgressForTitle(loadTargetTitle() ?? DEFAULT_TITLE) !== null)
  const practiceTo = hasExamInProgress ? '/examen' : '/examen-blanc'

  return (
    <PageFrame className="relative overflow-hidden" background={<OrganicBackground shape="info" />}>
      <div className="relative mx-auto flex w-full max-w-[30rem] flex-col gap-3 px-[22px] pt-0 pb-10 md:max-w-[40rem] md:px-8 md:pb-14">
        <BackLink />
        <h1 className="mt-4 text-[2.375rem] leading-[0.98] font-bold tracking-[-0.04em] text-balance md:text-[3.25rem]">{PAGE_TITLE}</h1>
        <p className="mt-[3.25rem] text-[1.0625rem] leading-snug font-bold md:mt-10 md:text-[1.1875rem]">{INTRO_LEAD}</p>
        <p className={body}>{INTRO_MORE}</p>
        <p className="text-[0.8125rem] font-bold text-muted-foreground">{INDEPENDENT_NOTE}</p>

        <ul className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4" aria-label="L'examen en bref">
          {MARKS.map((m) => {
            const Icon = MARK_ICONS[m.icon]
            return (
              <li
                key={m.label}
                className={cn(
                  'flex min-h-[5.75rem] flex-col justify-between gap-1.5 rounded-2xl p-3',
                  'highlight' in m ? 'bg-success text-success-foreground' : 'bg-card text-card-foreground',
                )}
              >
                <Icon aria-hidden="true" className="size-5" strokeWidth={2.2} />
                <span className="flex flex-col">
                  <span className="text-[1.5rem] leading-tight font-bold tracking-[-0.02em] tabular-nums">{m.value}</span>
                  <span className="text-[0.875rem] leading-snug">{m.label}</span>
                </span>
              </li>
            )
          })}
        </ul>
        <PillLink to={practiceTo} size="lg" className="mt-2 justify-center text-center">
          {CTA_NOW}
        </PillLink>

        <Section id="quoi" title={WHAT.title}>
          {WHAT.paragraphs.map((p) => (
            <p key={p} className={body}>
              {p}
            </p>
          ))}
        </Section>

        <Section id="qui" title={WHO.title}>
          <p className={body}>{WHO.lead}</p>
          <div className="rounded-2xl bg-card p-3.5 text-card-foreground md:p-4">
            <Checks items={WHO.cases} />
          </div>
          <p className={body}>{WHO.paragraph}</p>
          {WHO.notes.map((n) => (
            <Note key={n}>{n}</Note>
          ))}
          <p className={cn(body, 'mt-1 font-bold')}>{WHO.fichesLead}</p>
          <ul className="flex flex-col gap-2">
            {WHO.fiches.map((f) => (
              <li key={f.to}>
                <Link to={f.to} className="flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-card px-4 py-3 font-bold text-card-foreground">
                  {f.label}
                  <ArrowRight aria-hidden="true" className="size-5 shrink-0" strokeWidth={2.4} />
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="comment" title={HOW.title}>
          <ul className={cn('flex list-disc flex-col gap-1.5 pl-5', body)}>
            {HOW.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <p className={body}>{HOW.situations}</p>
          <section aria-labelledby="split" className="flex flex-col gap-2 rounded-2xl bg-card p-4 text-card-foreground">
            <h3 id="split" className="text-[1.0625rem] leading-snug font-bold">
              {HOW.splitTitle}
            </h3>
            <dl className="flex flex-col gap-2 text-[0.9375rem]">
              {HOW.split.map(([theme, count]) => (
                <div key={theme} className="flex flex-wrap justify-between gap-x-3">
                  <dt>{theme}</dt>
                  <dd className="ml-auto text-right font-bold">{count}</dd>
                </div>
              ))}
            </dl>
          </section>
          <p className={body}>{HOW.rules}</p>
        </Section>

        <Section id="apres" title={AFTER.title}>
          {AFTER.paragraphs.map((p) => (
            <p key={p} className={body}>
              {p}
            </p>
          ))}
        </Section>

        <Section id="preparer" title={PREPARE.title}>
          <p className={body}>
            <Rich text={PREPARE.lead} />
          </p>
          <ul className={cn('flex list-disc flex-col gap-1.5 pl-5', body)}>
            {PREPARE.published.map((p) => (
              <li key={p}>
                <Rich text={p} />
              </li>
            ))}
          </ul>
          <p className={body}>
            <Rich text={PREPARE.naturalisation} />
          </p>
          <div className="flex flex-col gap-2.5 rounded-2xl bg-card p-4 text-card-foreground">
            <p className={cn(body, 'font-bold')}>{PREPARE.appLead}</p>
            <Checks items={PREPARE.app} />
            <p className="text-[0.875rem] leading-snug text-muted-foreground">{PREPARE.caveat}</p>
          </div>
          <PillLink to={practiceTo} size="lg" className="justify-center text-center">
            {CTA_BLANC}
          </PillLink>
        </Section>

        <Section id="ou" title={WHERE.title}>
          <p className={body}>{WHERE.paragraph}</p>
          <PillLink to="/centres" tone="surface" className="justify-center text-center" end={<ArrowRight />}>
            {CTA_CENTRES}
          </PillLink>
        </Section>

        <Section id="faq" title={FAQ_TITLE}>
          <div className="flex flex-col gap-2">
            {FAQ.map(([q, a], i) => (
              <details key={q} open={i === 0} className="group rounded-2xl bg-card text-card-foreground">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[0.9375rem] leading-snug font-bold md:text-base">
                  {q}
                  <ChevronDown aria-hidden="true" className="size-5 shrink-0 transition-transform group-open:rotate-180" strokeWidth={2.4} />
                </summary>
                <p className={cn(body, 'px-4 pb-4')}>{a}</p>
              </details>
            ))}
          </div>
        </Section>

        <PillLink to={practiceTo} size="lg" className="mt-8 justify-center text-center">
          {CTA_NOW}
        </PillLink>
        <p className="mt-3 text-[0.875rem] leading-relaxed">
          <Rich text={SOURCES} />
        </p>
      </div>
    </PageFrame>
  )
}
