import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    external: ['react', 'react-dom'],
    platform: 'browser',
  },
  {
    entry: { 'index.native': 'src/index.native.ts' },
    format: ['cjs'],
    // DTS skipped: @types/react-native bundles its own @types/react which conflicts
    // with the root version. Native TS consumers use index.d.ts (same exported API).
    dts: false,
    sourcemap: true,
    external: ['react', 'react-native'],
    platform: 'neutral',
  },
]);
