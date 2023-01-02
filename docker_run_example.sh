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
  -e BLOG_SERVER_TYPE='mongo_db' \
  -e IMAGE_SERVER_TYPE='mongo_db' \
  -e SAVED_FILE_PATH='/srv/blog/files' \
  -e GOOGLE_APPLICATION_CREDENTIALS='/srv/blog/firebase.json' \
  -v /path/to/local/files:/srv/blog/files \
  --name methompson-blog-backend \
  methompson-blog-backend
)