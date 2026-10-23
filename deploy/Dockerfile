# Seed Protocol site image. Kept apart from Quartz's own root Dockerfile so upstream
# changes to that file merge without conflicts. Build from the repository root:
#   docker build -f deploy/Dockerfile .
FROM node:22-slim AS deps
WORKDIR /usr/src/app
COPY package.json package-lock.json .npmrc ./
RUN npm ci

# Local development: Quartz's dev server with file watching and hot reload.
# The hot-reload script it injects connects to ws://localhost:3001, so this
# target must never be served publicly.
FROM node:22-slim AS dev
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/ /usr/src/app/
COPY . .
RUN npm run install-plugins
CMD ["npx", "quartz", "build", "--serve"]

FROM dev AS builder
RUN npx quartz build

# Production (default target): static files from the build, served by nginx.
FROM nginx:1.27-alpine AS prod
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /usr/src/app/public /usr/share/nginx/html
EXPOSE 8080
