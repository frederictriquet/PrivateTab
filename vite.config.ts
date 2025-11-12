import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isFirefox = mode === 'firefox';

  return {
    plugins: [
      react(),
      crx({
        manifest: {
          ...manifest,
          // Firefox-specific adjustments
          ...(isFirefox && {
            browser_specific_settings: {
              gecko: {
                id: 'privatetab@example.com',
                strict_min_version: '109.0',
              },
            },
          }),
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@background': path.resolve(__dirname, './src/background'),
        '@content': path.resolve(__dirname, './src/content'),
        '@popup': path.resolve(__dirname, './src/popup'),
        '@shared': path.resolve(__dirname, './src/shared'),
      },
    },
    build: {
      outDir: isFirefox ? 'dist/firefox' : 'dist/chrome',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      hmr: {
        port: 5173,
      },
    },
  };
});
