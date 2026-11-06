import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {rm, stat} from 'node:fs/promises';
import path from 'path';
import {defineConfig, type Plugin, type ResolvedConfig} from 'vite';
import {CREATE_CHARACTER_ASSET_COPY_PLAN} from './src/data/createCharacterAssets';
import {GENERATOR_PRESET_ASSET_PLAN} from './src/data/generatorPresets';

function createCharacterAssetPlugin(): Plugin {
  let config: ResolvedConfig;
  return {
    name: 'stage-create-character-assets',
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    async closeBundle() {
      const outputRoot = path.resolve(config.root, config.build.outDir);
      for (const {source, target, maxBytes} of CREATE_CHARACTER_ASSET_COPY_PLAN) {
        const sourcePath = path.join(config.publicDir, source.replace(/^\//, ''));
        const targetPath = path.join(outputRoot, target.replace(/^\//, ''));
        const sourceStat = await stat(sourcePath).catch(() => null);

        const targetStat = await stat(targetPath).catch(() => null);
        if (!targetStat?.isFile()) throw new Error(`Missing optimized create-character asset: ${target}`);
        if (maxBytes && targetStat.size > maxBytes) {
          throw new Error(`Optimized create-character asset exceeds budget: ${target}`);
        }
      }
      for (const {source, target} of GENERATOR_PRESET_ASSET_PLAN) {
        const sourceStat = await stat(path.join(config.publicDir, source.replace(/^\//, ''))).catch(() => null);
        const targetStat = await stat(path.join(outputRoot, target.replace(/^\//, ''))).catch(() => null);

        if (!targetStat?.isFile()) throw new Error(`Missing optimized generator preset asset: ${target}`);
      }
      await rm(path.join(outputRoot, 'create-character', 'v2'), {recursive: true, force: true});
      await rm(path.join(outputRoot, 'create-character', 'assets', 'v3'), {recursive: true, force: true});
      await rm(path.join(outputRoot, 'create-character', 'assets', 'v4'), {recursive: true, force: true});
      await rm(path.join(outputRoot, 'create-character', 'main'), {recursive: true, force: true});
      await rm(path.join(outputRoot, 'create-character', 'options'), {recursive: true, force: true});
      await rm(path.join(outputRoot, 'generator', 'new-assets'), {recursive: true, force: true});
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      createCharacterAssetPlugin(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (/[\\/]node_modules[\\/](?:react|react-dom|scheduler)(?:[\\/]|$)/.test(id)) return 'react-vendor';
            if (/[\\/]src[\\/](?:apiCache|apiCachePolicy|chatTimelineCache|pageDataCache)\.ts$/.test(id)) return 'app-cache';
            return undefined;
          },
        },
      },
    },
    server: {
      allowedHosts: ['terminal.local'],
      proxy: {
        '/api/env1/v1': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyRequest) => {
              proxyRequest.setHeader('Origin', 'http://127.0.0.1:8000');
            });
          },
        },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
