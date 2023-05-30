import { defineConfig } from 'tsup';

export default defineConfig((options) => {
  const prod = options.env?.NODE_ENV !== 'development';

  console.log('Prod Environment?', prod);

  return {
    entry: ['./src/main.ts'],
    splitting: true,
    sourcemap: true,
    clean: true,
    noExternal: [/(.*)/],
    target: ['node18'],
    minifyIdentifiers: false,
    minifyWhitespace: prod,
    minifySyntax: prod,
    treeshake: prod,
    // minifyWhitespace: false,
    // minifySyntax: false,
    // treeshake: false,
    // minifyIdentifiers: prod,
  };
});
