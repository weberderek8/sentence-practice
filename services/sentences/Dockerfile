# Build context is the repo root (see docker-compose.yml) so npm workspaces resolve.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY services/sentences/package.json services/sentences/package.json
RUN npm install
COPY packages/shared ./packages/shared
COPY services/sentences ./services/sentences
RUN npm run build -w @sentence-practice/shared \
  && npm run build -w @sentence-practice/sentences

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
WORKDIR /app/services/sentences
EXPOSE 4001
CMD ["node", "dist/index.js"]
