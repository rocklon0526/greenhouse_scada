# Stage 1: Build React App
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY platform/core/frontend/package.json platform/core/frontend/package-lock.json ./
RUN npm ci

# Copy core frontend source
COPY platform/core/frontend ./platform/core/frontend

# Copy modules
COPY platform/modules ./platform/modules

# Adjust WORKDIR to build
WORKDIR /app/platform/core/frontend

# Build
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy build artifacts from Stage 1
COPY --from=build /app/platform/core/frontend/dist /usr/share/nginx/html

# Copy custom Nginx config
COPY platform/core/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
