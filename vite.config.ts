import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    nodePolyfills({
      include: ['buffer', 'stream', 'string_decoder', 'util', 'process', 'events', 'path', 'timers'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    })
  ],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
