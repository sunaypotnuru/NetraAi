import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const projectRoot = process.cwd()

export default defineConfig({
  root: projectRoot,
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react({
      jsxRuntime: 'automatic',
      jsxImportSource: 'react',
      babel: {
        plugins: []
      }
    }),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icon-192.png', 'icon-512.png'],
      workbox: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MiB to allow VideoCallPage chunk
      },
      manifest: {
        name: 'NetraAI',
        short_name: 'NetraAI',
        description: 'AI-powered telemedicine platform',
        theme_color: '#2E7D32',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(projectRoot, './src'),
      // Force single React instance
      'react': path.resolve(projectRoot, './node_modules/react'),
      'react-dom': path.resolve(projectRoot, './node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom'],
  },
  envDir: '../',

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
    chunkSizeWarningLimit: 800, // Reduced to 800KB to catch large chunks earlier
    minify: 'esbuild', // Use esbuild instead of terser - faster and safer for React
    // terserOptions removed - using esbuild instead
    sourcemap: false, // Disable sourcemaps in production for smaller size
    reportCompressedSize: false, // Faster builds
    cssCodeSplit: true, // Split CSS into separate files
  },
})
