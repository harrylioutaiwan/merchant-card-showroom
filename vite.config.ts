import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  base: './',
  esbuild: { jsx: 'automatic' },
  ...(mode === 'embed' ? {
    publicDir: false,
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    build: {
      outDir: 'dist/embed',
      emptyOutDir: false,
      lib: {
        entry: 'src/embed.tsx',
        formats: ['es'],
        fileName: () => 'merchant-card.js',
      },
      rollupOptions: {
        output: { assetFileNames: 'merchant-card[extname]' },
      },
    },
  } : {}),
}));
