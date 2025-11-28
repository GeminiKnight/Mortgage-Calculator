import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    // IMPORTANT: Set this to your repository name for GitHub Pages
    // If your repo is https://github.com/user/mortgage-calculator, base should be '/mortgage-calculator/'
    // If you use a custom domain or user page, use '/'
    // For generic deployment that works in subfolders:
    base: './',
    define: {
      // Maps import.meta.env.VITE_API_KEY to the VITE_API_KEY or API_KEY environment variable
      'import.meta.env.VITE_API_KEY': JSON.stringify(
        env.VITE_API_KEY || env.API_KEY
      ),
    },
  };
});
