import type { Plugin } from 'vite'
import { NOINDEX_ROUTES, PUBLIC_ROUTES, SEO_END, SEO_START, htmlFileOf, renderSeoBlock, renderSitemap } from './src/lib/seo.ts'

// Search-engine metadata, generated from src/lib/seo.ts (the only source):
// - index.html gets the head block of the home page (the <!-- seo --> marker of the source file);
// - for every other public address, and for the noindex ones, a copy of the built index.html with
//   its own block, written as dist/<address>.html (public/_redirects serves it for the address, so
//   robots and link previews read the right tags without running the JavaScript);
// - dist/sitemap.xml lists the indexable addresses.
// The copies are not precached by the service worker (vite-service-worker.ts): offline, every page
// address is answered by the cached index.html and the app sets the tab title itself.

const MARKER = '<!-- seo -->'
const BLOCK = new RegExp(`${SEO_START}[\\s\\S]*?${SEO_END}`)

/** index.html with its seo block replaced by the one of another address. */
export function pageFor(indexHtml: string, block: string): string {
  if (!BLOCK.test(indexHtml)) throw new Error('seo: block markers not found in index.html')
  return indexHtml.replace(BLOCK, () => block)
}

/** The files to write next to index.html, by file name. */
export function seoFiles(indexHtml: string): Record<string, string> {
  const files: Record<string, string> = {}
  for (const route of PUBLIC_ROUTES) {
    if (route.path !== '/') files[htmlFileOf(route.path)] = pageFor(indexHtml, renderSeoBlock(route))
  }
  for (const route of NOINDEX_ROUTES) {
    files[htmlFileOf(route.path)] = pageFor(indexHtml, renderSeoBlock(route, { noindex: true, canonicalPath: '/' }))
  }
  files['sitemap.xml'] = renderSitemap()
  return files
}

export function seo(): Plugin {
  return {
    name: 'seo',
    // The home block goes into index.html only (the 404 page has its own tags)
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        if (!ctx.filename.endsWith('/index.html')) return html
        if (!html.includes(MARKER)) throw new Error('seo: <!-- seo --> marker not found in index.html')
        return html.replace(MARKER, () => renderSeoBlock(PUBLIC_ROUTES[0]))
      },
    },
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        const index = bundle['index.html']
        if (!index || index.type !== 'asset') throw new Error('seo: index.html not found in the bundle')
        for (const [fileName, source] of Object.entries(seoFiles(String(index.source)))) {
          this.emitFile({ type: 'asset', fileName, source })
        }
      },
    },
  }
}
