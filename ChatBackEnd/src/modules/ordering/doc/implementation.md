# AI智能点餐功能实现文档

## 实现概述

本文档描述了AI智能点餐功能的实现细节，基于需求文档 `Documents/ordering/ai-ordering.md` 完成开发。

## 技术架构

### 模块结构

```
src/modules/ordering/
├── schemas/              # MongoDB数据模型
│   ├── cart.schema.ts   # 购物车
│   ├── order.schema.ts  # 订单
│   └── chat-history.schema.ts  # 对话历史
├── dto/                 # 数据传输对象
│   ├── ai-order.dto.ts
│   └── create-order.dto.ts
├── ordering.controller.ts  # 控制器
├── ordering.service.ts     # 业务逻辑
├── ordering.module.ts      # 模块定义
└── doc/                    # 文档
    └── implementation.md
```

## 已实现功能

### 1. AI智能点餐 (POST /ordering/ai-order)

**功能**：
- 接收用户自然语言消息
- 调用DeepSeek AI解析需求
- 提取查询条件并查询数据库
- 更新购物车并保存查询条件
- 保存对话历史

**关键实现**：
- DeepSeek API集成
- AI响应解析（QUERY_START/QUERY_END标记）
- MongoDB聚合查询（随机推荐）
- 对话历史管理（最多50条）

### 2. 刷新菜单 (POST /ordering/refresh-menu)

**功能**：
- 从购物车读取保存的查询条件
- 重新查询数据库获取不同菜品
- 更新购物车内容

**关键实现**：
- 使用MongoDB $sample实现随机查询
- 保持preferences不变

### 3. 创建订单 (POST /ordering/create-order)

**功能**：
- 根据购物车内容创建订单
- 生成UUID订单号
- 清空购物车

**关键实现**：
- 使用uuid v4生成订单号
- 订单状态管理（pending初始状态）

### 4. 获取购物车 (GET /ordering/cart)

**功能**：
- 返回当前用户购物车内容

## 数据模型

### Cart (购物车)
```typescript
{
  userId: string;           // 用户ID
  dishes: CartDishItem[];   // 菜品列表
  preferences: {            // 查询条件
    numberOfPeople?: number;
    tags?: string[];
    excludeTags?: string[];
    limit?: number;
  };
  totalPrice: number;       // 总价
  createdAt: Date;
  updatedAt: Date;
}
```

### Order (订单)
```typescript
{
  orderId: string;          // UUID订单号
  userId: string;
  dishes: OrderDishItem[];
  totalPrice: number;
  status: string;           // pending/confirmed/preparing/completed/cancelled
  note?: string;            // 订单备注
  createdAt: Date;
  updatedAt: Date;
}
```

### ChatHistory (对话历史)
```typescript
{
  userId: string;
  messages: [{
    role: string;           // user/assistant/system
    content: string;
    timestamp: Date;
  }];
  createdAt: Date;
  updatedAt: Date;
}
```

## API使用示例

### 1. AI点餐
```bash
curl -X POST http://localhost:3001/ordering/ai-order \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "我们3个人，想吃点辣的"}'
```

### 2. 刷新菜单
```bash
curl -X POST http://localhost:3001/ordering/refresh-menu \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. 创建订单
```bash
curl -X POST http://localhost:3001/ordering/create-order \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"note": "少放辣"}'
```

### 4. 获取购物车
```bash
curl -X GET http://localhost:3001/ordering/cart \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 环境配置

需要在 `.env` 文件中配置：

```env
# DeepSeek API配置
DEEPSEEK_API_KEY=your_deepseek_api_key

# MongoDB配置
MONGO_HOST=localhost
MONGO_PORT=27017
MONGO_USER=root
MONGO_PASSWORD=password
MONGO_DATABASE=restaurant
MONGO_AUTH_SOURCE=admin

# JWT配置
JWT_SECRET=your_jwt_secret
```

## 测试

运行测试：
```bash
cd ChatBackEnd
npm test -- --testPathPattern=ordering
```

运行e2e测试：
```bash
npm run test:e2e -- ordering.e2e-spec
```

## 注意事项

1. **DeepSeek API密钥**：需要有效的API密钥才能使用AI功能
2. **菜品数据**：需要先导入菜品数据（包含tags字段）
3. **用户认证**：所有接口都需要JWT认证
4. **错误处理**：已实现完整的错误处理和日志记录

## 后续优化建议

- [ ] 添加购物车商品数量调整功能
- [ ] 实现订单状态流转管理
- [ ] 添加订单查询接口
- [ ] 优化AI提示词以提高推荐准确性
- [ ] 添加缓存机制提升性能
- [ ] 实现购物车商品手动添加/删除
