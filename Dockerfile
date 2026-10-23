FROM node:20-slim AS deps
WORKDIR /usr/src/app
COPY package.json .
COPY package-lock.json* .
RUN npm ci

# Local development: Quartz's dev server with file watching and hot reload.
# The hot-reload script it injects connects to ws://localhost:3001, so this
# target must never be served publicly.
FROM node:20-slim AS dev
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/ /usr/src/app/
COPY . .
CMD ["npx", "quartz", "build", "--serve"]

FROM dev AS builder
RUN npx quartz build

# Production (default target): static files from the build, served by nginx.
FROM nginx:1.27-alpine AS prod
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /usr/src/app/public /usr/share/nginx/html
EXPOSE 8080
