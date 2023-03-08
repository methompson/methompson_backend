import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['./src/main.ts'],
  splitting: true,
  sourcemap: true,
  clean: true,
  noExternal: [/(.*)/],
  target: ['node16'],
  minifyWhitespace: true,
  // minifyIdentifiers: true, // Does not work. Result throws an error
  minifySyntax: true,
});
