import { useEffect, useState } from 'react'
import type { ListedQuestion } from '@/lib/exam'
import { getLoadedPack, hasPackFailed, loadQuestionPack } from '@/lib/question-packs'
import type { TitleKey } from '@/lib/target-title'

export type QuestionPack =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; retry: () => void }
  | { status: 'ready'; questions: ListedQuestion[] }

// « Réessayer » reloads the page: a browser does not try a failed import() of the same URL again
// until then (and after a deployment the page may ask for files that no longer exist). What must
// survive does: the address, the revision filters (sessionStorage), the « new exam » marker (history state).
function retry() {
  window.location.reload()
}

/**
 * The questions of a title, loaded on demand. A pack already in memory is ready at the first
 * render (no flash of the loading state); one whose load already failed (a failed preload
 * included) is an error at once; `null` asks for nothing (`idle`).
 */
export function useQuestionPack(title: TitleKey | null): QuestionPack {
  // Bumped when a pack arrives or fails: the module state changed, rendering again reads it
  const [, setSettled] = useState(0)
  const questions = title ? getLoadedPack(title) : undefined

  useEffect(() => {
    if (!title || getLoadedPack(title) || hasPackFailed(title)) return
    let cancelled = false
    const settle = () => {
      if (!cancelled) setSettled((n) => n + 1)
    }
    loadQuestionPack(title).then(settle, settle)
    return () => {
      cancelled = true
    }
  }, [title])

  if (!title) return { status: 'idle' }
  if (questions) return { status: 'ready', questions }
  if (hasPackFailed(title)) return { status: 'error', retry }
  return { status: 'loading' }
}
