import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            // Suppress common proxy errors
            if (!['ECONNRESET', 'EPIPE', 'ECONNREFUSED'].includes(err.code)) {
              console.log('API proxy error:', err.message);
            }
          });
        }
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
        changeOrigin: true,
        configure: (proxy, options) => {
          // Suppress socket errors - these are normal when connections drop
          proxy.on('error', (err) => {
            // Silent - these errors are expected during reconnects
          });
          proxy.on('proxyReqWs', (proxyReq, req, socket) => {
            socket.on('error', () => {
              // Silent - socket errors are normal
            });
          });
        }
      }
    },
    // Suppress HMR errors in console
    hmr: {
      overlay: true,
    }
  }
})

