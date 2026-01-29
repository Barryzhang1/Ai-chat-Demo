# 数据报表功能实现文档

## 系统概述

数据报表功能为餐厅管理系统提供数据统计和分析能力，包括营业收入统计和菜品销售排行分析。该功能基于已完成的订单数据，为餐厅运营提供决策支持。

## 功能特性

### 1. 今日总收入查询

#### 功能描述
查询指定日期或当日的订单总收入，统计所有已完成订单的金额总和。

#### 接口信息
- **端点**: `GET /api/ordering/reports/today-revenue`
- **查询参数**:
  - `date` (可选): 查询日期，格式YYYY-MM-DD，默认查询今日

#### 返回数据
```json
{
  "code": 0,
  "message": "查询成功",
  "data": {
    "date": "2026-01-29",
    "totalRevenue": 1580.50,
    "orderCount": 15
  }
}
```

#### 业务规则
1. 只统计`status='completed'`的订单
2. 按照订单创建时间(createdAt)过滤
3. 日期范围：指定日期的00:00:00到23:59:59
4. 金额保留2位小数

### 2. 菜品排行榜查询

#### 功能描述
统计所有已完成订单中各菜品的销售数据，按销量降序展示菜品排行榜。

#### 接口信息
- **端点**: `GET /api/ordering/reports/dish-ranking`
- **查询参数**:
  - `limit` (可选): 返回的菜品数量，默认10，最大50

#### 返回数据
```json
{
  "code": 0,
  "message": "查询成功",
  "data": [
    {
      "dishId": "507f1f77bcf86cd799439011",
      "dishName": "宫保鸡丁",
      "totalQuantity": 128,
      "totalRevenue": 3584.00,
      "orderCount": 98
    }
  ]
}
```

#### 业务规则
1. 只统计`status='completed'`的订单
2. 按照菜品总销量(totalQuantity)降序排序
3. 统计字段：
   - `totalQuantity`: 菜品总销量（所有订单中该菜品的quantity总和）
   - `totalRevenue`: 菜品总收入（price * quantity的总和）
   - `orderCount`: 该菜品出现的订单次数
4. 参数验证：1 <= limit <= 50

## 架构设计

### 模块结构
```
ChatBackEnd/src/modules/ordering/
├── dto/
│   └── report-query.dto.ts          # 报表查询DTO
├── ordering.controller.ts            # 控制器（新增报表接口）
├── ordering.service.ts               # 服务层（新增报表方法）
└── doc/
    └── report-test-cases.md          # 测试用例文档
```

### 数据流程

#### 今日总收入查询流程
```
Client Request
    ↓
OrderingController.getTodayRevenue()
    ↓
OrderingService.getTodayRevenue(date?)
    ↓
1. 确定查询日期（默认今日）
2. 构建日期范围（00:00:00 - 23:59:59）
3. MongoDB查询：{ status: 'completed', createdAt: { $gte, $lte } }
4. 计算总收入：reduce((sum, order) => sum + order.totalPrice)
5. 返回结果
    ↓
Response: { date, totalRevenue, orderCount }
```

#### 菜品排行榜查询流程
```
Client Request
    ↓
OrderingController.getDishRanking(limit?)
    ↓
OrderingService.getDishRanking(limit)
    ↓
1. 参数验证（1-50范围）
2. MongoDB聚合管道：
   - $match: { status: 'completed' }
   - $unwind: '$dishes'
   - $group: 按dishId分组统计销量和收入
   - $sort: { totalQuantity: -1 }
   - $limit: limit
3. 格式化结果
    ↓
Response: [{ dishId, dishName, totalQuantity, totalRevenue, orderCount }]
```

## 技术实现

### 1. DTO定义

#### ReportQueryDto
```typescript
export class ReportQueryDto {
  @ApiProperty({
    description: '查询日期（YYYY-MM-DD格式），不传则查询今日',
    example: '2026-01-29',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: '日期格式必须为 YYYY-MM-DD' })
  date?: string;
}
```

### 2. Service层实现

#### 今日总收入查询
```typescript
async getTodayRevenue(date?: string): Promise<{
  date: string;
  totalRevenue: number;
  orderCount: number;
}> {
  // 1. 确定查询日期
  const targetDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // 2. 查询已完成订单
  const query = {
    status: 'completed',
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  };
  const orders = await this.orderModel.find(query).exec();

  // 3. 计算总收入
  const totalRevenue = orders.reduce(
    (sum, order) => sum + order.totalPrice,
    0,
  );

  return {
    date: targetDate.toISOString().split('T')[0],
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    orderCount: orders.length,
  };
}
```

#### 菜品排行榜查询
```typescript
async getDishRanking(limit: number = 10): Promise<Array<{
  dishId: string;
  dishName: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
}>> {
  // MongoDB聚合管道
  const aggregationPipeline: any[] = [
    { $match: { status: 'completed' } },
    { $unwind: '$dishes' },
    {
      $group: {
        _id: '$dishes.dishId',
        dishName: { $first: '$dishes.name' },
        totalQuantity: { $sum: '$dishes.quantity' },
        totalRevenue: {
          $sum: { $multiply: ['$dishes.price', '$dishes.quantity'] },
        },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: limit },
  ];

  const result = await this.orderModel.aggregate(aggregationPipeline).exec();

  return result.map((item) => ({
    dishId: item._id.toString(),
    dishName: item.dishName,
    totalQuantity: item.totalQuantity,
    totalRevenue: parseFloat(item.totalRevenue.toFixed(2)),
    orderCount: item.orderCount,
  }));
}
```

### 3. Controller层实现

```typescript
@Get('reports/today-revenue')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: '查询今日总收入' })
@ApiQuery({
  name: 'date',
  required: false,
  type: String,
  description: '查询日期（YYYY-MM-DD格式），不传则查询今日',
})
async getTodayRevenue(@Query('date') date?: string) {
  const result = await this.orderingService.getTodayRevenue(date);
  return {
    code: 0,
    message: '查询成功',
    data: result,
  };
}

@Get('reports/dish-ranking')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: '查询菜品排行榜' })
@ApiQuery({
  name: 'limit',
  required: false,
  type: Number,
  description: '返回的菜品数量，默认10，最大50',
})
async getDishRanking(@Query('limit') limit?: number) {
  const limitNum = limit ? Math.min(Math.max(1, Number(limit)), 50) : 10;
  const result = await this.orderingService.getDishRanking(limitNum);
  return {
    code: 0,
    message: '查询成功',
    data: result,
  };
}
```

## API 接口文档

### 1. 查询今日总收入

#### 请求
- **方法**: GET
- **路径**: `/api/ordering/reports/today-revenue`
- **参数**:
  - `date` (query, 可选): 查询日期，格式YYYY-MM-DD

#### 响应
- **成功**: 200
```json
{
  "code": 0,
  "message": "查询成功",
  "data": {
    "date": "2026-01-29",
    "totalRevenue": 1580.50,
    "orderCount": 15
  }
}
```

### 2. 查询菜品排行榜

#### 请求
- **方法**: GET
- **路径**: `/api/ordering/reports/dish-ranking`
- **参数**:
  - `limit` (query, 可选): 返回数量，默认10，最大50

#### 响应
- **成功**: 200
```json
{
  "code": 0,
  "message": "查询成功",
  "data": [
    {
      "dishId": "507f1f77bcf86cd799439011",
      "dishName": "宫保鸡丁",
      "totalQuantity": 128,
      "totalRevenue": 3584.00,
      "orderCount": 98
    }
  ]
}
```

## 数据模型

### Order Schema
```typescript
{
  _id: ObjectId,
  orderId: string,          // UUID订单号
  userId: string,           // 用户ID
  dishes: [{                // 订单菜品列表
    dishId: ObjectId,
    name: string,
    price: number,
    quantity: number
  }],
  totalPrice: number,       // 订单总价
  status: string,           // 订单状态：completed/pending/preparing/cancelled
  createdAt: Date,          // 创建时间
  updatedAt: Date           // 更新时间
}
```

### 索引使用
- `status`: 用于过滤已完成订单
- `createdAt`: 用于日期范围查询

## 使用指南

### 查询今日收入
```bash
# 查询今日收入
curl -X GET "http://localhost:3001/api/ordering/reports/today-revenue"

# 查询指定日期收入
curl -X GET "http://localhost:3001/api/ordering/reports/today-revenue?date=2026-01-28"
```

### 查询菜品排行榜
```bash
# 查询前10名（默认）
curl -X GET "http://localhost:3001/api/ordering/reports/dish-ranking"

# 查询前20名
curl -X GET "http://localhost:3001/api/ordering/reports/dish-ranking?limit=20"
```

## 部署运行

无需额外部署步骤，功能已集成到ordering模块中。

### 启动后端服务
```bash
cd ChatBackEnd
npm install
npm run start:dev
```

### 访问Swagger文档
打开浏览器访问: `http://localhost:3001/api`

在Swagger UI中找到`ordering`标签，可以看到新增的两个报表接口。

## 测试说明

详细测试用例请参考：[report-test-cases.md](../src/modules/ordering/doc/report-test-cases.md)

### 快速测试

#### 1. 准备测试数据
确保MongoDB中有已完成的订单：
```javascript
db.orders.insertOne({
  orderId: "test-001",
  userId: "user-1",
  dishes: [
    { dishId: ObjectId(), name: "宫保鸡丁", price: 28, quantity: 2 }
  ],
  totalPrice: 56,
  status: "completed",
  createdAt: new Date()
});
```

#### 2. 测试今日收入
```bash
curl http://localhost:3001/api/ordering/reports/today-revenue
```

#### 3. 测试菜品排行
```bash
curl http://localhost:3001/api/ordering/reports/dish-ranking
```

### 测试检查点
- ✅ 只统计completed状态订单
- ✅ 日期过滤正确
- ✅ 金额计算准确
- ✅ 排序正确（按销量降序）
- ✅ 参数验证有效

## 故障排查

### 问题1: 查询结果为空
**原因**: 数据库中没有completed状态的订单
**解决**: 
```javascript
// 检查订单状态
db.orders.find({ status: "completed" }).count()

// 如需要，更新订单状态
db.orders.updateMany(
  { status: "pending" },
  { $set: { status: "completed" } }
)
```

### 问题2: 菜品排行榜数据不准确
**原因**: 订单中的菜品数据结构不正确
**解决**:
- 检查orders表中dishes字段的数据结构
- 确保每个dish包含：dishId、name、price、quantity字段

### 问题3: 日期查询不准确
**原因**: 时区问题
**解决**:
- 服务器时区设置为UTC+8
- 或在查询时明确指定时区

## 性能优化

### 索引优化
确保以下字段有索引：
```javascript
db.orders.createIndex({ status: 1 })
db.orders.createIndex({ createdAt: 1 })
db.orders.createIndex({ status: 1, createdAt: 1 })  // 复合索引
```

### 查询优化
- 今日收入查询使用简单查询+聚合，性能良好
- 菜品排行榜使用聚合管道，MongoDB会自动优化
- 大数据量时建议定期归档历史数据

## 开发日志

| 日期 | 版本 | 变更内容 |
|------|------|---------|
| 2026-01-29 | v1.0 | 初始版本，实现今日收入和菜品排行榜功能 |

## 参考文档

- [ChatBackEnd 项目文档](../../../.github/backend-instructions.md)
- [NestJS 官方文档](https://docs.nestjs.com)
- [MongoDB 聚合管道文档](https://docs.mongodb.com/manual/aggregation/)
- [测试用例文档](../src/modules/ordering/doc/report-test-cases.md)
