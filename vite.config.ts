import { svelte } from '@sveltejs/vite-plugin-svelte'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte(), basicSsl()],
  server: {
    headers: {
      'Content-Security-Policy': 'frame-ancestors https://www.notion.so',
    },
  },
})
