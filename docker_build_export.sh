./docker_build.sh

(
  cd docker && \
  rm -rf dist
  mkdir dist
  docker save methompson-blog-backend -o ./dist/methompson-blog-backend.tar
)