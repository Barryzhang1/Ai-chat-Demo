# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM node:18-alpine

# 安装 wget 用于健康检查
RUN apk add --no-cache wget

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 只安装生产依赖
RUN npm ci --only=production

# 从构建阶段复制编译后的文件
COPY --from=builder /app/dist ./dist

# 暴露端口
EXPOSE 3001

# 启动应用
CMD ["node", "dist/main.js"]
