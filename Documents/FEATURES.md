# Ai Chat 项目功能清单

## 项目概述
Ai Chat 是一个基于AI的智能餐厅点餐系统，包含用户点餐、商家管理、游戏娱乐等完整功能模块。

---

## 已实现功能列表

### 1. 用户认证模块 (Auth)
- ✅ 用户注册
- ✅ 用户登录
- ✅ JWT Token 认证
- ✅ 角色选择 (USER/STAFF/BOSS)
- ✅ 权限验证

**文档**: [Documents/auth/](Documents/auth/)

---

### 2. 用户点餐模块 (Ordering)
- ✅ AI 智能点餐对话
- ✅ 需求分析（人数、预算、忌口、喜好）
- ✅ 智能菜单推荐
- ✅ 购物车管理
- ✅ 订单创建
- ✅ 订单状态管理
- ✅ 订单列表查询
- ✅ 聊天历史记录

**文档**: [Documents/ordering/](Documents/ordering/)

---

### 3. 菜品管理模块 (Dish)
- ✅ 菜品 CRUD 操作
- ✅ 菜品分类管理
- ✅ 菜品上架/下架
- ✅ 菜品标签系统
- ✅ 菜品浏览

**文档**: [Documents/dish/](Documents/dish/)

---

### 4. 库存管理模块 (Inventory)
- ✅ 库存 CRUD 操作
- ✅ 进货单管理
  - 创建进货单
  - 审批进货单
  - 确认入库
- ✅ 损耗记录
- ✅ 库存变动历史
- ✅ 低库存预警

**文档**: [Documents/inventory/](Documents/inventory/)

---

### 5. 座位管理模块 (Seat)
- ✅ 座位 CRUD 操作
- ✅ 座位状态管理
- ✅ 座位分配

**文档**: [Documents/seat/](Documents/seat/)

---

### 6. 权限管理模块 (Permission)
- ✅ 用户列表查询
- ✅ 用户角色修改
- ✅ 角色权限控制
  - BOSS: 最高权限
  - STAFF: 基本操作权限
  - USER: 普通用户权限
- ✅ 前端菜单动态显示
- ✅ 国际化支持 (2026-02-06)
  - 完整的中英文切换支持
  - 角色名称、状态消息、界面元素全面国际化
  - 统一的翻译管理

**文档**: [Documents/permission-management/](Documents/permission-management/)

---

### 7. 收入管理模块 (Revenue) ⭐ **NEW**
- ✅ 收入统计
  - 当日收入统计
  - 月度收入统计
  - 总体收入统计
- ✅ 财务指标计算
  - 营业收入
  - 原材料成本
  - 毛利润
  - 毛利率
  - 净利润
- ✅ 额外收支管理
  - 批量录入收支
  - 收支列表查询
  - 多条件筛选
  - 收支记录删除
- ✅ 权限控制（仅 BOSS）

**文档**: [Documents/revenue/](Documents/revenue/)

---

### 8. 游戏模块 (FlappyBird)
- ✅ FlappyBird 游戏
- ✅ 游戏排行榜
- ✅ 分数记录

**文档**: [FlappyBird/README.md](FlappyBird/README.md)

---

### 9. AI 对话模块 (DeepSeek)
- ✅ AI 对话接口
- ✅ 上下文管理
- ✅ 缓存机制
- ✅ 流式响应

**文档**: [Documents/mcp/](Documents/mcp/)

---

## 功能权限矩阵

| 功能模块 | USER | STAFF | BOSS |
|---------|------|-------|------|
| 用户点餐 | ✅ | ✅ | ✅ |
| 菜品浏览 | ✅ | ✅ | ✅ |
| 游戏娱乐 | ✅ | ✅ | ✅ |
| 订单管理 | ❌ | ✅ | ✅ |
| 菜品管理 | ❌ | ✅ | ✅ |
| 库存管理 | ❌ | ✅ | ✅ |
| 进货管理 | ❌ | ✅ | ✅ |
| 座位管理 | ❌ | ✅ | ✅ |
| 类别管理 | ❌ | ✅ | ✅ |
| **收入管理** | ❌ | ❌ | ✅ |
| 权限管理 | ❌ | ❌ | ✅ |

---

## 技术栈

### 后端 (ChatBackEnd)
- **框架**: NestJS
- **数据库**: MongoDB
- **缓存**: Redis
- **认证**: JWT
- **验证**: class-validator
- **文档**: Swagger
- **AI**: DeepSeek API

### 前端 (ChatUI)
- **框架**: React
- **UI 库**: Ant Design Mobile
- **路由**: React Router v6
- **HTTP**: Fetch API
- **状态管理**: React Hooks

### 游戏 (FlappyBird)
- **框架**: React
- **构建**: Webpack
- **Canvas**: 原生 Canvas API

---

## 项目结构

```
Ai-chat-Demo/
├── ChatBackEnd/              # 后端服务
│   ├── src/
│   │   ├── modules/          # 功能模块
│   │   │   ├── auth/         # 认证模块
│   │   │   ├── ordering/     # 点餐模块
│   │   │   ├── dish/         # 菜品模块
│   │   │   ├── inventory/    # 库存模块
│   │   │   ├── seat/         # 座位模块
│   │   │   ├── users/        # 用户模块
│   │   │   ├── revenue/      # 收入管理模块 ⭐
│   │   │   └── ...
│   │   └── app.module.ts     # 应用主模块
│   └── test/                 # 测试脚本
│
├── ChatUI/                   # 前端应用
│   ├── src/
│   │   ├── pages/            # 页面组件
│   │   │   ├── Register/
│   │   │   ├── RoleSelect/
│   │   │   ├── UserOrder/
│   │   │   ├── MerchantDashboard/
│   │   │   ├── InventoryManagement/
│   │   │   ├── PermissionManagement/
│   │   │   ├── RevenueManagement/  # 收入管理页面 ⭐
│   │   │   └── ...
│   │   ├── api/              # API 客户端
│   │   ├── utils/            # 工具函数
│   │   └── contexts/         # React Context
│   └── public/               # 静态资源
│
├── FlappyBird/               # 游戏应用
│   └── src/
│
├── Documents/                # 需求文档
│   ├── auth/
│   ├── ordering/
│   ├── dish/
│   ├── inventory/
│   ├── revenue/              # 收入管理文档 ⭐
│   └── ...
│
└── docker-compose.yml        # Docker 配置
```

---

## API 接口清单

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 点餐接口
- `POST /api/ordering/chat` - AI 点餐对话
- `GET /api/ordering/cart/:userId` - 获取购物车
- `POST /api/ordering/create` - 创建订单
- `GET /api/ordering/list` - 获取订单列表
- `PATCH /api/ordering/:orderId/status` - 更新订单状态

### 菜品接口
- `GET /api/dishes` - 获取菜品列表
- `POST /api/dishes` - 创建菜品
- `PATCH /api/dishes/:id` - 更新菜品
- `DELETE /api/dishes/:id` - 删除菜品

### 库存接口
- `GET /api/inventory` - 获取库存列表
- `POST /api/inventory` - 创建库存
- `PATCH /api/inventory/:id` - 更新库存
- `GET /api/inventory/:id/history` - 获取库存变动历史

### 进货单接口
- `POST /api/purchase-order` - 创建进货单
- `POST /api/purchase-order/:id/approve` - 审批进货单
- `POST /api/purchase-order/:id/receive` - 确认入库

### 损耗接口
- `GET /api/inventory-loss` - 获取损耗列表
- `POST /api/inventory-loss` - 创建损耗记录
- `DELETE /api/inventory-loss/:id` - 删除损耗记录

### 用户管理接口
- `GET /api/users/list` - 获取用户列表 (BOSS)
- `PATCH /api/users/:userId/role` - 更新用户角色 (BOSS)

### 收入管理接口 ⭐
- `GET /api/revenue/stats/today` - 当日收入统计 (BOSS)
- `GET /api/revenue/stats/month` - 月度收入统计 (BOSS)
- `GET /api/revenue/stats/total` - 总体收入统计 (BOSS)
- `POST /api/revenue/transactions/batch` - 批量创建额外收支 (BOSS)
- `GET /api/revenue/transactions` - 查询额外收支列表 (BOSS)
- `DELETE /api/revenue/transactions/:id` - 删除额外收支 (BOSS)

---

## 部署说明

### 开发环境启动
```bash
# 启动所有服务
./start.sh

# 或分别启动
./start-backend.sh     # 启动后端
./start-ui.sh          # 启动前端
./start-flappybird.sh  # 启动游戏
```

### Docker 部署
```bash
# 启动所有容器
docker-compose up -d

# 停止所有容器
./stop.sh

# 清理 Docker
./clean-docker.sh
```

### 阿里云部署
```bash
# 部署到阿里云
./deploy-to-aliyun.sh
```

---

## 测试脚本

- `test-inventory-api.sh` - 库存管理 API 测试
- `test-dish-ingredients.sh` - 菜品配料测试
- `test-revenue-api.sh` - 收入管理 API 测试 ⭐

---

## 最新更新

### 2026-02-01
- ✅ 新增收入管理模块
- ✅ 实现三个维度的收入统计（日/月/总）
- ✅ 实现额外收支批量录入
- ✅ 实现收支列表查询和筛选
- ✅ 完善权限控制（仅 BOSS 可访问）
- ✅ 创建完整的需求文档和测试用例

---

## 待开发功能

### 优先级 P0
- [ ] 订单推送通知
- [ ] 数据备份和恢复
- [ ] 系统日志查询

### 优先级 P1
- [ ] 精确成本核算
- [ ] 收入数据可视化
- [ ] 财务报表导出
- [ ] 预算管理

### 优先级 P2
- [ ] 多店铺支持
- [ ] 会员管理
- [ ] 优惠券系统
- [ ] 评价系统

---

## 贡献指南

1. 查看 [.github/skills/](/.github/skills/) 了解代码规范
2. 在 [Documents/](Documents/) 创建需求文档
3. 按照模块化原则开发功能
4. 编写测试用例
5. 更新本文档

---

## 许可证

MIT License
