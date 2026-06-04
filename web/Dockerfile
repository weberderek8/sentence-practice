# Build context is the repo root (see docker-compose.yml) so npm workspaces resolve.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY web/package.json web/package.json
RUN npm install
COPY packages/shared ./packages/shared
COPY web ./web
RUN npm run build -w @sentence-practice/shared \
  && npm run build -w @sentence-practice/web

# Production: static assets served by nginx, which also proxies /api -> gateway.
FROM nginx:1.27-alpine AS runtime
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
