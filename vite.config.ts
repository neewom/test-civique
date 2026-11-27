import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { configDefaults, defineConfig } from 'vitest/config'
import { questionPacks } from './vite-question-packs.ts'
import { seo } from './vite-seo.ts'
import { serviceWorker } from './vite-service-worker.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), questionPacks(), seo(), serviceWorker()],
  build: {
    // 404.html: the page of an unknown address (public/_redirects), built with the app's stylesheet
    rollupOptions: { input: { main: 'index.html', 'not-found': '404.html' } },
  },
  server: {
    // Accès depuis le réseau Tailscale (tailscale serve, voir AGENTS.md) ; le nom exact de la
    // machine reste hors du dépôt public (TAILSCALE_HOST dans .env), d'où le suffixe seul
    allowedHosts: ['.ts.net'],
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // e2e/ holds the Playwright regression suite (npm run tnr), not Vitest tests
    exclude: [...configDefaults.exclude, 'e2e/**'],
    // Node 25 enables native Web Storage, whose localStorage shadows jsdom's
    // (Vitest 4 replaced poolOptions.forks.execArgv with a top-level execArgv)
    execArgv: ['--no-experimental-webstorage'],
  },
})
