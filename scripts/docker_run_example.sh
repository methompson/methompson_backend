docker rm methompson_blog

(
  cd docker
  docker run \
    -p 8000:8000 \
    -e MONGO_DB_URI='mongodb://blog-root:blog-password@localhost' \
    -e MONGO_DB_NAME=blog \
    -e CONSOLE_LOGGING=true \
    -e DB_LOGGING=true \
    -e BLOG_SERVER_TYPE=mongo_db \
    --name methompson_blog \
    methompson_blog
)