./docker_build_common.sh

(
  cd docker && \
  docker buildx build \
  --platform=linux/amd64 \
  -t methompson-blog-backend .
)