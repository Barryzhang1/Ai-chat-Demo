# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖（使用 npm install 以自动更新 lock 文件）
RUN npm install

# 复制源代码
COPY . .

# 接收构建参数并设置为环境变量（在构建前）
ARG REACT_APP_API_URL=http://localhost:3001/api
ARG REACT_APP_GAME_URL=http://localhost:3002
ARG REACT_APP_NAME=点餐系统

ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_GAME_URL=$REACT_APP_GAME_URL
ENV REACT_APP_NAME=$REACT_APP_NAME

# 构建应用（此时环境变量会被 webpack DefinePlugin 注入）
RUN npm run build

# 生产阶段 - 使用 nginx 提供静态文件
FROM nginx:alpine

# 复制构建文件到 nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 3000

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
