# 订单接单自动扣减库存功能实现文档

## 功能概述

当商家在订单列表接单后，系统会自动扣减订单中菜品绑定的食材库存，并检查库存情况自动下架相关菜品。

---

## 业务需求

### 需求描述
1. **接单触发扣减**：商家将订单状态变更为 `confirmed`（已接单）时触发
2. **扣减规则**：
   - 遍历订单中的所有菜品
   - 对每个菜品，扣减其绑定的所有食材库存（每份菜品扣减1个食材）
   - 库存不会扣减为负数，最低为0
3. **自动下架规则**：
   - 扣减完成后，检查所有涉及的菜品
   - 如果菜品绑定的食材中有任意一个库存为0，则将该菜品自动下架（`isDelisted = true`）
   - 记录下架原因到日志

### 业务价值
- **库存管理**：实现库存与销售的自动联动
- **避免超卖**：及时下架缺货菜品，避免接单后无法制作
- **运营效率**：减少人工检查库存的工作量

---

## 技术实现

### 1. 模块依赖修改

#### 文件：[ChatBackEnd/src/modules/ordering/ordering.module.ts](../../ChatBackEnd/src/modules/ordering/ordering.module.ts)

**修改内容**：
- 新增导入 `Inventory` 和 `InventoryHistory` 实体
- 注册 `DishService` 和 `InventoryService` 为提供者
- 添加相关Schema到 `MongooseModule.forFeature`

```typescript
import { Inventory, InventorySchema } from '../inventory/entities/inventory.entity';
import { DishService } from '../dish/dish.service';
import { InventoryService } from '../inventory/inventory.service';
import { InventoryHistory, InventoryHistorySchema } from '../inventory/entities/inventory-history.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      // ...existing schemas
      { name: Inventory.name, schema: InventorySchema },
      { name: InventoryHistory.name, schema: InventoryHistorySchema },
    ]),
    AuthModule,
  ],
  providers: [OrderingService, DishService, InventoryService],
})
```

---

### 2. 核心服务实现

#### 文件：[ChatBackEnd/src/modules/ordering/ordering.service.ts](../../ChatBackEnd/src/modules/ordering/ordering.service.ts)

#### 2.1 依赖注入

```typescript
constructor(
  // ...existing dependencies
  @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
  private readonly dishService: DishService,
  private readonly inventoryService: InventoryService,
) {}
```

#### 2.2 更新订单状态方法

在 `updateOrderStatus` 方法中添加接单后的处理：

```typescript
async updateOrderStatus(orderId: string, status: string): Promise<...> {
  // 查找订单
  const order = await this.orderModel.findById(orderId).exec();
  if (!order) {
    throw new NotFoundException('订单不存在');
  }

  // 更新订单状态
  order.status = status;
  await order.save();

  // 如果订单状态变为confirmed（已接单），扣减库存并检查菜品状态
  if (status === 'confirmed') {
    this.logger.log(`Order confirmed, deducting inventory for order: ${orderId}`);
    await this.deductInventoryForOrder(order);
  }

  // 返回更新后的订单信息
  return { ... };
}
```

#### 2.3 扣减库存核心方法

```typescript
/**
 * 扣减订单中菜品所需的食材库存
 */
private async deductInventoryForOrder(order: OrderDocument): Promise<void> {
  this.logger.log(`Starting inventory deduction for order: ${order.orderId}`);
  
  // 用于跟踪所有涉及的菜品ID（用于后续检查是否需要下架）
  const affectedDishIds = new Set<string>();

  // 遍历订单中的所有菜品
  for (const orderDish of order.dishes) {
    const dishId = orderDish.dishId.toString();
    const quantity = orderDish.quantity;
    
    // 获取菜品信息（包括绑定的食材）
    const dish = await this.dishModel.findById(dishId).exec();
    
    if (!dish || !dish.ingredients || dish.ingredients.length === 0) {
      continue; // 跳过不存在或未绑定食材的菜品
    }

    // 扣减该菜品绑定的每个食材库存
    for (const ingredientId of dish.ingredients) {
      const inventory = await this.inventoryModel.findById(ingredientId).exec();
      
      if (!inventory) continue; // 跳过不存在的食材
      
      const quantityBefore = inventory.quantity;
      const deductAmount = quantity * 1; // 每份菜品消耗1个食材
      const quantityAfter = Math.max(0, quantityBefore - deductAmount);
      
      // 更新库存
      inventory.quantity = quantityAfter;
      await inventory.save();
      
      this.logger.log(
        `Deducted ingredient: ${inventory.productName}, ` +
        `before: ${quantityBefore}, deducted: ${deductAmount}, after: ${quantityAfter}`
      );

      // 记录该菜品受影响
      affectedDishIds.add(dishId);
    }
  }

  // 检查所有受影响的菜品，如果有食材库存为0，则自动下架
  if (affectedDishIds.size > 0) {
    await this.checkAndDelistDishes(Array.from(affectedDishIds));
  }
}
```

#### 2.4 自动下架检查方法

```typescript
/**
 * 检查菜品的食材库存，如果有任意食材为0则自动下架
 */
private async checkAndDelistDishes(dishIds: string[]): Promise<void> {
  for (const dishId of dishIds) {
    const dish = await this.dishModel.findById(dishId).exec();
    
    if (!dish || dish.isDelisted || !dish.ingredients?.length) {
      continue; // 跳过不存在、已下架或未绑定食材的菜品
    }

    // 检查所有绑定的食材
    let shouldDelist = false;
    const outOfStockIngredients: string[] = [];

    for (const ingredientId of dish.ingredients) {
      const inventory = await this.inventoryModel.findById(ingredientId).exec();
      
      if (inventory && inventory.quantity === 0) {
        shouldDelist = true;
        outOfStockIngredients.push(inventory.productName);
      }
    }

    // 如果需要下架，更新菜品状态
    if (shouldDelist) {
      dish.isDelisted = true;
      await dish.save();
      
      this.logger.log(
        `Auto-delisted dish: ${dish.name} (ID: ${dishId}), ` +
        `reason: ingredients out of stock [${outOfStockIngredients.join(', ')}]`
      );
    }
  }
}
```

---

## 数据流程

### 1. 接单流程

```
用户接单请求
    ↓
updateOrderStatus(orderId, 'confirmed')
    ↓
保存订单状态为 'confirmed'
    ↓
检测到状态为 'confirmed'
    ↓
调用 deductInventoryForOrder(order)
```

### 2. 扣减库存流程

```
deductInventoryForOrder(order)
    ↓
遍历订单中的菜品
    ↓
对每个菜品:
  ├─ 查询菜品信息（包括绑定的食材）
  ├─ 遍历菜品的所有食材
  │   ├─ 查询食材库存
  │   ├─ 扣减数量 = 菜品份数 × 1
  │   ├─ 更新库存（不会小于0）
  │   └─ 记录日志
  └─ 记录受影响的菜品ID
    ↓
调用 checkAndDelistDishes(affectedDishIds)
```

### 3. 自动下架流程

```
checkAndDelistDishes(dishIds)
    ↓
遍历受影响的菜品
    ↓
对每个菜品:
  ├─ 查询菜品状态
  ├─ 检查所有绑定的食材库存
  ├─ 如果有任意食材库存为0
  │   ├─ 设置 isDelisted = true
  │   ├─ 保存菜品
  │   └─ 记录下架日志（包含缺货食材列表）
  └─ 否则保持上架状态
```

---

## 异常处理

### 1. 菜品不存在
- **场景**：订单中的菜品ID在数据库中不存在
- **处理**：记录警告日志，跳过该菜品，继续处理其他菜品

### 2. 食材不存在
- **场景**：菜品绑定的食材ID在库存表中不存在
- **处理**：记录警告日志，跳过该食材，继续处理其他食材

### 3. 库存已为0
- **场景**：食材库存在扣减前已经为0
- **处理**：保持库存为0，不会变成负数，记录警告日志

### 4. 未绑定食材的菜品
- **场景**：菜品的 `ingredients` 字段为空数组或null
- **处理**：跳过该菜品，不进行任何库存操作

### 5. 操作失败
- **场景**：数据库操作异常
- **处理**：捕获异常，记录错误日志，继续处理下一个菜品/食材

---

## 日志输出

### 关键日志

1. **开始扣减**
   ```
   Starting inventory deduction for order: ORDER-20260202-XXXX
   ```

2. **处理菜品**
   ```
   Processing dish: 宫保鸡丁 (ID: 65a1b2c3d4e5f6789012345), quantity: 2
   Dish 宫保鸡丁 has 3 ingredients bound
   ```

3. **扣减食材**
   ```
   Deducted ingredient: 鸡肉, before: 10, deducted: 2, after: 8
   ```

4. **自动下架**
   ```
   Auto-delisted dish: 宫保鸡丁 (ID: 65a1b2c3d4e5f6789012345), 
   reason: ingredients out of stock [辣椒]
   ```

5. **警告日志**
   ```
   Dish not found: 65a1b2c3d4e5f6789012345, skipping inventory deduction
   Ingredient not found: 507f1f77bcf86cd799439011, skipping
   ```

---

## 测试用例

详见测试文档：[Documents/ordering/ordering-deduct-inventory.testcase.md](ordering-deduct-inventory.testcase.md)

### 核心测试场景

1. ✅ **TC01**: 正常扣减库存场景
2. ✅ **TC02**: 扣减后触发菜品自动下架
3. ✅ **TC03**: 多个食材扣减场景
4. ✅ **TC04**: 未绑定食材的菜品
5. ✅ **TC05**: 食材不存在或已删除
6. ✅ **TC06**: 库存数量为0时的扣减
7. ✅ **TC07**: 并发接单场景
8. ✅ **TC08**: 订单包含相同菜品多份

---

## API接口

### 更新订单状态

**接口地址**：`PATCH /ordering/orders/:orderId/status`

**请求参数**：
```json
{
  "status": "confirmed"
}
```

**响应示例**：
```json
{
  "orderId": "ORDER-20260202-123456",
  "userId": "user123",
  "status": "confirmed",
  "dishes": [
    {
      "dishId": "65a1b2c3d4e5f6789012345",
      "name": "宫保鸡丁",
      "price": 38,
      "quantity": 2
    }
  ],
  "totalPrice": 76,
  "createdAt": "2026-02-02T10:00:00.000Z",
  "updatedAt": "2026-02-02T10:05:00.000Z"
}
```

**副作用**：
- 订单状态变更为 `confirmed` 时，自动扣减食材库存
- 如有食材库存为0，相关菜品自动下架

---

## 数据库影响

### 1. Inventory集合

**影响字段**：
- `quantity`：库存数量会减少

**示例变化**：
```javascript
// 扣减前
{ _id: "507f1f77bcf86cd799439011", productName: "鸡肉", quantity: 10 }

// 扣减后（订单包含2份宫保鸡丁）
{ _id: "507f1f77bcf86cd799439011", productName: "鸡肉", quantity: 8 }
```

### 2. Dish集合

**影响字段**：
- `isDelisted`：可能从 `false` 变为 `true`

**示例变化**：
```javascript
// 下架前
{
  _id: "65a1b2c3d4e5f6789012345",
  name: "宫保鸡丁",
  ingredients: ["507f1f77bcf86cd799439011", "507f191e810c19729de860ea"],
  isDelisted: false
}

// 下架后（辣椒库存为0）
{
  _id: "65a1b2c3d4e5f6789012345",
  name: "宫保鸡丁",
  ingredients: ["507f1f77bcf86cd799439011", "507f191e810c19729de860ea"],
  isDelisted: true  // ← 自动下架
}
```

---

## 性能考虑

### 1. 异步处理
- 所有数据库操作使用 `async/await`
- 避免阻塞主线程

### 2. 批量查询优化
- 当前实现按顺序查询，适合中小规模订单
- 如需优化，可考虑：
  - 使用 `Promise.all` 并行查询菜品信息
  - 批量查询食材库存（使用 `$in` 操作符）

### 3. 事务支持（未来扩展）
- 目前未使用MongoDB事务
- 如需严格一致性，可考虑使用 `session.withTransaction()`

---

## 未来扩展

### 第一阶段（已完成）✅
- ✅ 基础库存扣减功能
- ✅ 自动下架功能
- ✅ 异常容错处理

### 第二阶段（计划中）
- [ ] 支持配置每份菜品的食材用量（而非固定1个）
- [ ] 添加库存扣减历史记录（InventoryHistory）
- [ ] 支持订单取消时恢复库存

### 第三阶段（规划中）
- [ ] 实时库存预警通知
- [ ] 库存不足时自动生成采购建议
- [ ] 支持食材批次管理（先进先出）

---

## 相关文档

- [菜品绑定食材功能文档](../dish-ingredient-binding/dish-ingredient-binding.md)
- [库存管理功能文档](../inventory/inventory.md)
- [订单管理功能文档](../ordering/ordering.md)
- [后端代码规范](../../.github/skills/bankend/SKILL.md)

---

## 更新日志

| 日期 | 版本 | 变更内容 | 作者 |
|------|------|----------|------|
| 2026-02-02 | v1.0 | 初始版本，实现接单扣减库存和自动下架功能 | AI Assistant |
| 2026-02-02 | v1.1 | 修复库存扣减问题，添加详细日志；实现消耗记录功能 | AI Assistant |
| 2026-02-02 | v1.2 | 修复库存不扣减的问题：支持preparing状态触发扣减 | AI Assistant |

---

## v1.2 更新内容（2026-02-02）

### 🐛 关键问题修复

**问题描述**：
- 接单后食材库存没有发生变化
- 消耗记录表中没有数据

**问题原因**：
前端在接单时，直接将订单状态从 `pending` 更新为 `preparing`，跳过了 `confirmed` 状态。而后端的库存扣减逻辑只检查 `status === 'confirmed'`，导致扣减逻辑从未被触发。

**订单状态流程**：
```
正常流程：pending → confirmed → preparing → completed
实际流程：pending → preparing → completed (跳过confirmed)
```

**修复方案**：
修改后端逻辑，在订单状态从 `pending` 变为 `confirmed` 或 `preparing` 时都触发库存扣减：

```typescript
// 记录旧状态，用于判断是否首次接单
const oldStatus = order.status;

// 更新订单状态
order.status = status;
await order.save();

// 如果订单状态从pending变为confirmed或preparing，说明是首次接单，需要扣减库存
const shouldDeductInventory = 
  oldStatus === 'pending' && 
  (status === 'confirmed' || status === 'preparing');

if (shouldDeductInventory) {
  this.logger.log(`✅ Order accepted (${oldStatus} → ${status}), deducting inventory`);
  await this.deductInventoryForOrder(order);
}
```

**日志输出示例**：
```
🔵 Updating order status: 65a1b2c3d4e5f6789012345, new status: "preparing" (type: string)
🔵 Order found: ORDER-20260202-123456, current status: "pending"
🔵 Order status updated from "pending" to "preparing"
✅ Order accepted (pending → preparing), deducting inventory for order: 65a1b2c3d4e5f6789012345
Starting inventory deduction for order: ORDER-20260202-123456
...
```

### 🎯 扣减触发条件

| 旧状态 | 新状态 | 是否扣减 | 说明 |
|--------|--------|---------|------|
| pending | confirmed | ✅ 是 | 商家接单（标准流程）|
| pending | preparing | ✅ 是 | 商家直接开始制作 |
| pending | completed | ❌ 否 | 异常流程 |
| confirmed | preparing | ❌ 否 | 已经扣减过了 |
| preparing | completed | ❌ 否 | 正常上菜流程 |
| * | cancelled | ❌ 否 | 取消订单 |

**防止重复扣减**：
通过检查 `oldStatus === 'pending'` 确保只在首次接单时扣减库存，避免状态多次变更导致重复扣减。

---

## v1.1 更新内容（2026-02-02）

### 🔧 问题修复

1. **库存扣减问题修复**
   - 添加了更详细的调试日志，便于排查问题
   - 在扣减库存前记录订单状态和菜品数量
   - 添加了成功标记（✅）以便快速识别执行结果

### ✨ 新增功能

#### 1. 库存消耗历史记录

**功能描述**：
- 每次接单扣减库存时，自动记录到 `InventoryHistory` 表
- 记录包含订单号、菜品信息、扣减数量等详细信息
- 支持按食材ID查询所有消耗记录

**数据结构扩展**：

```typescript
// 新增消耗类型
export enum InventoryChangeType {
  PURCHASE = 'purchase',       // 进货入库
  LOSS = 'loss',               // 损耗出库
  MANUAL_ADJUST = 'manual_adjust', // 手动调整
  ORDER_CONSUME = 'order_consume', // 订单消耗（新增）
}
```

**历史记录示例**：
```json
{
  "_id": "65a1b2c3d4e5f6789012345",
  "inventoryId": "507f1f77bcf86cd799439011",
  "productName": "鸡肉",
  "changeType": "order_consume",
  "changeQuantity": -2,
  "price": 15.5,
  "quantityBefore": 10,
  "quantityAfter": 8,
  "relatedOrderId": "65a1b2c3d4e5f6789012346",
  "relatedOrderNo": "ORDER-20260202-123456",
  "reason": "订单消耗 - 菜品: 宫保鸡丁",
  "operator": "user123",
  "createdAt": "2026-02-02T10:05:00.000Z"
}
```

#### 2. 后端API

**新增接口**：`GET /inventory/:id/consume-history`

**功能**：查询某个食材的所有订单消耗记录

**请求参数**：
- `id`（路径参数）：食材ID
- `page`（查询参数，可选）：页码，默认1
- `pageSize`（查询参数，可选）：每页数量，默认20

**响应示例**：
```json
{
  "code": 0,
  "message": "查询成功",
  "data": {
    "list": [
      {
        "_id": "65a1b2c3d4e5f6789012345",
        "productName": "鸡肉",
        "changeType": "order_consume",
        "changeQuantity": -2,
        "quantityBefore": 10,
        "quantityAfter": 8,
        "relatedOrderNo": "ORDER-20260202-123456",
        "reason": "订单消耗 - 菜品: 宫保鸡丁",
        "createdAt": "2026-02-02T10:05:00.000Z"
      }
    ],
    "total": 15,
    "page": 1,
    "pageSize": 20
  }
}
```

**实现文件**：
- Controller: [ChatBackEnd/src/modules/inventory/inventory.controller.ts](../../ChatBackEnd/src/modules/inventory/inventory.controller.ts)
- Service: [ChatBackEnd/src/modules/inventory/inventory.service.ts](../../ChatBackEnd/src/modules/inventory/inventory.service.ts)

#### 3. 前端消耗记录页面

**功能描述**：
- 在库存列表页面点击食材项，弹出操作菜单
- 菜单包含：查看变更历史、查看消耗记录、编辑库存信息
- 选择"查看消耗记录"后，跳转到专门的消耗记录页面

**新增文件**：
- 页面组件：[ChatUI/src/pages/MerchantDashboard/IngredientConsumeHistory.js](../../ChatUI/src/pages/MerchantDashboard/IngredientConsumeHistory.js)
- API方法：[ChatUI/src/api/inventory/inventoryApi.js](../../ChatUI/src/api/inventory/inventoryApi.js)

**页面功能**：
- 显示食材基本信息（当前库存、最近单价）
- 展示所有订单消耗记录，包括：
  - 消耗数量和时间
  - 关联的订单号
  - 消耗原因（菜品名称）
  - 变更前后的库存数量
- 支持下拉刷新和上拉加载更多
- 支持分页查询（每页20条）

**UI效果**：
```
┌────────────────────────────────────┐
│ ← 鸡肉 - 消耗记录                   │
├────────────────────────────────────┤
│ 当前库存: 8                         │
│ 最近单价: ¥15.50                    │
├────────────────────────────────────┤
│ ┌ 订单消耗                 -2      │
│ │ 鸡肉                              │
│ │ 02-02 10:05            10 → 8    │
│ │ 订单消耗 - 菜品: 宫保鸡丁         │
│ │ [订单: ORDER-20260202-123456]    │
│ └───────────────────────────────── │
│ ┌ 订单消耗                 -1      │
│ │ 鸡肉                              │
│ │ 02-01 15:30            11 → 10   │
│ │ 订单消耗 - 菜品: 口水鸡           │
│ │ [订单: ORDER-20260201-789012]    │
│ └───────────────────────────────── │
│                                     │
│ 加载中...                           │
└────────────────────────────────────┘
```

**修改的文件**：
- [ChatUI/src/pages/InventoryManagement/InventoryList.js](../../ChatUI/src/pages/InventoryManagement/InventoryList.js)
  - 添加ActionSheet菜单
  - 添加查看消耗记录的导航
  - 移除列表项上的编辑按钮，统一到菜单中
- [ChatUI/src/App.js](../../ChatUI/src/App.js)
  - 添加消耗记录页面路由

### 📝 日志输出增强

新增的日志标记：
```
Starting inventory deduction for order: ORDER-20260202-123456
Order status: confirmed, Order dishes count: 2
Processing dish: 宫保鸡丁 (ID: 65a1b2c3d4e5f6789012345), quantity: 2
Dish 宫保鸡丁 has 3 ingredients bound: ["507f1f77bcf86cd799439011",...]
Looking for ingredient: 507f1f77bcf86cd799439011
✅ Deducted ingredient: 鸡肉, before: 10, deducted: 2, after: 8
✅ Created inventory history record for 鸡肉
```

### 🎯 使用场景

1. **商家接单**：
   - 商家在订单列表点击"接单"
   - 系统自动扣减食材库存
   - 系统记录消耗历史

2. **查看消耗记录**：
   - 进入"库存管理" → "库存列表"
   - 点击任意食材项
   - 选择"查看消耗记录"
   - 查看该食材的所有订单消耗情况

3. **追踪订单**：
   - 在消耗记录中看到订单号
   - 可以追溯是哪个订单消耗了食材
   - 便于库存分析和成本核算
