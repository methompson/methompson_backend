(
  cd docker && \
  docker run \
  --rm \
  -p 8000:80 \
  -e PORT='80' \
  -e MONGO_DB_URI='uri' \
  -e MONGO_DB_NAME='blog' \
  -e CONSOLE_LOGGING='true' \
  -e DB_LOGGING='true' \
  -e FILE_LOGGING='false' \
  -e BLOG_SERVER_TYPE='file' \
  -e IMAGE_SERVER_TYPE='file' \
  -e VICE_BANK_SERVER_TYPE='file' \
  -e BLOG_FILE_PATH='/srv/blog/files/data' \
  -e FILES_FILE_PATH='/srv/blog/files/data' \
  -e VICE_BANK_FILE_PATH='/srv/blog/files/data' \
  -e SAVED_FILE_PATH='/srv/blog/files/files' \
  -e VICE_BANK_SERVER_TYPE='file' \
  -e SAVED_FILE_PATH='/srv/blog/files' \
  -e GOOGLE_APPLICATION_CREDENTIALS='/srv/blog/firebase.json' \
  -v /path/to/local/files:/srv/blog/files \
  --name methompson_backend \
  methompson_backend
)