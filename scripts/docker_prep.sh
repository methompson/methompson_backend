rm -rf ./docker/artifacts
mkdir -p ./docker/artifacts

npm run tsup_compile

export $(grep ^GOOGLE_APPLICATION_CREDENTIALS .env)
echo $GOOGLE_APPLICATION_CREDENTIALS

cp $GOOGLE_APPLICATION_CREDENTIALS ./docker/artifacts/firebase.json
cp -R ./dist ./docker/artifacts/dist
cp -R ./package.json ./docker/artifacts/package.json