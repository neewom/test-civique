import { useCallback, useEffect, useState } from 'react'
import type { ListedQuestion } from '@/lib/exam'
import { getLoadedPack, loadQuestionPack } from '@/lib/question-packs'
import type { TitleKey } from '@/lib/target-title'

export type QuestionPack =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; retry: () => void }
  | { status: 'ready'; questions: ListedQuestion[] }

/**
 * The questions of a title, loaded on demand. A pack already in memory is ready at the first
 * render (no flash of the loading state); `null` asks for nothing (`idle`).
 */
export function useQuestionPack(title: TitleKey | null): QuestionPack {
  const [attempt, setAttempt] = useState(0)
  // Title whose load failed, until the user tries again
  const [failed, setFailed] = useState<TitleKey | null>(null)
  // Bumped when a pack arrives: it is in memory then, rendering again is enough
  const [, setArrivals] = useState(0)
  const questions = title ? getLoadedPack(title) : undefined

  useEffect(() => {
    if (!title || getLoadedPack(title)) return
    let cancelled = false
    loadQuestionPack(title).then(
      () => {
        if (!cancelled) setArrivals((n) => n + 1)
      },
      () => {
        if (!cancelled) setFailed(title)
      },
    )
    return () => {
      cancelled = true
    }
  }, [title, attempt])

  const retry = useCallback(() => {
    setFailed(null)
    setAttempt((n) => n + 1)
  }, [])

  if (!title) return { status: 'idle' }
  if (questions) return { status: 'ready', questions }
  if (failed === title) return { status: 'error', retry }
  return { status: 'loading' }
}
