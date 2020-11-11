##########################
# Build Typescript app
##########################
FROM --platform=${BUILDPLATFORM:-amd64} node:alpine as build

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn --frozen-lockfile --non-interactive --ignore-scripts --ignore-optional --production

COPY . ./
RUN yarn build



##########################
# Final stage
##########################
FROM alpine

WORKDIR /app
RUN apk add --update nodejs && \
  rm -rf /tmp/* /var/tmp/* /var/cache/apk/* /var/cache/distfiles/*

COPY --from=build /app/dist ./

ENTRYPOINT ["node", "index"]