# 修改订单状态功能实现文档

## 功能概述

该功能允许用户修改自己订单的状态，支持订单在不同状态之间流转，便于订单生命周期管理。

## 需求说明

- 用户可以通过API修改自己订单的状态
- 仅订单所属用户有权限修改订单状态
- 支持的订单状态：`pending`（待处理）、`confirmed`（已确认）、`preparing`（制作中）、`completed`（已完成）、`cancelled`（已取消）
- 修改订单状态后，订单的`updatedAt`时间戳会自动更新

## 技术实现

### 1. 数据传输对象（DTO）

**文件位置**：`ChatBackEnd/src/modules/ordering/dto/update-order-status.dto.ts`

```typescript
import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: '订单状态',
    example: 'completed',
    enum: ['pending', 'confirmed', 'preparing', 'completed', 'cancelled'],
  })
  @IsString()
  @IsEnum(['pending', 'confirmed', 'preparing', 'completed', 'cancelled'], {
    message: '订单状态必须是以下之一：pending, confirmed, preparing, completed, cancelled',
  })
  status: string;
}
```

**功能说明**：
- 使用 `class-validator` 进行参数验证
- 使用枚举限制状态值，确保只能传入合法的订单状态
- Swagger API文档自动生成

### 2. Service层实现

**文件位置**：`ChatBackEnd/src/modules/ordering/ordering.service.ts`

```typescript
/**
 * 更新订单状态
 */
async updateOrderStatus(
  userId: string,
  orderId: string,
  status: string,
): Promise<{
  orderId: string;
  userId: string;
  status: string;
  dishes: Array<{
    dishId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  totalPrice: number;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}> {
  this.logger.log(
    `Updating order status: ${orderId}, user: ${userId}, status: ${status}`,
  );

  // 查找订单
  const order = await this.orderModel.findOne({ orderId }).exec();
  if (!order) {
    throw new NotFoundException('订单不存在');
  }

  // 验证订单所属用户
  if (order.userId !== userId) {
    throw new BadRequestException('无权限修改此订单');
  }

  // 更新订单状态
  order.status = status;
  await order.save();

  return {
    orderId: order.orderId,
    userId: order.userId,
    status: order.status,
    dishes: order.dishes.map((item) => ({
      dishId: item.dishId.toString(),
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
    totalPrice: order.totalPrice,
    note: order.note,
    createdAt: order.createdAt || new Date(),
    updatedAt: order.updatedAt || new Date(),
  };
}
```

**关键逻辑**：
1. 记录日志，便于追踪和调试
2. 根据orderId查询订单，不存在则抛出404异常
3. 验证订单所属用户，防止越权访问
4. 更新订单状态并保存到数据库
5. 返回完整的订单信息

### 3. Controller层实现

**文件位置**：`ChatBackEnd/src/modules/ordering/ordering.controller.ts`

```typescript
@Patch('orders/:orderId/status')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: '修改订单状态' })
@ApiParam({
  name: 'orderId',
  description: '订单ID',
  type: String,
})
@ApiResponse({
  status: 200,
  description: '订单状态修改成功',
})
@ApiResponse({ status: 400, description: '无权限修改此订单或请求参数错误' })
@ApiResponse({ status: 404, description: '订单不存在' })
@ApiResponse({ status: 401, description: '未授权' })
async updateOrderStatus(
  @Request() req: ExpressRequest & { user: { id: string } },
  @Param('orderId') orderId: string,
  @Body() updateOrderStatusDto: UpdateOrderStatusDto,
) {
  const userId = req.user.id;
  const result = await this.orderingService.updateOrderStatus(
    userId,
    orderId,
    updateOrderStatusDto.status,
  );

  return {
    code: 0,
    message: '订单状态修改成功',
    data: result,
  };
}
```

**特性说明**：
- 使用 `@Patch` 装饰器，符合RESTful规范（部分更新资源）
- 路由参数 `:orderId` 用于指定要修改的订单
- 使用 `@UseGuards(JwtAuthGuard)` 进行JWT认证（在类级别定义）
- 完整的Swagger API文档注解

## API 接口文档

### 请求

**方法**：`PATCH`  
**路径**：`/ordering/orders/:orderId/status`  
**需要认证**：是（JWT Token）

**路径参数**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| orderId | string | 是 | 订单ID（UUID格式） |

**请求头**：
```
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**：
```json
{
  "status": "completed"
}
```

**status字段说明**：
- `pending`：待处理（订单刚创建）
- `confirmed`：已确认（商家确认订单）
- `preparing`：制作中（正在准备菜品）
- `completed`：已完成（订单完成）
- `cancelled`：已取消（取消订单）

### 响应

**成功响应（200）**：
```json
{
  "code": 0,
  "message": "订单状态修改成功",
  "data": {
    "orderId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "completed",
    "dishes": [
      {
        "dishId": "507f1f77bcf86cd799439011",
        "name": "宫保鸡丁",
        "price": 38,
        "quantity": 2
      }
    ],
    "totalPrice": 76,
    "note": "少放辣",
    "createdAt": "2026-01-29T10:00:00.000Z",
    "updatedAt": "2026-01-29T10:30:00.000Z"
  }
}
```

**错误响应**：

| 状态码 | 说明 | 响应示例 |
|--------|------|----------|
| 400 | 无权限或参数错误 | `{"statusCode": 400, "message": "无权限修改此订单"}` |
| 401 | 未授权 | `{"statusCode": 401, "message": "Unauthorized"}` |
| 404 | 订单不存在 | `{"statusCode": 404, "message": "订单不存在"}` |

## 使用示例

### curl示例

```bash
# 将订单状态修改为completed
curl -X PATCH http://localhost:3000/ordering/orders/f47ac10b-58cc-4372-a567-0e02b2c3d479/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "status": "completed"
  }'
```

### JavaScript/TypeScript示例

```typescript
async function updateOrderStatus(orderId: string, status: string, token: string) {
  const response = await fetch(
    `http://localhost:3000/ordering/orders/${orderId}/status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    }
  );
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
}

// 使用示例
const result = await updateOrderStatus(
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'completed',
  'your-jwt-token'
);
console.log(result);
```

## 安全性

1. **认证**：所有请求必须携带有效的JWT Token
2. **授权**：仅订单所属用户可以修改订单状态，防止越权访问
3. **输入验证**：使用DTO和class-validator进行严格的参数验证
4. **错误处理**：合适的HTTP状态码和错误信息，不泄露敏感信息

## 测试

详细测试用例请参考：[修改订单状态测试用例](./update-order-status.testcase.md)

## 注意事项

1. **状态流转**：虽然接口支持任意状态切换，但实际业务中应该遵循合理的状态流转规则（如：pending → confirmed → preparing → completed）
2. **并发控制**：当前实现未包含并发控制，如果需要严格的状态流转控制，建议添加乐观锁或状态机验证
3. **审计日志**：建议在生产环境中添加订单状态变更的审计日志，记录谁在什么时间修改了订单状态
4. **通知机制**：订单状态变更后可能需要通知用户（如发送消息、推送等），当前版本未实现此功能

## 扩展建议

1. **状态机验证**：添加状态转换规则验证，防止非法的状态跳转
2. **订单历史记录**：记录每次状态变更的历史，包括时间和操作人
3. **批量操作**：支持批量修改多个订单的状态
4. **Webhook通知**：订单状态变更时触发Webhook通知外部系统
5. **权限细化**：区分用户和商家权限，某些状态只能由商家修改
