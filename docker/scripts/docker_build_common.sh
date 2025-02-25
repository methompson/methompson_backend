rm -rf dist
rm -rf docker/artifacts
mkdir -p docker/artifacts

export $(grep ^GOOGLE_APPLICATION_CREDENTIALS .env)

echo $GOOGLE_APPLICATION_CREDENTIALS

cp $GOOGLE_APPLICATION_CREDENTIALS ./docker/artifacts/firebase.json

npm run compile_bundle

rm ./dist/main.js.map

mv ./dist ./docker/artifacts/dist
cp ./package.json ./docker/artifacts/package.json
