# 菜品自动下架功能测试用例

## 功能描述
当管理员在菜品中手动绑定数量为0的食材时，系统应自动将该菜品下架（设置 `isDelisted = true`）。

---

## 测试用例

### 测试用例 1：更新菜品绑定单个数量为0的食材
**测试目标**：验证当绑定单个数量为0的食材时，菜品自动下架

**前置条件**：
- 存在菜品：`宫保鸡丁`（ID: `dish001`），当前状态 `isDelisted: false`（已上架）
- 存在食材：`鸡肉`（ID: `ingredient001`），库存 `quantity: 0`

**测试步骤**：
1. 发送 PUT 请求到 `/dish/dish001`
2. 请求体包含：
```json
{
  "ingredients": ["ingredient001"]
}
```

**预期结果**：
- 响应状态码：200
- 返回的菜品对象：
  - `ingredients` 包含 `["ingredient001"]`
  - `isDelisted` 自动设置为 `true`
- 系统消息：提示"检测到食材库存不足，菜品已自动下架"

---

### 测试用例 2：更新菜品绑定多个食材，其中部分数量为0
**测试目标**：验证当绑定的食材中有任何一个数量为0时，菜品自动下架

**前置条件**：
- 存在菜品：`鱼香肉丝`（ID: `dish002`），当前状态 `isDelisted: false`
- 存在食材：
  - `猪肉`（ID: `ingredient002`），库存 `quantity: 10`
  - `黑木耳`（ID: `ingredient003`），库存 `quantity: 0`
  - `青椒`（ID: `ingredient004`），库存 `quantity: 5`

**测试步骤**：
1. 发送 PUT 请求到 `/dish/dish002`
2. 请求体包含：
```json
{
  "ingredients": ["ingredient002", "ingredient003", "ingredient004"]
}
```

**预期结果**：
- 响应状态码：200
- 返回的菜品对象：
  - `ingredients` 包含所有三个食材ID
  - `isDelisted` 自动设置为 `true`
- 系统消息：提示"黑木耳食材库存为0，菜品已自动下架"

---

### 测试用例 3：更新菜品绑定的所有食材库存都充足
**测试目标**：验证当所有绑定食材库存都大于0时，菜品保持原状态

**前置条件**：
- 存在菜品：`麻婆豆腐`（ID: `dish003`），当前状态 `isDelisted: false`
- 存在食材：
  - `豆腐`（ID: `ingredient005`），库存 `quantity: 20`
  - `猪肉`（ID: `ingredient006`），库存 `quantity: 15`

**测试步骤**：
1. 发送 PUT 请求到 `/dish/dish003`
2. 请求体包含：
```json
{
  "ingredients": ["ingredient005", "ingredient006"]
}
```

**预期结果**：
- 响应状态码：200
- 返回的菜品对象：
  - `ingredients` 包含两个食材ID
  - `isDelisted` 保持 `false`（不自动下架）

---

### 测试用例 4：更新菜品清空食材绑定
**测试目标**：验证清空食材绑定时，菜品状态不受影响

**前置条件**：
- 存在菜品：`红烧肉`（ID: `dish004`），当前状态 `isDelisted: false`，已绑定食材

**测试步骤**：
1. 发送 PUT 请求到 `/dish/dish004`
2. 请求体包含：
```json
{
  "ingredients": []
}
```

**预期结果**：
- 响应状态码：200
- 返回的菜品对象：
  - `ingredients` 为空数组 `[]`
  - `isDelisted` 保持 `false`

---

### 测试用例 5：更新已下架菜品绑定数量为0的食材
**测试目标**：验证已下架菜品绑定数量为0的食材时，保持下架状态

**前置条件**：
- 存在菜品：`糖醋排骨`（ID: `dish005`），当前状态 `isDelisted: true`（已下架）
- 存在食材：`排骨`（ID: `ingredient007`），库存 `quantity: 0`

**测试步骤**：
1. 发送 PUT 请求到 `/dish/dish005`
2. 请求体包含：
```json
{
  "ingredients": ["ingredient007"]
}
```

**预期结果**：
- 响应状态码：200
- 返回的菜品对象：
  - `ingredients` 包含 `["ingredient007"]`
  - `isDelisted` 保持 `true`

---

### 测试用例 6：更新菜品时绑定不存在的食材ID
**测试目标**：验证绑定不存在的食材时的异常处理

**前置条件**：
- 存在菜品：`东坡肉`（ID: `dish006`），当前状态 `isDelisted: false`
- 不存在食材ID: `nonexistent_ingredient`

**测试步骤**：
1. 发送 PUT 请求到 `/dish/dish006`
2. 请求体包含：
```json
{
  "ingredients": ["nonexistent_ingredient"]
}
```

**预期结果**：
- 响应状态码：400 或 404
- 错误消息：提示"食材不存在"或类似信息
- 菜品状态不变

---

### 测试用例 7：更新菜品新增数量为0的食材到已有食材列表
**测试目标**：验证在已有食材基础上新增数量为0的食材时，菜品自动下架

**前置条件**：
- 存在菜品：`酸菜鱼`（ID: `dish007`），当前状态 `isDelisted: false`
- 当前绑定食材：`["ingredient008"]`（库存充足）
- 新增食材：`ingredient009`，库存 `quantity: 0`

**测试步骤**：
1. 发送 PUT 请求到 `/dish/dish007`
2. 请求体包含：
```json
{
  "ingredients": ["ingredient008", "ingredient009"]
}
```

**预期结果**：
- 响应状态码：200
- 返回的菜品对象：
  - `ingredients` 包含两个食材ID
  - `isDelisted` 自动设置为 `true`

---

## 边界测试

### 测试用例 8：更新菜品时不传 ingredients 字段
**测试目标**：验证更新菜品其他字段时，不影响食材绑定和上架状态

**前置条件**：
- 存在菜品：`水煮鱼`（ID: `dish008`），当前状态 `isDelisted: false`，已绑定食材

**测试步骤**：
1. 发送 PUT 请求到 `/dish/dish008`
2. 请求体包含：
```json
{
  "name": "水煮鱼（招牌）",
  "price": 58
}
```

**预期结果**：
- 响应状态码：200
- 返回的菜品对象：
  - `name` 更新为新名称
  - `price` 更新为新价格
  - `ingredients` 保持不变
  - `isDelisted` 保持不变

---

## 注意事项

1. **库存检查时机**：仅在更新 `ingredients` 字段时触发库存检查
2. **自动下架逻辑**：任何一个绑定的食材库存为0，则自动下架
3. **用户提示**：应在响应中明确告知用户哪些食材库存不足导致自动下架
4. **状态保持**：如果菜品已经是下架状态，更新食材绑定不会改变其状态
