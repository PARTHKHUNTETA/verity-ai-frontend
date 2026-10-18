# VerityAI frontend: build the Vite app, serve it with nginx, proxy /api to the backend.
# Runtime settings: PORT (default 8080) and API_UPSTREAM (e.g. http://backend:4000).

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
ENV PORT=8080 \
    API_UPSTREAM=http://backend:4000 \
    NGINX_ENVSUBST_FILTER="^(PORT|API_UPSTREAM)$"
COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
