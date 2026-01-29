# 前端环境变量配置指南

## 概述

前端项目已经完成了环境变量配置，支持根据不同环境（开发、生产）灵活配置 API 和 Socket.IO 服务器地址。

## 环境变量说明

### REACT_APP_API_URL
- **用途**: 后端 API 基础地址（不包含 `/api` 路径）
- **开发环境**: `http://localhost:3001`
- **生产环境**: 可留空使用默认值，或设置为实际域名
- **注意**: 该配置已自动包含 `/api` 前缀，使用时直接拼接具体路由即可

### REACT_APP_SOCKET_URL
- **用途**: Socket.IO 服务器地址
- **开发环境**: `http://localhost:3001`
- **生产环境**: 可留空使用 `window.location.origin`，或设置为实际域名

## 配置文件

### 1. `.env.development`（开发环境）
```env
# 开发环境配置
REACT_APP_API_URL=http://localhost:3001
REACT_APP_SOCKET_URL=http://localhost:3001
```

### 2. `.env.production`（生产环境）
```env
NODE_ENV=production

# 生产环境 - API 和 Socket 地址
# 注意：REACT_APP_API_URL 不应该包含 /api 路径，配置中的 apiUrl 已经包含了
# 如果使用 nginx 代理，可以留空使用默认值（通过 window.location.origin）
# REACT_APP_API_URL=
# REACT_APP_SOCKET_URL=

# 如果后端服务在不同域名，使用完整 URL（不含 /api）：
# REACT_APP_API_URL=https://yourdomain.com
# REACT_APP_SOCKET_URL=https://yourdomain.com

# 阿里云 ECS 示例：
# REACT_APP_API_URL=http://your-ecs-ip:3001
# REACT_APP_SOCKET_URL=http://your-ecs-ip:3001
```

### 3. `.env.example`（示例配置）
提供了完整的配置示例和说明，可以作为模板复制为 `.env.development` 或 `.env.production`。

## 核心配置文件

### `src/config/index.js`
```javascript
// 环境变量配置
export const config = {
  // API 基础地址，生产环境使用相对路径通过 nginx 代理，开发环境使用环境变量
  apiUrl: process.env.REACT_APP_API_URL || '/api',
  // Socket.IO 服务器地址，开发环境需要指定完整地址，生产环境通过 nginx 代理
  socketUrl: process.env.REACT_APP_SOCKET_URL || window.location.origin,
  appName: '点餐系统',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};
```

## 修改的文件列表

### 1. 配置文件
- ✅ `src/config/index.js` - 统一配置管理
- ✅ `.env.development` - 开发环境配置
- ✅ `.env.production` - 生产环境配置
- ✅ `.env.example` - 配置示例

### 2. 页面组件
- ✅ `src/pages/Chat/Chat.js` - 聊天页面
- ✅ `src/pages/UserOrder/UserOrder.js` - 用户点餐页面
- ✅ `src/pages/MerchantDashboard/SeatManagement.js` - 商家座位管理页面

### 3. API 文件（已支持）
- ✅ `src/api/orderApi.js` - 订单 API
- ✅ `src/api/dishApi.js` - 菜品 API
- ✅ `src/api/categoryApi.js` - 分类 API
- ✅ `src/api/userApi.js` - 用户 API

## 使用方式

### 在组件中使用
```javascript
import { config } from '../../config';
import { io } from 'socket.io-client';

// Socket.IO 连接
const socket = io(`${config.socketUrl}/seat`, {
  transports: ['websocket'],
});

// API 调用
const response = await fetch(`${config.apiUrl}/seats/with-status`);
```

### 在 API 文件中使用
```javascript
import { config } from '../config';

const API_BASE_URL = config.apiUrl;

export const orderApi = {
  aiOrder: async (message) => {
    const response = await fetch(`${API_BASE_URL}/ordering/ai-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    return response.json();
  },
};
```

## 路径规范

### ✅ 正确的路径格式
```javascript
// config.apiUrl 已经包含了 '/api'，所以直接拼接具体路由
`${config.apiUrl}/seats/with-status`        // ✅ 正确
`${config.apiUrl}/ordering/ai-order`        // ✅ 正确
`${config.socketUrl}/seat`                  // ✅ 正确
```

### ❌ 错误的路径格式
```javascript
`${config.apiUrl}/api/seats/with-status`    // ❌ 错误：重复了 /api
`${config.apiUrl}api/seats`                 // ❌ 错误：缺少斜杠
```

## 部署说明

### 开发环境
1. 创建 `.env.development` 文件
2. 设置本地后端服务地址
3. 运行 `npm start`

### 生产环境
1. 根据实际部署情况修改 `.env.production`
2. 如果前后端部署在同一域名下，使用 nginx 代理，可以留空使用默认值
3. 如果前后端分离部署，需要设置完整的后端地址
4. 运行 `npm run build` 构建

### Docker 部署
Docker 构建时会自动读取 `.env.production` 文件的配置。如果需要在容器启动时动态配置：

```bash
docker run -e REACT_APP_API_URL=http://your-backend:3001 \
           -e REACT_APP_SOCKET_URL=http://your-backend:3001 \
           your-image
```

## 注意事项

1. **环境变量前缀**: React 环境变量必须以 `REACT_APP_` 开头
2. **构建时注入**: 环境变量在构建时被注入，修改后需要重新构建
3. **安全性**: 不要在环境变量中存储敏感信息（如密钥、密码）
4. **路径一致性**: 确保所有 API 调用都使用 `config.apiUrl`，不要硬编码路径
5. **默认值**: 生产环境可以依赖默认值，开发环境必须明确设置

## 测试验证

### 开发环境测试
1. 启动后端服务: `cd ChatBackEnd && npm run start:dev`
2. 启动前端服务: `cd ChatUI && npm start`
3. 打开浏览器控制台，检查网络请求的地址是否正确
4. 测试 Socket.IO 连接是否正常

### 生产环境测试
1. 构建前端: `npm run build`
2. 部署到服务器
3. 检查 API 和 Socket.IO 请求是否指向正确的地址
4. 测试所有功能是否正常

## 故障排查

### Socket.IO 连接失败
- 检查 `REACT_APP_SOCKET_URL` 是否正确
- 确认后端 Socket.IO 服务是否启动
- 检查浏览器控制台的错误信息
- 验证 CORS 配置是否正确

### API 请求 404
- 检查 `REACT_APP_API_URL` 配置
- 确认 API 路径是否正确（不要重复 `/api`）
- 查看网络面板中的实际请求地址
- 确认后端路由配置

### 环境变量未生效
- 确认文件名是否正确（`.env.development` 或 `.env.production`）
- 修改环境变量后需要重启开发服务器或重新构建
- 检查变量名是否以 `REACT_APP_` 开头
- 使用 `console.log(process.env)` 查看所有环境变量

## 相关文档

- [后端配置指南](../backend/configuration-guide.md)
- [Docker 部署指南](../docker/deployment-guide.md)
- [Nginx 配置指南](../nginx/configuration-guide.md)
