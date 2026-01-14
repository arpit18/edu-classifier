import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // If deploying to https://<user>.github.io/edu-classifier/, set the base to '/edu-classifier/'
  // If deploying to <user>.github.io (root), change this to '/'
  base: '/edu-classifier/',
})
