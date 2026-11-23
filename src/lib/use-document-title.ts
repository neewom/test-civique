import { useEffect } from 'react'

export const APP_NAME = 'Futur Citoyen'

/** Sets the browser tab title to "<page> · Futur Citoyen". */
export function useDocumentTitle(page: string) {
  useEffect(() => {
    document.title = `${page} · ${APP_NAME}`
  }, [page])
}
