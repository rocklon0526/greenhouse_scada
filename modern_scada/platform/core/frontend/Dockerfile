# Stage 1: Build React App
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY platform/core/frontend/package.json ./

# 強制修正依賴版本
RUN npm pkg set devDependencies.@types/react="18.2.64" \
    && npm pkg set devDependencies.@types/react-dom="18.2.21"

# 安裝依賴
RUN npm install

# Copy core frontend source
COPY platform/core/frontend ./platform/core/frontend

# Copy modules
COPY platform/modules ./platform/modules

# ▼▼▼ 關鍵修正：複製 projects 資料夾，讓 TypeScript 能找到這些檔案 ▼▼▼
COPY projects ./projects

# 覆蓋修正後的 package.json
RUN cp package.json platform/core/frontend/package.json

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