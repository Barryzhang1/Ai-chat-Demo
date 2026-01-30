# 菜品绑定库存食材功能需求文档

## 需求概述

在菜品管理模块的新增和编辑功能中，增加绑定库存食材的能力。商家可以为每个菜品关联多个库存食材，用于后续的库存消耗追踪、成本核算等功能。

### 业务价值
- **库存追踪**：建立菜品与食材的关联关系，为后续自动扣减库存打基础
- **成本核算**：通过食材价格计算菜品成本
- **采购优化**：根据菜品销量预测食材采购需求
- **数据分析**：分析食材使用情况和菜品盈利能力

### 用户角色
- **商家管理员**：在创建或编辑菜品时绑定所需食材

---

## 功能需求

### 1. 后端数据模型扩展

#### 1.1 菜品实体（Dish Entity）
在现有菜品模型基础上，新增`ingredients`字段：

```typescript
@Schema({ timestamps: true })
export class Dish {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  categoryId: string;

  @Prop({ required: false })
  description?: string;

  @Prop({ default: false })
  isDelisted: boolean;

  @Prop({ type: [String], default: [] })
  tags: string[];

  // 新增字段：绑定的库存食材ID数组
  @Prop({ type: [String], default: [] })
  ingredients: string[];
}
```

**字段说明**：
- `ingredients`: 库存食材ID数组（Inventory的_id）
- 默认为空数组，表示未绑定任何食材
- 支持绑定多个食材

#### 1.2 DTO (数据传输对象)

**CreateDishDto / UpdateDishDto**：
```typescript
export class CreateDishDto {
  @ApiProperty({ description: '菜品名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '价格' })
  @IsNumber()
  price: number;

  @ApiProperty({ description: '分类ID' })
  @IsString()
  categoryId: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '标签数组' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  // 新增字段
  @ApiPropertyOptional({ 
    description: '绑定的库存食材ID数组',
    type: [String],
    example: ['507f1f77bcf86cd799439011', '507f191e810c19729de860ea']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ingredients?: string[];
}
```

### 2. 后端API

#### 2.1 创建菜品（POST /dish）

**请求示例**：
```json
{
  "name": "宫保鸡丁",
  "price": 38,
  "categoryId": "65a1b2c3d4e5f678901234a",
  "description": "经典川菜",
  "tags": ["招牌菜", "微辣"],
  "ingredients": [
    "507f1f77bcf86cd799439011",  // 鸡肉
    "507f191e810c19729de860ea"   // 花生
  ]
}
```

**返回示例**：
```json
{
  "_id": "65a1b2c3d4e5f6789012345",
  "name": "宫保鸡丁",
  "price": 38,
  "categoryId": "65a1b2c3d4e5f678901234a",
  "description": "经典川菜",
  "tags": ["招牌菜", "微辣"],
  "ingredients": [
    "507f1f77bcf86cd799439011",
    "507f191e810c19729de860ea"
  ],
  "isDelisted": false,
  "createdAt": "2026-01-30T10:00:00.000Z",
  "updatedAt": "2026-01-30T10:00:00.000Z"
}
```

#### 2.2 更新菜品（PUT /dish/:id）

**请求示例**：
```json
{
  "name": "宫保鸡丁",
  "price": 42,
  "description": "经典川菜，口味升级",
  "ingredients": [
    "507f1f77bcf86cd799439011",
    "507f191e810c19729de860ea",
    "507f191e810c19729de860eb"   // 新增一个食材
  ]
}
```

#### 2.3 查询菜品（GET /dish 或 GET /dish/:id）

返回的菜品数据应包含`ingredients`字段。

**业务规则**：
- `ingredients`字段为可选项，可以为空数组
- 食材ID必须是有效的MongoDB ObjectId格式
- 允许绑定不存在的食材ID（不做强校验），便于灵活使用
- 同一个食材可以被多个菜品绑定

### 3. 前端表单扩展

#### 3.1 DishFormPopup组件修改

在现有的菜品表单中，添加"食材绑定"字段：

**新增状态**：
```javascript
const [ingredients, setIngredients] = useState([]); // 已绑定的食材ID数组
const [availableIngredients, setAvailableIngredients] = useState([]); // 可选的库存食材列表
```

**表单字段**：
```jsx
<Form.Item
  name="ingredients"
  label="绑定食材"
  help="选择制作此菜品所需的库存食材"
>
  <Selector
    multiple
    columns={2}
    options={availableIngredients.map(item => ({
      label: item.productName,
      value: item._id,
      description: `库存: ${item.quantity}`
    }))}
  />
</Form.Item>
```

**UI设计**：
- 使用antd-mobile的`Selector`组件，设置`multiple`属性实现多选
- 显示食材名称和当前库存数量
- 已选中的食材高亮显示
- 支持搜索或筛选（可选）

#### 3.2 数据获取

**在表单打开时**：
```javascript
useEffect(() => {
  // 获取可用的库存食材列表
  const fetchIngredients = async () => {
    try {
      const data = await inventoryApi.getInventoryList();
      setAvailableIngredients(data || []);
    } catch (error) {
      console.error('获取库存食材失败:', error);
    }
  };
  
  fetchIngredients();
}, []);
```

**编辑模式预填充**：
```javascript
useEffect(() => {
  if (editMode && initialValues.ingredients) {
    form.setFieldsValue({
      ingredients: initialValues.ingredients
    });
  }
}, [editMode, initialValues]);
```

#### 3.3 数据提交

在`handleSubmit`中，确保提交的数据包含`ingredients`字段：

```javascript
const handleSubmit = async (values) => {
  try {
    const dishData = {
      name: values.name,
      price: parseFloat(values.price),
      categoryId: values.categoryId,
      description: values.description,
      tags: values.tags || [],
      ingredients: values.ingredients || []  // 新增
    };

    if (editingDish) {
      await dishApi.updateDish(editingDish._id, dishData);
    } else {
      await dishApi.createDish(dishData);
    }
    
    // ... 其他逻辑
  } catch (error) {
    console.error('操作失败:', error);
  }
};
```

### 4. 前端展示

#### 4.1 菜品列表展示（可选）

在菜品列表中，可以展示已绑定的食材数量：

```jsx
<List.Item
  description={
    <div>
      {dish.description}
      {dish.ingredients && dish.ingredients.length > 0 && (
        <Tag color="primary" style={{ marginTop: 4 }}>
          {dish.ingredients.length}种食材
        </Tag>
      )}
    </div>
  }
>
  {dish.name}
</List.Item>
```

#### 4.2 菜品详情展示（未来扩展）

在菜品详情页面，可以展示具体绑定的食材列表。

---

## 非功能需求

### 1. 性能要求
- 库存食材列表查询响应时间 < 500ms
- 支持至少1000个库存食材的选择

### 2. 兼容性
- 向后兼容：已有菜品的`ingredients`字段默认为空数组
- 可选字段：不绑定食材不影响菜品的正常使用

### 3. 错误处理
- 库存食材列表加载失败时，显示友好提示，但不阻塞表单提交
- 提交时如果食材ID格式不正确，后端返回明确的错误信息

### 4. 用户体验
- 表单加载时显示loading状态
- 多选时有明确的选中反馈
- 已选食材可以快速取消选择

---

## 数据库变更

### Migration说明

由于MongoDB的灵活性，无需执行数据迁移脚本。新增的`ingredients`字段会在更新文档时自动添加。

**建议操作**（可选）：
```javascript
// 为已有菜品添加ingredients字段（设置为空数组）
db.dishes.updateMany(
  { ingredients: { $exists: false } },
  { $set: { ingredients: [] } }
);
```

---

## 实施计划

### 阶段一：后端实现
1. 修改Dish实体，添加`ingredients`字段
2. 更新DTO，添加字段验证
3. 测试API接口（创建、更新、查询）

### 阶段二：前端实现
1. 修改DishFormPopup组件，添加食材选择器
2. 集成库存API，获取可选食材列表
3. 实现多选功能和数据绑定
4. 测试新增和编辑场景

### 阶段三：测试验证
1. 单元测试：验证数据格式和校验逻辑
2. 集成测试：验证前后端数据交互
3. 用户测试：验证操作流程和用户体验

---

## 风险与依赖

### 依赖项
- 库存管理模块（Inventory）必须已实现
- 库存API可用：`GET /inventory`

### 风险点
1. **数据一致性**：食材被删除后，菜品中的关联ID可能失效
   - **缓解措施**：后续实现软删除和数据清理机制
   
2. **性能问题**：如果库存食材数量过多，选择器加载可能变慢
   - **缓解措施**：实现分页或搜索功能

3. **用户误操作**：可能选择错误的食材
   - **缓解措施**：提供明确的预览和确认机制

---

## 未来扩展

### 第一期（当前）
- ✓ 基础的食材绑定功能
- ✓ 多选食材

### 第二期（计划）
- 为每个食材设置用量（如：鸡肉500g，花生100g）
- 根据菜品销量自动预警食材库存不足
- 根据食材价格计算菜品成本

### 第三期（规划）
- 菜品制作时自动扣减食材库存
- 食材成本分析报表
- 菜品盈利能力分析

---

## 相关文档

- [菜品管理后端文档](./dish-backend.md)
- [菜品管理前端文档](./dish-inventory-frontend.md)
- [库存管理需求文档](../inventory/inventory.md)
- [后端代码规范](.github/skills/bankend/SKILL.md)
- [前端代码规范](.github/skills/fontend/SKILL.md)

---

## 更新日志

| 日期 | 版本 | 变更内容 | 作者 |
|------|------|----------|------|
| 2026-01-30 | v1.0 | 初始版本，定义菜品绑定食材功能需求 | AI Assistant |
