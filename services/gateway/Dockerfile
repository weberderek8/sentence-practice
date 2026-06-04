# Build context is the repo root (see docker-compose.yml) so npm workspaces resolve.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json tsconfig.base.json ./
COPY services/gateway/package.json services/gateway/package.json
RUN npm install
COPY services/gateway ./services/gateway
RUN npm run build -w @sentence-practice/gateway

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
WORKDIR /app/services/gateway
EXPOSE 8080
CMD ["node", "dist/index.js"]
