./scripts/docker_build_common.sh

(
  cd docker && \
  docker build \
  -t methompson_backend .
)