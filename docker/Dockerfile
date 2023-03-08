FROM node:slim
# FROM alpine:3.15

RUN apt update && \
  apt -y install imagemagick && \
  mkdir -p /srv/blog && \
  mkdir -p /srv/blog/images

WORKDIR /srv/blog

COPY ./artifacts/dist /srv/blog/dist
COPY ./artifacts/firebase.json /srv/blog/firebase.json
COPY ./artifacts/package.json /srv/blog/package.json

# RUN npm i --omit=dev

CMD ["node", "./dist/main.js"]