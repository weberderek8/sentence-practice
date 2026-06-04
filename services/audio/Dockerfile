# Build context is the repo root (see docker-compose.yml) so npm workspaces resolve.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY services/audio/package.json services/audio/package.json
RUN npm install
COPY packages/shared ./packages/shared
COPY services/audio ./services/audio
RUN npm run build -w @sentence-practice/shared \
  && npm run build -w @sentence-practice/audio

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
WORKDIR /app/services/audio
EXPOSE 4002
CMD ["node", "dist/index.js"]
