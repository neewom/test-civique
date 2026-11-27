import { useState } from 'react'
import { PageFrame } from '@/components/PageFrame'
import { BackLink } from '@/components/BackLink'
import { ExamRules } from '@/components/ExamRules'
import { OrganicBackground } from '@/components/OrganicBackground'
import { PillLink } from '@/components/PillButton'
import { loadProgressForTitle } from '@/lib/exam-types'
import { DEFAULT_TITLE, loadTargetTitle } from '@/lib/target-title'
import { useRouteTitle } from '@/lib/use-document-title'

/** « Comment se passe l'examen » (maquette Pa3), opened from the home page. */
export default function Regles() {
  useRouteTitle('/regles')
  // Same as step 2 of the home page: resume the exam in progress of the chosen title, else the page before the exam
  const [hasExamInProgress] = useState(() => loadProgressForTitle(loadTargetTitle() ?? DEFAULT_TITLE) !== null)

  return (
    <PageFrame className="relative overflow-hidden" background={<OrganicBackground shape="info" />}>
      <div className="relative mx-auto flex w-full max-w-[30rem] flex-col gap-3.5 px-[22px] pt-0 pb-7 md:max-w-[36rem] md:px-8 md:pb-10">
        <BackLink />
        <h1 className="mt-4 max-w-[19rem] text-[2.125rem] leading-none font-bold tracking-[-0.04em] text-balance md:max-w-none md:text-[3rem]">
          Comment se passe l'examen
        </h1>
        <div className="mt-[3.75rem]">
          <ExamRules />
        </div>
        <PillLink to={hasExamInProgress ? '/examen' : '/examen-blanc'} size="lg" className="mt-1 justify-center text-center">
          M'entraîner maintenant
        </PillLink>
      </div>
    </PageFrame>
  )
}
