import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Accès depuis le réseau Tailscale (tailscale serve, voir AGENTS.md)
    allowedHosts: ['mac-mini-de-vichith.tail5a5a34.ts.net'],
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
    // Node 25 enables native Web Storage, whose localStorage shadows jsdom's
    // (Vitest 4 replaced poolOptions.forks.execArgv with a top-level execArgv)
    execArgv: ['--no-experimental-webstorage'],
  },
})
