FROM node:22-alpine
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --workspace @dot-study/backend --workspace @dot-study/shared --include-workspace-root
COPY shared shared
COPY backend backend
RUN npx --workspace @dot-study/backend prisma generate && npm run build -w @dot-study/backend
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
WORKDIR /app/backend
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/seed.js && node dist/server.js"]
