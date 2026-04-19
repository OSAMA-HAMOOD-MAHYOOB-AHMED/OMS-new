import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // For GitHub Pages project sites, set:
  //   VITE_BASE_PATH=/your-repo-name/
  // For local dev + Docker nginx at "/", leave unset (defaults to "/").
  const base = env.VITE_BASE_PATH || '/'

  return {
    base,
    plugins: [vue()],
  }
})
