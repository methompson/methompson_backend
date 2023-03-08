./scripts/docker_build_amd64.sh

(
  cd docker && \
  rm -rf dist
  mkdir dist
  docker save methompson-blog-backend -o ./dist/methompson-blog-backend.tar
)