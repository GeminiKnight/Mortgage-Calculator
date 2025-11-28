import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: Set this to your repository name for GitHub Pages
  // If your repo is https://github.com/user/mortgage-calculator, base should be '/mortgage-calculator/'
  // If you use a custom domain or user page, use '/'
  // For generic deployment that works in subfolders:
  base: './', 
})