# 菜品自动下架功能需求文档

## 1. 系统概述

### 1.1 功能概述
当管理员在菜品管理中手动绑定数量为0的食材时，系统会自动将该菜品下架，以确保库存不足的菜品不会对外销售。

### 1.2 业务价值
- **库存管理**：确保食材库存不足时，相关菜品自动下架，避免顾客下单后无法制作
- **运营效率**：减少人工检查，系统自动管理菜品上下架状态
- **用户体验**：避免顾客点到缺货菜品，提升满意度

---

## 2. 功能特性

### 2.1 核心功能

#### 自动下架触发条件
当满足以下条件时，菜品自动下架（设置 `isDelisted = true`）：

1. **更新场景**：管理员通过 PUT `/dish/:id` 接口更新菜品
2. **食材绑定**：更新请求中包含 `ingredients` 字段（食材ID数组）
3. **库存检查**：绑定的任意一个食材的库存数量（`quantity`）为 0

#### 自动下架逻辑
- 遍历所有绑定的食材ID
- 查询每个食材的库存信息
- 如果发现任何食材的 `quantity === 0`
- 自动设置 `isDelisted = true`
- 返回更新后的菜品信息

---

## 3. 技术实现

### 3.1 后端实现

#### 修改文件
- **文件路径**：`ChatBackEnd/src/modules/dish/dish.service.ts`
- **方法**：`update(id: string, updateDishDto: UpdateDishDto)`

#### 实现代码

```typescript
async update(id: string, updateDishDto: UpdateDishDto): Promise<Dish> {
  // 如果更新了 ingredients 字段，需要检查库存
  if (updateDishDto.ingredients !== undefined && updateDishDto.ingredients.length > 0) {
    const outOfStockIngredients: string[] = [];
    
    // 检查每个绑定的食材库存
    for (const ingredientId of updateDishDto.ingredients) {
      try {
        const inventory = await this.inventoryService.findOne(ingredientId);
        
        // 如果库存为0，记录该食材名称
        if (inventory.quantity === 0) {
          outOfStockIngredients.push(inventory.productName);
        }
      } catch (error) {
        // 如果食材不存在，抛出异常
        throw new BadRequestException(`食材ID ${ingredientId} 不存在`);
      }
    }
    
    // 如果有食材库存为0，自动下架菜品
    if (outOfStockIngredients.length > 0) {
      updateDishDto.isDelisted = true;
      console.log(`检测到食材 ${outOfStockIngredients.join('、')} 库存为0，菜品已自动下架`);
    }
  }
  
  const updatedDish = await this.dishModel.findByIdAndUpdate(
    id,
    updateDishDto,
    { new: true },
  );
  if (!updatedDish) {
    throw new NotFoundException('菜品不存在');
  }
  return updatedDish;
}
```

#### DTO 修改
- **文件路径**：`ChatBackEnd/src/modules/dish/dto/update-dish.dto.ts`
- **新增字段**：添加 `isDelisted?: boolean` 字段，允许程序自动设置下架状态

```typescript
@IsBoolean()
@IsOptional()
isDelisted?: boolean;
```

---

## 4. API 接口文档

### 4.1 更新菜品接口

**接口地址**：`PUT /dish/:id`

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| ingredients | string[] | 否 | 绑定的食材ID数组 |
| name | string | 否 | 菜品名称 |
| price | number | 否 | 菜品价格 |
| categoryId | string | 否 | 分类ID |
| description | string | 否 | 菜品描述 |
| tags | string[] | 否 | 标签数组 |

**请求示例**：

```json
{
  "ingredients": ["507f1f77bcf86cd799439011", "507f191e810c19729de860ea"]
}
```

**响应示例（食材库存充足）**：

```json
{
  "_id": "65a1b2c3d4e5f6789012345",
  "name": "宫保鸡丁",
  "price": 38,
  "categoryId": "65a1b2c3d4e5f678901234a",
  "description": "经典川菜",
  "tags": ["招牌菜", "微辣"],
  "ingredients": ["507f1f77bcf86cd799439011", "507f191e810c19729de860ea"],
  "isDelisted": false,
  "createdAt": "2026-02-01T10:00:00.000Z",
  "updatedAt": "2026-02-04T15:30:00.000Z"
}
```

**响应示例（食材库存为0，自动下架）**：

```json
{
  "_id": "65a1b2c3d4e5f6789012345",
  "name": "宫保鸡丁",
  "price": 38,
  "categoryId": "65a1b2c3d4e5f678901234a",
  "description": "经典川菜",
  "tags": ["招牌菜", "微辣"],
  "ingredients": ["507f1f77bcf86cd799439011"],
  "isDelisted": true,
  "createdAt": "2026-02-01T10:00:00.000Z",
  "updatedAt": "2026-02-04T15:35:00.000Z"
}
```

**后端日志**：
```
检测到食材 鸡肉 库存为0，菜品已自动下架
```

**异常响应**：

1. **食材不存在**
```json
{
  "statusCode": 400,
  "message": "食材ID 507f1f77bcf86cd799439011 不存在",
  "error": "Bad Request"
}
```

2. **菜品不存在**
```json
{
  "statusCode": 404,
  "message": "菜品不存在",
  "error": "Not Found"
}
```

---

## 5. 业务规则

### 5.1 自动下架规则

| 场景 | 行为 |
|------|------|
| 绑定单个数量为0的食材 | 自动下架 |
| 绑定多个食材，其中任何一个数量为0 | 自动下架 |
| 绑定的所有食材库存都充足（>0） | 保持原状态 |
| 清空食材绑定（ingredients: []） | 保持原状态 |
| 不更新 ingredients 字段 | 保持原状态 |
| 绑定不存在的食材ID | 抛出异常，更新失败 |

### 5.2 注意事项

1. **仅在更新时检查**：自动下架仅在调用 `PUT /dish/:id` 接口且包含 `ingredients` 字段时触发
2. **不影响现有状态**：如果菜品已经是下架状态（`isDelisted: true`），更新食材绑定不会将其上架
3. **库存实时检查**：每次更新食材绑定时都会查询最新的库存信息
4. **用户无感知**：自动下架对用户是透明的，后端自动处理

---

## 6. 测试用例

详细测试用例请参考：[auto-delist-dish.testcase.md](./auto-delist-dish.testcase.md)

### 6.1 核心测试场景

1. ✅ 绑定单个数量为0的食材，验证自动下架
2. ✅ 绑定多个食材（含数量为0），验证自动下架
3. ✅ 绑定库存充足的食材，验证不下架
4. ✅ 清空食材绑定，验证状态不变
5. ✅ 更新其他字段不触发库存检查
6. ✅ 绑定不存在的食材ID，验证异常处理

---

## 7. 使用指南

### 7.1 管理员操作流程

1. **进入菜品管理**
   - 登录商家管理后台
   - 进入"菜品管理"页面

2. **编辑菜品**
   - 点击某个菜品的"编辑"按钮
   - 在弹出的表单中绑定食材

3. **绑定食材**
   - 在"绑定食材"字段中选择所需食材
   - 可以选择多个食材

4. **提交保存**
   - 点击"保存"按钮
   - 系统自动检查食材库存
   - 如果有食材库存为0，菜品会自动下架

5. **查看结果**
   - 保存成功后，查看菜品状态
   - 如果菜品被自动下架，状态显示为"已下架"

### 7.2 恢复上架

如果食材库存补充后，需要手动将菜品重新上架：

1. 点击菜品的"上架"按钮（或在编辑时设置 `isDelisted: false`）
2. 系统会再次检查食材库存
3. 如果所有食材库存充足，菜品成功上架

---

## 8. 后续优化建议

### 8.1 功能增强

1. **前端提示优化**
   - 在前端显示自动下架的提示消息
   - 明确告知用户哪些食材库存不足

2. **批量检查**
   - 定时任务：每天自动检查所有菜品的食材库存
   - 批量下架库存不足的菜品

3. **库存预警**
   - 食材库存低于阈值时发送预警
   - 提前通知管理员补充库存

4. **历史记录**
   - 记录菜品自动下架的历史
   - 便于追踪和分析

### 8.2 技术优化

1. **性能优化**
   - 批量查询食材库存，减少数据库请求
   - 缓存食材信息

2. **事务处理**
   - 使用数据库事务确保数据一致性

---

## 9. 相关文档

- [菜品绑定食材功能文档](../../Documents/dish-ingredient-binding/dish-ingredient-binding.md)
- [菜品上架库存检查文档](./dish-listing-inventory-check.testcase.md)
- [菜品管理后端文档](./dish-backend.md)

---

## 10. 更新记录

| 日期 | 版本 | 说明 |
|------|------|------|
| 2026-02-04 | v1.0 | 初始版本，实现自动下架功能 |
