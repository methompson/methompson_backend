./scripts/docker_build_amd64.sh

(
  cd docker && \
  rm -rf dist
  mkdir dist
  docker save methompson_backend -o ./dist/methompson_backend.tar
)