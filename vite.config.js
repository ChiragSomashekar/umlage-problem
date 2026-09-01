import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/pyramide/', // GitHub Pages serves from /<repo-name>/ — without this, blank page + 404s
  plugins: [react()],
})
