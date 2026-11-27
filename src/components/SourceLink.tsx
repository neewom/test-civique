import { ExternalLink } from 'lucide-react'
import type { QuestionSource } from '@/lib/exam-types'

/** Official page that justifies an answer, shown under the explanation; renders nothing without a source. */
export function SourceLink({ source }: { source?: QuestionSource }) {
  if (!source) return null
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex max-w-full items-start gap-1.5 self-start rounded-[1.375rem] bg-background px-3 py-3 text-sm font-bold no-underline hover:underline hover:underline-offset-4"
    >
      <ExternalLink aria-hidden="true" className="mt-[0.1875rem] size-3.5 shrink-0" strokeWidth={2.2} />
      <span className="min-w-0 [overflow-wrap:anywhere]">
        Source : {source.label}
        <span className="sr-only"> (nouvel onglet)</span>
      </span>
    </a>
  )
}
