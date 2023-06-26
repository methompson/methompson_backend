# FROM node:18-slim
FROM node:alpine

# RUN apt update && \
#   apt -y --no-install-recommends install imagemagick && \
#   apt clean && \
#   rm -rf /var/lib/apt/lists/* && \
#   mkdir -p /srv/blog && \
#   mkdir -p /srv/blog/images

WORKDIR /srv/blog

COPY ./artifacts/dist /srv/blog/dist
COPY ./artifacts/firebase.json /srv/blog/firebase.json
COPY ./artifacts/package.json /srv/blog/package.json

CMD ["node", "./dist/main.js"]