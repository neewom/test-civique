import { BackLink } from '@/components/BackLink'
import { ExamRules } from '@/components/ExamRules'
import { OrganicBackground } from '@/components/OrganicBackground'
import { PillLink } from '@/components/PillButton'
import { useDocumentTitle } from '@/lib/use-document-title'

/** « Comment se passe l'examen » (maquette Pa3), opened from the home page. */
export default function Regles() {
  useDocumentTitle("Comment se passe l'examen")

  return (
    <main className="relative min-h-svh overflow-hidden bg-background text-foreground">
      <OrganicBackground shape="info" />
      <div className="relative mx-auto flex w-full max-w-[30rem] flex-col gap-3.5 px-[22px] pt-5 pb-7">
        <BackLink />
        <h1 className="mt-4 max-w-[19rem] text-[2.125rem] leading-none font-bold tracking-[-0.04em] text-balance">
          Comment se passe l'examen
        </h1>
        <div className="mt-[3.75rem]">
          <ExamRules />
        </div>
        <PillLink to="/" state={{ openExam: true }} size="lg" className="mt-1 justify-center text-center">
          M'entraîner maintenant
        </PillLink>
      </div>
    </main>
  )
}
