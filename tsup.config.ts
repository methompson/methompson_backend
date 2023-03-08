import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['./src/main.ts'],
  splitting: true,
  sourcemap: true,
  clean: true,
  noExternal: [/(.*)/],
  target: ['node16'],
});
