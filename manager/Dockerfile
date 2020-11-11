##########################
# Build Typescript app
##########################
FROM --platform=${BUILDPLATFORM:-amd64} node:10.19.0-alpine as build

WORKDIR /app
RUN apk add --update --no-cache \
    build-base python bash
COPY package.json yarn.lock ./
RUN yarn --frozen-lockfile --non-interactive --ignore-scripts --ignore-optional --production

COPY src .
RUN yarn build



##########################
# Final stage
##########################
FROM alpine:3.9

WORKDIR /app
RUN apk add --update nodejs && \
  rm -rf /tmp/* /var/tmp/* /var/cache/apk/* /var/cache/distfiles/*

COPY --from=build /app/index.js ./

ENTRYPOINT ["node", "index"]