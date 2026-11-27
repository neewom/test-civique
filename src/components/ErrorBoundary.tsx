import { Component, useEffect, useRef, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { PageFrame } from '@/components/PageFrame'
import { OrganicBackground } from '@/components/OrganicBackground'
import { buttonVariants } from '@/components/ui/button'
import { useDocumentTitle } from '@/lib/use-document-title'
import { cn } from '@/lib/utils'

/** Fallback page (maquettes Sr1 to Sr3): calm message, focus on the title, full reload to the home page. Sends nothing to the stats. */
function ErrorPage() {
  useDocumentTitle('Erreur')
  const titleRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  return (
    <PageFrame className="relative overflow-hidden" background={<OrganicBackground shape="info" />}>
      <div className="relative mx-auto flex w-full max-w-[30rem] flex-col gap-3.5 px-[22px] pt-0 pb-8 md:max-w-[36rem] md:px-8 md:pb-10">
        <h1
          ref={titleRef}
          tabIndex={-1}
          className="max-w-[19rem] text-[2.125rem] leading-none font-bold tracking-[-0.04em] text-balance outline-none md:max-w-none md:text-[3rem]"
        >
          Cette page n'a pas pu s'afficher.
        </h1>
        <p className="text-base leading-snug md:text-[1.0625rem]">
          Vos examens enregistrés ne sont pas perdus : ils restent sur cet appareil, dans ce navigateur.
        </p>
        {/* Plain link: a full page load restarts from a clean state */}
        <a
          href="/"
          className={cn(buttonVariants({ variant: 'pill-ink', size: 'pill' }), 'mt-4 justify-center text-center no-underline')}
        >
          Retour à l'accueil
        </a>
      </div>
    </PageFrame>
  )
}

interface BoundaryProps {
  children: ReactNode
  /** The error is cleared when this changes (navigation) */
  resetKey: string
}

class Boundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidUpdate(prev: BoundaryProps) {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) this.setState({ failed: false })
  }

  render() {
    return this.state.failed ? <ErrorPage /> : this.props.children
  }
}

/** Catches rendering errors of the routes below it; must sit inside the router. */
export function ErrorBoundary({ children }: { children: ReactNode }) {
  const { key } = useLocation()
  return <Boundary resetKey={key}>{children}</Boundary>
}
