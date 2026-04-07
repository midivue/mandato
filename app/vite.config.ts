import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { execSync } from 'node:child_process'

function git(cmd: string, fallback: string): string {
  try {
    return execSync(cmd, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim() || fallback
  } catch {
    return fallback
  }
}

const rawHash = process.env.VITE_COMMIT_HASH ?? git('git rev-parse HEAD', 'dev')
const commitHash = rawHash.length > 7 ? rawHash.slice(0, 7) : rawHash
const gitTag = process.env.VITE_GIT_TAG ?? git('git describe --tags --exact-match HEAD', 'dev')
// YYYY-MM-DD HH:MM in Budapest time (CET/CEST, Europe/Budapest)
const buildDate =
  process.env.VITE_BUILD_DATE ??
  new Date()
    .toLocaleString('sv-SE', { timeZone: 'Europe/Budapest', hour12: false })
    .slice(0, 16)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __BUILD_COMMIT_HASH__: JSON.stringify(commitHash),
    __BUILD_TAG__: JSON.stringify(gitTag),
    __BUILD_DATE__: JSON.stringify(buildDate),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})
