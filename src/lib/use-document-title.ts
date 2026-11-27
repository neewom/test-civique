import { useEffect } from 'react'
import { SITE_NAME, routeMeta } from '@/lib/seo'

export const APP_NAME = SITE_NAME

/** Sets the browser tab title to "<page> · Futur Citoyen". */
export function useDocumentTitle(page: string) {
  useEffect(() => {
    document.title = `${page} · ${APP_NAME}`
  }, [page])
}

/** Sets the tab title of a public address: the title of src/lib/seo.ts, the one the build writes in its HTML. */
export function useRouteTitle(path: string) {
  const title = routeMeta(path).title
  useEffect(() => {
    document.title = title
  }, [title])
}
