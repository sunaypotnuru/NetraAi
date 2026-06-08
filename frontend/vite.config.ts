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
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return;

          // ── Large, self-contained libraries (safe to split) ───────
          if (id.includes('node_modules/exceljs')) return 'exceljs';
          if (id.includes('node_modules/jspdf')) return 'jspdf';
          if (id.includes('node_modules/html2canvas')) return 'html2canvas';
          if (id.includes('node_modules/recharts')) return 'recharts';
          if (id.includes('node_modules/livekit-client')) return 'livekit-client';
          if (id.includes('node_modules/@livekit')) return 'livekit';
          if (id.includes('node_modules/motion') || id.includes('node_modules/framer-motion')) return 'animation';
          if (id.includes('node_modules/lucide-react')) return 'icons';
          if (id.includes('node_modules/lodash')) return 'lodash';
          if (id.includes('node_modules/date-fns')) return 'date-fns';

          // ── Supabase (large, loads lazily) ────────────────────────
          if (id.includes('node_modules/@supabase')) return 'supabase';

          // ── i18n ──────────────────────────────────────────────────
          if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) return 'i18n';

          // ── MUI (large, only used on some pages) ──────────────────
          if (id.includes('node_modules/@mui')) return 'mui';

          // ── Everything else (React, Radix, router, forms, etc.) ───
          // Kept together in 'vendor' to avoid chunk-initialization
          // race conditions (e.g. React.forwardRef undefined).
          return 'vendor';
        },
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
