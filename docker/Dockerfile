FROM node
# FROM alpine:3.15

RUN apt update
RUN apt install imagemagick

RUN mkdir -p /srv/blog
RUN mkdir -p /srv/blog/images

WORKDIR /srv/blog

COPY ./artifacts/dist ./dist
COPY ./artifacts/firebase.json ./firebase.json
COPY ./artifacts/package.json ./package.json

RUN npm i --omit=dev

CMD ["node", "./dist/main.js"]