./scripts/docker_build.sh

(
  cd docker && \
  docker save methompson-blog -o methompson_blog.tar
)