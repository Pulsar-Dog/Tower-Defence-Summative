import { defineConfig } from 'vite'

export default defineConfig({
  base: '/Tower-Defence-Summative/',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
  publicDir: 'public',
})
