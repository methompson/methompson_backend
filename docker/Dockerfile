FROM node
# FROM alpine:3.15

RUN mkdir -p /srv/blog
WORKDIR /srv/blog

COPY ./artifacts/dist ./dist
COPY ./artifacts/firebase.json ./firebase.json
COPY ./artifacts/package.json ./package.json

RUN npm i --omit=dev

CMD ["node", "./dist/main.js"]