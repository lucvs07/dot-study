FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY frontend/package.json frontend/
COPY backend/package.json backend/
RUN npm ci --workspace @dot-study/frontend --workspace @dot-study/shared --include-workspace-root
COPY shared shared
COPY frontend frontend
ARG VITE_DATA_SOURCE=api
ARG VITE_API_URL=
ARG VITE_SPOTIFY_CLIENT_ID=
ARG VITE_DEMO_MODE=false
ENV VITE_DATA_SOURCE=$VITE_DATA_SOURCE VITE_API_URL=$VITE_API_URL VITE_SPOTIFY_CLIENT_ID=$VITE_SPOTIFY_CLIENT_ID VITE_DEMO_MODE=$VITE_DEMO_MODE
RUN npm run build -w @dot-study/frontend

FROM nginx:1.27-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
