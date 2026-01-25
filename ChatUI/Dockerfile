# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖（使用 npm install 以自动更新 lock 文件）
RUN npm install

# 复制源代码
COPY . .

# 设置 NODE_ENV 为 production，这样会自动使用 .env.production 文件
ENV NODE_ENV=production

# 构建应用（webpack 会读取 .env.production 文件中的配置）
RUN npm run build

# 生产阶段 - 使用 nginx 提供静态文件
FROM nginx:alpine

# 复制构建文件到 nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
