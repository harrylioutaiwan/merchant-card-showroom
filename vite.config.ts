import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const embed = mode === 'embed';

  return {
    base: './',
    esbuild: { jsx: 'automatic' },
    ...(embed ? {
      publicDir: false,
      define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    } : {}),
    build: {
      ...(embed ? {
        outDir: 'dist/embed',
        emptyOutDir: false,
        lib: {
          entry: 'src/embed.tsx',
          formats: ['es'],
          fileName: () => 'merchant-card.js',
        },
      } : {}),
      rollupOptions: {
        ...(embed ? { output: { assetFileNames: 'merchant-card[extname]' } } : {}),
        onwarn(warning, warn) {
          // These browser-only bundles do not use React Server Components.
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE' &&
            warning.id?.includes('/node_modules/@mui/') &&
            warning.message.includes('"use client"')) return;
          warn(warning);
        },
      },
    },
  };
});
