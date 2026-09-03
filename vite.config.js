import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/umlage-problem/', // github pages serves from /<repo-name>/, without this the page is blank with 404s
  plugins: [react()],
})
