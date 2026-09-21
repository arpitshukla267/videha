import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

const frontendEntry = path.resolve(__dirname, 'src/App.tsx');

function resolveExternalDependencies() {
  return {
    name: 'resolve-external-dependencies',
    async resolveId(id: string, importer?: string) {
      if (
        importer &&
        importer.replace(/\\/g, '/').includes('quotation-builder') &&
        !id.startsWith('.') &&
        !id.startsWith('/') &&
        !path.isAbsolute(id)
      ) {
        const resolved = await this.resolve(id, frontendEntry, { skipSelf: true });
        if (resolved) {
          return resolved;
        }
      }
      return null;
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [resolveExternalDependencies(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        '@videha/quotation-builder': path.resolve(__dirname, '../../quotation-builder/src'),
      },
      dedupe: ['react', 'react-dom'],
    },
    server: {
      fs: {
        allow: [path.resolve(__dirname, '..'), path.resolve(__dirname, '../..')],
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
