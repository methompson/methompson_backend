npm run compile_bundle

# This is required because the hexoid module will import as an esmodule, despite being imported in the file as commonjs module.
# This is caused by the package.json for hexoid defining both the commonjs and esmodule imports.
sed -i '' "s/hexoid(25)/(typeof hexoid === 'function' ? hexoid : hexoid.default)(25)/g" dist/main.js