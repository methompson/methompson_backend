docker rm methompson_blog

(
  cd docker
  docker run \
    -p 8000:8000 \
    -e MONGO_DB_HOST='localhost' \
    -e MONGO_DB_USERNAME='blog-root' \
    -e MONGO_DB_PASSWORD='blog-password' \
    -e MONGO_DB_NAME=blog \
    -e MONGO_USE_SRV=true \
    -e CONSOLE_LOGGING=true \
    -e DB_LOGGING=true \
    -e BLOG_TYPE=mongo_db \
    --name methompson_blog \
    methompson_blog
)