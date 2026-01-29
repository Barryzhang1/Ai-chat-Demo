# 菜品类别初始化脚本测试用例

## 测试环境

- **数据库**: MongoDB
- **数据库名**: restaurant
- **集合**: categories
- **脚本文件**: 
  - init-categories.sh (本地版)
  - init-categories-docker.sh (Docker版)

## 测试用例

### TC-01: 首次初始化测试
**前置条件**: categories集合为空
**执行步骤**:
1. 清空categories集合: `db.categories.deleteMany({})`
2. 运行脚本: `./init-categories.sh`

**预期结果**:
- ✅ 成功创建10个类别
- ✅ 每个类别包含name、sortOrder、isActive、createdAt、updatedAt字段
- ✅ 所有类别的isActive为true
- ✅ sortOrder按照预期设置（凉菜=10, 特色菜=1）
- ✅ 输出显示"新增: 10 个类别"

**验证命令**:
```javascript
db.categories.countDocuments() // 应该返回 10
db.categories.find().sort({sortOrder: -1}).pretty()
```

---

### TC-02: 重复执行测试（幂等性）
**前置条件**: categories集合已有10个类别
**执行步骤**:
1. 再次运行脚本: `./init-categories.sh`

**预期结果**:
- ✅ 脚本正常执行完成
- ✅ 类别数量保持为10个
- ✅ 没有创建重复数据
- ✅ 输出显示"新增: 0 个类别"或"类别已存在"

**验证命令**:
```javascript
db.categories.countDocuments() // 应该仍然返回 10
db.categories.aggregate([
  {$group: {_id: "$name", count: {$sum: 1}}},
  {$match: {count: {$gt: 1}}}
]) // 应该返回空数组（无重复）
```

---

### TC-03: 更新已存在类别测试
**前置条件**: categories集合已有类别，但sortOrder不同
**执行步骤**:
1. 手动修改一个类别的sortOrder: 
   ```javascript
   db.categories.updateOne({name: "凉菜"}, {$set: {sortOrder: 999}})
   ```
2. 运行脚本: `./init-categories.sh`

**预期结果**:
- ✅ "凉菜"的sortOrder被更新为10
- ✅ updatedAt字段被更新
- ✅ 其他字段保持不变
- ✅ 输出显示"更新: 1 个类别"

**验证命令**:
```javascript
db.categories.findOne({name: "凉菜"}).sortOrder // 应该返回 10
```

---

### TC-04: 数据完整性验证
**前置条件**: 已成功初始化类别
**执行步骤**:
1. 查询所有类别
2. 验证每个类别的字段

**预期结果**:
- ✅ 所有类别都有唯一的name
- ✅ 所有sortOrder值不同（10,9,8,7,6,5,4,3,2,1）
- ✅ 所有isActive为true
- ✅ 所有createdAt和updatedAt都是有效日期
- ✅ 类别名称准确：凉菜、热菜、汤羹、主食、小吃、甜品、饮品、海鲜、素食、特色菜

**验证命令**:
```javascript
// 检查字段完整性
db.categories.find({
  $or: [
    {name: {$exists: false}},
    {sortOrder: {$exists: false}},
    {isActive: {$exists: false}},
    {createdAt: {$exists: false}},
    {updatedAt: {$exists: false}}
  ]
}).count() // 应该返回 0

// 检查name唯一性
db.categories.aggregate([
  {$group: {_id: "$name", count: {$sum: 1}}},
  {$match: {count: {$gt: 1}}}
]) // 应该返回空

// 检查所有类别名称
db.categories.find({}, {name: 1, sortOrder: 1, _id: 0}).sort({sortOrder: -1})
```

---

### TC-05: Docker环境测试
**前置条件**: Docker MongoDB容器正在运行
**执行步骤**:
1. 启动MongoDB容器: `docker-compose -f docker-compose.db.yml up -d`
2. 运行Docker版脚本: `./init-categories-docker.sh`

**预期结果**:
- ✅ 脚本检测到容器运行
- ✅ 成功连接到容器内的MongoDB
- ✅ 成功创建10个类别
- ✅ 输出格式清晰易读

**验证命令**:
```bash
docker exec -it chat-mongodb mongosh -u root -p password --authenticationDatabase admin restaurant --eval "db.categories.countDocuments()"
```

---

### TC-06: 连接失败处理测试
**前置条件**: MongoDB未启动或连接信息错误
**执行步骤**:
1. 停止MongoDB服务
2. 运行脚本: `./init-categories.sh`

**预期结果**:
- ✅ 脚本检测到连接失败
- ✅ 显示错误信息："无法连接到MongoDB"
- ✅ 脚本以非零状态码退出
- ✅ 没有创建任何数据

---

### TC-07: 环境变量自定义测试
**前置条件**: MongoDB运行在非默认端口或使用不同凭据
**执行步骤**:
1. 设置自定义环境变量:
   ```bash
   export MONGO_HOST=localhost
   export MONGO_PORT=27018
   export MONGO_USER=admin
   export MONGO_PASSWORD=secret
   ```
2. 运行脚本: `./init-categories.sh`

**预期结果**:
- ✅ 脚本使用自定义连接参数
- ✅ 连接到指定的MongoDB实例
- ✅ 成功初始化类别

---

### TC-08: 与后端API集成测试
**前置条件**: 后端服务正在运行，已初始化类别
**执行步骤**:
1. 运行初始化脚本
2. 调用后端API获取类别: `curl http://localhost:3001/categories`

**预期结果**:
- ✅ API返回10个类别
- ✅ 类别按sortOrder降序排列
- ✅ 每个类别包含_id字段（MongoDB生成）
- ✅ 数据格式符合API响应规范

**验证命令**:
```bash
curl -s http://localhost:3001/categories | jq '. | length'  # 应该返回 10
curl -s http://localhost:3001/categories | jq '.[0].sortOrder'  # 应该返回 10（凉菜）
```

---

### TC-09: 前端界面验证测试
**前置条件**: 前端和后端服务都在运行，已初始化类别
**执行步骤**:
1. 访问前端界面
2. 进入"商家管理" -> "类别管理"

**预期结果**:
- ✅ 显示10个类别
- ✅ 类别按sortOrder排序显示
- ✅ 所有类别状态显示为"启用"
- ✅ 可以正常编辑和删除类别

---

### TC-10: 性能测试
**前置条件**: 数据库正常运行
**执行步骤**:
1. 记录执行开始时间
2. 运行脚本
3. 记录执行结束时间

**预期结果**:
- ✅ 脚本在5秒内完成执行
- ✅ 数据库操作无阻塞
- ✅ 没有内存泄漏或资源占用异常

---

## 测试数据验证清单

### 类别列表验证
| 类别名称 | sortOrder | isActive | 验证状态 |
|---------|-----------|----------|---------|
| 凉菜 | 10 | true | ⬜ |
| 热菜 | 9 | true | ⬜ |
| 汤羹 | 8 | true | ⬜ |
| 主食 | 7 | true | ⬜ |
| 小吃 | 6 | true | ⬜ |
| 甜品 | 5 | true | ⬜ |
| 饮品 | 4 | true | ⬜ |
| 海鲜 | 3 | true | ⬜ |
| 素食 | 2 | true | ⬜ |
| 特色菜 | 1 | true | ⬜ |

### Schema验证清单
- ⬜ name字段存在且为string类型
- ⬜ sortOrder字段存在且为number类型
- ⬜ isActive字段存在且为boolean类型
- ⬜ createdAt字段存在且为Date类型
- ⬜ updatedAt字段存在且为Date类型
- ⬜ name字段具有唯一性约束
- ⬜ 所有必填字段都有值

---

## 故障场景测试

### 场景1: 部分类别已存在
**情况**: 数据库中已有5个类别，执行脚本
**预期**: 新增5个类别，更新或保持已有5个类别

### 场景2: 类别名称冲突
**情况**: 手动创建了一个同名类别
**预期**: 脚本更新该类别的其他字段，不创建重复

### 场景3: 权限不足
**情况**: MongoDB用户没有写入权限
**预期**: 脚本显示权限错误并退出

### 场景4: 数据库空间不足
**情况**: MongoDB磁盘空间已满
**预期**: 脚本显示存储错误并退出

---

## 测试执行记录

| 测试用例 | 执行日期 | 执行人 | 结果 | 备注 |
|---------|---------|--------|------|------|
| TC-01 | | | | |
| TC-02 | | | | |
| TC-03 | | | | |
| TC-04 | | | | |
| TC-05 | | | | |
| TC-06 | | | | |
| TC-07 | | | | |
| TC-08 | | | | |
| TC-09 | | | | |
| TC-10 | | | | |

---

## 回归测试脚本

```bash
#!/bin/bash
# 自动化回归测试脚本

echo "开始回归测试..."

# 测试1: 清空并初始化
echo "TC-01: 首次初始化测试"
docker exec -i chat-mongodb mongosh -u root -p password --authenticationDatabase admin restaurant --eval "db.categories.deleteMany({})"
./init-categories-docker.sh
COUNT=$(docker exec -i chat-mongodb mongosh -u root -p password --authenticationDatabase admin restaurant --eval "db.categories.countDocuments()" --quiet)
if [ "$COUNT" == "10" ]; then
    echo "✅ TC-01 通过"
else
    echo "❌ TC-01 失败: 期望10个类别，实际${COUNT}个"
fi

# 测试2: 重复执行
echo "TC-02: 幂等性测试"
./init-categories-docker.sh
COUNT=$(docker exec -i chat-mongodb mongosh -u root -p password --authenticationDatabase admin restaurant --eval "db.categories.countDocuments()" --quiet)
if [ "$COUNT" == "10" ]; then
    echo "✅ TC-02 通过"
else
    echo "❌ TC-02 失败: 期望10个类别，实际${COUNT}个"
fi

echo "回归测试完成"
```

---

## 测试总结

**测试覆盖率目标**: 100%
**关键测试点**:
1. ✅ 数据完整性
2. ✅ 幂等性保证
3. ✅ 错误处理
4. ✅ 环境兼容性
5. ✅ 性能要求

**测试工具**:
- mongosh (MongoDB Shell)
- curl (API测试)
- Docker (容器测试)
- jq (JSON处理)
