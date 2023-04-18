import { defineConfig } from 'tsup';

export default defineConfig((options) => {
  const prod = options.env?.NODE_ENV !== 'development';

  return {
    entry: ['./src/main.ts'],
    splitting: true,
    sourcemap: true,
    clean: true,
    noExternal: [/(.*)/],
    target: ['node18'],
    minifyWhitespace: false,
    minifySyntax: false,
    treeshake: true,
    minifyIdentifiers: false,
    // minifyWhitespace: prod,
    // minifySyntax: prod,
    // treeshake: prod,
    // minifyIdentifiers: prod,
  };
});
