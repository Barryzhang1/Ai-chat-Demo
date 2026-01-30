# Dish 模块后端完整文档

## 目录

1. [系统概述](#系统概述)
2. [目录结构](#目录结构)
3. [数据模型](#数据模型)
4. [API 接口文档](#api-接口文档)
5. [数据传输对象 (DTO)](#数据传输对象-dto)
6. [业务逻辑](#业务逻辑)
7. [数据库操作](#数据库操作)
8. [使用示例](#使用示例)
9. [错误处理](#错误处理)
10. [最佳实践](#最佳实践)

---

## 系统概述

Dish（菜品）模块是餐厅管理系统的核心模块之一，负责管理餐厅的所有菜品信息，包括菜品的基本信息、分类、价格、属性（辣度、配料）等。

### 主要功能
- ✅ 创建新菜品
- ✅ 查询所有菜品
- ✅ 更新菜品信息
- ✅ 更新菜品上下架状态
- ✅ 菜品分类管理
- ✅ 菜品属性管理（辣度、配料、烹饪时间）

### 技术栈
- **框架**: NestJS 10.x
- **数据库**: MongoDB
- **ODM**: Mongoose
- **验证**: class-validator
- **文档**: Swagger/OpenAPI

---

## 目录结构

```
ChatBackEnd/src/modules/dish/
├── dish.controller.ts          # 控制器：处理HTTP请求
├── dish.service.ts              # 服务层：业务逻辑处理
├── dish.module.ts               # 模块定义：依赖注入配置
├── dto/                         # 数据传输对象
│   ├── create-dish.dto.ts       # 创建菜品DTO
│   ├── update-dish.dto.ts       # 更新菜品DTO
│   └── update-dish-status.dto.ts # 更新状态DTO
└── entities/                    # 实体定义
    └── dish.entity.ts           # 菜品实体和Schema
```

### 文件说明

| 文件 | 职责 | 关键技术 |
|------|------|----------|
| **dish.controller.ts** | HTTP路由处理，请求参数验证，响应格式化 | @Controller, @Post, @Get, @Patch, @Put |
| **dish.service.ts** | 业务逻辑实现，数据库操作封装 | @Injectable, Model操作 |
| **dish.module.ts** | 模块配置，依赖注入 | @Module, MongooseModule |
| **dish.entity.ts** | 数据模型定义，Schema配置 | @Schema, @Prop |
| **create-dish.dto.ts** | 创建菜品的数据验证 | class-validator装饰器 |
| **update-dish.dto.ts** | 更新菜品的数据验证 | 可选字段验证 |
| **update-dish-status.dto.ts** | 状态更新验证 | 布尔值验证 |

---

## 数据模型

### MongoDB Collection: `dishes`

#### Schema Definition

```typescript
@Schema({ timestamps: true })
export class Dish {
  @Prop({ required: true })
  name: string;                    // 菜品名称

  @Prop({ required: true })
  price: number;                   // 菜品价格

  @Prop({ required: true })
  categoryId: string;              // 分类ID（关联categories表）

  @Prop({ required: false })
  description?: string;            // 菜品描述

  @Prop({ default: false })
  isDelisted: boolean;             // 是否下架

  @Prop({ type: [String], default: [] })
  tags: string[];                  // 标签数组

  @Prop({ type: [String], default: [] })
  ingredients: string[];           // 绑定的库存食材ID数组（2026-01-30新增）

  createdAt?: Date;                // 创建时间（自动生成）
  updatedAt?: Date;                // 更新时间（自动更新）
}
```

#### 字段详细说明

| 字段名 | 类型 | 必填 | 默认值 | 说明 | 索引 |
|--------|------|------|--------|------|------|
| `_id` | ObjectId | 是 | 自动生成 | MongoDB主键 | ✅ 主键 |
| `name` | String | 是 | - | 菜品名称，如"宫保鸡丁" | - |
| `price` | Number | 是 | - | 价格（元），如38.00 | - |
| `categoryId` | String | 是 | - | 分类ID，关联categories集合 | 建议添加 |
| `description` | String | 否 | - | 菜品描述，如"麻辣鲜香的经典川菜" | - |
| `isDelisted` | Boolean | 否 | false | 是否下架，true表示已下架 | - |
| `tags` | String[] | 否 | [] | 标签数组，如["热菜","辣","鸡肉"] | - |
| `ingredients` | String[] | 否 | [] | 🆕 绑定的库存食材ID数组，关联inventory集合 | - |
| `createdAt` | Date | - | 自动 | 创建时间 | ✅ 自动 |
| `updatedAt` | Date | - | 自动 | 最后更新时间 | ✅ 自动 |

> **🆕 新增字段说明 (2026-01-30)**：
> - `ingredients`: 用于存储菜品所需的库存食材ID数组
> - 支持绑定多个食材，用于库存追踪和成本核算
> - 可选字段，不影响现有功能
> - 参考文档：[菜品绑定食材功能需求](../dish-ingredient-binding/dish-ingredient-binding.md)

#### 数据示例

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "宫保鸡丁",
  "price": 38,
  "categoryId": "507f191e810c19729de860ea",
  "description": "麻辣鲜香的经典川菜",
  "tags": ["热菜", "辣", "鸡肉", "经典"],
  "ingredients": ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"],
  "createdAt": "2026-01-28T10:30:00.000Z",
  "updatedAt": "2026-01-28T10:30:00.000Z"
}
```

---

## API 接口文档

### 基础信息

- **Base URL**: `http://localhost:3001`
- **API Prefix**: `/dish`
- **Content-Type**: `application/json`

---

### 1. 创建菜品

创建一个新的菜品。

#### 请求

```http
POST /dish
Content-Type: application/json
```

#### 请求体 (CreateDishDto)

```typescript
{
  name: string;              // 必填：菜品名称
  price: number;             // 必填：价格
  categoryId: string;        // 必填：分类ID
  description?: string;      // 可选：描述
  ingredients?: string[];    // 可选：绑定的库存食材ID数组 🆕
  tags?: string[];           // 可选：标签数组
}
```

#### 请求示例

```json
{
  "name": "宫保鸡丁",
  "price": 38,
  "categoryId": "507f191e810c19729de860ea",
  "description": "麻辣鲜香的经典川菜,
  "ingredients": ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"]",
  "tags": ["热菜", "辣", "鸡肉"]
}
```

#### 响应

**成功 (201 Created)**

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "宫保鸡丁",
  "price": 38,
  "categoryId": "507f191e810c19729de860ea",
  "description": "麻辣鲜香的经典川菜",
  "isDelisted": false,
  "ingredients": ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"],
  "tags": ["热菜", "辣", "鸡肉"],
  "createdAt": "2026-01-28T10:30:00.000Z",
  "updatedAt": "2026-01-28T10:30:00.000Z"
}
```

**失败 (400 Bad Request)**

```json
{
  "statusCode": 400,
  "message": [
    "name should not be empty",
    "price must be a number"
  ],
  "error": "Bad Request"
}
```

#### cURL 示例

```bash
curl -X POST http://localhost:3001/dish \
  -H "Content-Type: application/json" \
  -d '{
    "name": "宫保鸡丁",
    "price": 38,
    "categoryId": "507f191e810c19729de860ea",
    "description": "麻辣鲜香的经典川菜",
    "tags": ["热菜", "辣", "鸡肉"]
  }'
```

---

### 2. 查询所有菜品

获取所有菜品列表，按创建时间倒序排列。

#### 请求

```http
GET /dish
```

#### 查询参数

无

#### 响应

**成功 (200 OK)**

```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "宫保鸡丁",
    "price": 38,
    "categoryId": "507f191e810c19729de860ea",
    "description": "麻辣鲜香的经典川菜",
    "isDelisted": false,
    "tags": ["热菜", "辣", "鸡肉"],
    "createdAt": "2026-01-28T10:30:00.000Z",
    "updatedAt": "2026-01-28T10:30:00.000Z"
  },
  {
    "_id": "507f1f77bcf86cd799439012",
    "name": "红烧肉",
    "price": 78,
    "categoryId": "507f191e810c19729de860ea",
    "description": "肥而不腻，入口即化",
    "isDelisted": false,
    "tags": ["热菜", "猪肉"],
    "createdAt": "2026-01-28T09:15:00.000Z",
    "updatedAt": "2026-01-28T09:15:00.000Z"
  }
]
```

#### cURL 示例

```bash
curl http://localhost:3001/dish
```

#### JavaScript 示例

```javascript
const response = await fetch('http://localhost:3001/dish');
const dishes = await response.json();
console.log(dishes);
```

---

### 3. 更新菜品状态（上架/下架）

更新菜品的上下架状态。

#### 请求

```http
PATCH /dish/:id/status
Content-Type: application/json
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | String | 菜品的ObjectId |

#### 请求体 (UpdateDishStatusDto)

```typescript
{
  isDelisted: boolean;  // 必填：true表示下架，false表示上架
}
```

#### 请求示例

```json
{
  "isDelisted": true
}
```

#### 响应

**成功 (200 OK)**

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "宫保鸡丁",
  "price": 38,
  "categoryId": "507f191e810c19729de860ea",
  "description": "麻辣鲜香的经典川菜",
  "isDelisted": true,
  "tags": ["热菜", "辣", "鸡肉"],
  "createdAt": "2026-01-28T10:30:00.000Z",
  "updatedAt": "2026-01-28T11:45:00.000Z"
}
```

**失败 (404 Not Found)**

```json
{
  "statusCode": 404,
  "message": "Dish not found",
  "error": "Not Found"
}
```

#### cURL 示例

```bash
# 下架菜品
curl -X PATCH http://localhost:3001/dish/507f1f77bcf86cd799439011/status \
  -H "Content-Type: application/json" \
  -d '{"isDelisted": true}'

# 上架菜品
curl -X PATCH http://localhost:3001/dish/507f1f77bcf86cd799439011/status \
  -H "Content-Type: application/json" \
  -d '{"isDelisted": false}'
```

---

### 4. 更新菜品信息

更新菜品的详细信息。

#### 请求

```http
PUT /dish/:id
Content-Type: application/json
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | String | 菜品的ObjectId |

#### 请求体 (UpdateDishDto)

```typescript
{
  name?: string;              // 可选：菜品名称
  price?: number;             // 可选：价格
  categoryId?: string;        // 可选：分类ID
  description?: string;       // 可选：描述
  tags?: string[];            // 可选：标签数组
}
```

**注意**: 所有字段都是可选的，只更新提供的字段。

#### 请求示例

```json
{
  "price": 42,
  "description": "麻辣鲜香的经典川菜，现已升级配方",
  "tags": ["热菜", "辣", "鸡肉", "经典"]
}
```

#### 响应

**成功 (200 OK)**

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "宫保鸡丁",
  "price": 42,
  "categoryId": "507f191e810c19729de860ea",
  "description": "麻辣鲜香的经典川菜，现已升级配方",
  "isDelisted": false,
  "tags": ["热菜", "辣", "鸡肉", "经典"],
  "createdAt": "2026-01-28T10:30:00.000Z",
  "updatedAt": "2026-01-28T12:00:00.000Z"
}
```

#### cURL 示例

```bash
curl -X PUT http://localhost:3001/dish/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{
    "price": 42,
    "description": "麻辣鲜香的经典川菜，现已升级配方",
    "tags": ["热菜", "辣", "鸡肉", "经典"]
  }'
```

---

## 数据传输对象 (DTO)

### CreateDishDto

用于创建新菜品的数据验证。

```typescript
export class CreateDishDto {
  @IsString()
  @IsNotEmpty()
  name: string;                    // 必填

  @IsNumber()
  @IsNotEmpty()
  price: number;                   // 必填

  @IsString()
  @IsNotEmpty()
  categoryId: string;              // 必填

  @IsString()
  @IsOptional()
  description?: string;            // 可选

  @IsArray()
  @IsOptional()
  tags?: string[];                 // 可选
}
```

### UpdateDishDto

用于更新菜品信息，所有字段都是可选的。

```typescript
export class UpdateDishDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];
}
```

### UpdateDishStatusDto

专门用于更新菜品状态。

```typescript
export class UpdateDishStatusDto {
  @IsNotEmpty()
  @IsBoolean()
  isDelisted: boolean;             // 必填
}
```

---

## 业务逻辑

### DishService 核心方法

#### 1. create() - 创建菜品

```typescript
async create(createDishDto: CreateDishDto): Promise<Dish> {
  const createdDish = new this.dishModel(createDishDto);
  return createdDish.save();
}
```

**业务规则**:
- 自动设置 `isDelisted` 为 false（默认上架）
- 自动生成 `createdAt` 和 `updatedAt` 时间戳
- 验证 `categoryId` 是否存在（建议添加）

#### 2. findAll() - 查询所有菜品

```typescript
async findAll(): Promise<Dish[]> {
  return this.dishModel.find().sort({ createdAt: -1 }).exec();
}
```

**业务规则**:
- 按创建时间倒序排列（最新的在前）
- 返回所有菜品，包括已下架的
- 前端需自行过滤已下架菜品（如果需要）

#### 3. updateStatus() - 更新状态

```typescript
async updateStatus(
  id: string,
  updateDishStatusDto: UpdateDishStatusDto,
): Promise<Dish> {
  const { isDelisted } = updateDishStatusDto;
  const updatedDish = await this.dishModel.findByIdAndUpdate(
    id,
    { isDelisted },
    { new: true },
  );
  if (!updatedDish) {
    throw new Error('Dish not found');
  }
  return updatedDish;
}
```

**业务规则**:
- 只更新 `isDelisted` 字段
- 自动更新 `updatedAt` 时间戳
- 如果菜品不存在，抛出错误

#### 4. update() - 更新菜品信息

```typescript
async update(id: string, updateDishDto: UpdateDishDto): Promise<Dish> {
  const updatedDish = await this.dishModel.findByIdAndUpdate(
    id,
    updateDishDto,
    { new: true },
  );
  if (!updatedDish) {
    throw new Error('Dish not found');
  }
  return updatedDish;
}
```

**业务规则**:
- 只更新提供的字段
- 未提供的字段保持不变
- 自动更新 `updatedAt` 时间戳
- 如果菜品不存在，抛出错误

---

## 数据库操作

### Mongoose 操作示例

#### 创建索引（建议）

```typescript
// 在 dish.entity.ts 中添加索引
@Schema({ timestamps: true })
export class Dish {
  @Prop({ required: true, index: true })  // 添加索引
  categoryId: string;

  @Prop({ required: true })
  name: string;
  
  // ...其他字段
}
```

#### 查询优化

```typescript
// 查询指定分类的菜品
async findByCategory(categoryId: string): Promise<Dish[]> {
  return this.dishModel
    .find({ categoryId, isDelisted: false })
    .sort({ name: 1 })
    .exec();
}

// 分页查询
async findWithPagination(page: number, limit: number): Promise<Dish[]> {
  const skip = (page - 1) * limit;
  return this.dishModel
    .find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();
}

// 搜索菜品
async search(keyword: string): Promise<Dish[]> {
  return this.dishModel
    .find({
      $or: [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ],
    })
    .exec();
}
```

---

## 使用示例

### Node.js / JavaScript

```javascript
// 1. 创建菜品
async function createDish() {
  const response = await fetch('http://localhost:3001/dish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: '麻婆豆腐',
      price: 28,
      categoryId: '507f191e810c19729de860ea',
      description: '麻辣鲜香',
      tags: ['热菜', '辣', '豆腐']
    })
  });
  const dish = await response.json();
  console.log('创建成功:', dish);
}

// 2. 获取所有菜品
async function getAllDishes() {
  const response = await fetch('http://localhost:3001/dish');
  const dishes = await response.json();
  console.log('菜品列表:', dishes);
}

// 3. 下架菜品
async function delistDish(dishId) {
  const response = await fetch(`http://localhost:3001/dish/${dishId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isDelisted: true })
  });
  const dish = await response.json();
  console.log('下架成功:', dish);
}

// 4. 更新菜品
async function updateDish(dishId) {
  const response = await fetch(`http://localhost:3001/dish/${dishId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      price: 32,
      description: '麻辣鲜香，升级配方'
    })
  });
  const dish = await response.json();
  console.log('更新成功:', dish);
}
```

### Python

```python
import requests
import json

BASE_URL = 'http://localhost:3001/dish'

# 1. 创建菜品
def create_dish():
    data = {
        'name': '麻婆豆腐',
        'price': 28,
        'categoryId': '507f191e810c19729de860ea',
        'description': '麻辣鲜香',
        'tags': ['热菜', '辣', '豆腐']
    }
    response = requests.post(BASE_URL, json=data)
    print('创建成功:', response.json())

# 2. 获取所有菜品
def get_all_dishes():
    response = requests.get(BASE_URL)
    print('菜品列表:', response.json())

# 3. 下架菜品
def delist_dish(dish_id):
    url = f'{BASE_URL}/{dish_id}/status'
    data = {'isDelisted': True}
    response = requests.patch(url, json=data)
    print('下架成功:', response.json())

# 4. 更新菜品
def update_dish(dish_id):
    url = f'{BASE_URL}/{dish_id}'
    data = {
        'price': 32,
        'description': '麻辣鲜香，升级配方'
    }
    response = requests.put(url, json=data)
    print('更新成功:', response.json())
```

---

## 错误处理

### 常见错误码

| 状态码 | 错误类型 | 说明 | 解决方案 |
|--------|---------|------|----------|
| 400 | Bad Request | 请求参数验证失败 | 检查请求体格式和必填字段 |
| 404 | Not Found | 菜品不存在 | 检查菜品ID是否正确 |
| 500 | Internal Server Error | 服务器内部错误 | 查看服务器日志 |

### 错误响应示例

```json
{
  "statusCode": 400,
  "message": [
    "name should not be empty",
    "price must be a number",
    "categoryId should not be empty"
  ],
  "error": "Bad Request"
}
```

### 异常处理建议

```typescript
// 在 Service 中添加更详细的错误处理
async updateStatus(
  id: string,
  updateDishStatusDto: UpdateDishStatusDto,
): Promise<Dish> {
  try {
    const { isDelisted } = updateDishStatusDto;
    const updatedDish = await this.dishModel.findByIdAndUpdate(
      id,
      { isDelisted },
      { new: true },
    );
    
    if (!updatedDish) {
      throw new NotFoundException(`Dish with ID ${id} not found`);
    }
    
    return updatedDish;
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw error;
    }
    throw new InternalServerErrorException('Failed to update dish status');
  }
}
```

---

## 最佳实践

### 1. 数据验证

```typescript
// ✅ 推荐：使用DTO进行严格验证
@Post()
async create(@Body() createDishDto: CreateDishDto): Promise<Dish> {
  return this.dishService.create(createDishDto);
}

// ❌ 不推荐：直接使用any类型
@Post()
async create(@Body() data: any): Promise<Dish> {
  return this.dishService.create(data);
}
```

### 2. 错误处理

```typescript
// ✅ 推荐：使用NestJS内置异常
import { NotFoundException } from '@nestjs/common';

if (!dish) {
  throw new NotFoundException(`Dish with ID ${id} not found`);
}

// ❌ 不推荐：抛出普通Error
if (!dish) {
  throw new Error('Dish not found');
}
```

### 3. 查询优化

```typescript
// ✅ 推荐：添加索引和选择性字段
async findAll(): Promise<Dish[]> {
  return this.dishModel
    .find()
    .select('-__v')  // 排除版本字段
    .sort({ createdAt: -1 })
    .lean()  // 返回普通JavaScript对象
    .exec();
}
```

### 4. 分类关联验证

```typescript
// ✅ 推荐：验证分类是否存在
async create(createDishDto: CreateDishDto): Promise<Dish> {
  // 验证分类存在
  const category = await this.categoryModel.findById(createDishDto.categoryId);
  if (!category) {
    throw new BadRequestException('Category not found');
  }
  
  const createdDish = new this.dishModel(createDishDto);
  return createdDish.save();
}
```

### 5. 软删除 vs 硬删除

```typescript
// ✅ 当前实现：软删除（通过isDelisted标记）
// 优点：数据可恢复，保留历史记录
async updateStatus(id: string, dto: UpdateDishStatusDto): Promise<Dish> {
  return this.dishModel.findByIdAndUpdate(
    id,
    { isDelisted: dto.isDelisted },
    { new: true }
  );
}

// ❌ 硬删除（不推荐用于菜品）
async delete(id: string): Promise<void> {
  await this.dishModel.findByIdAndDelete(id);
}
```

---

## 性能优化建议

### 1. 数据库索引

```typescript
// 在 dish.entity.ts 中添加
@Schema({ 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})
export class Dish {
  @Prop({ required: true, index: true })
  categoryId: string;
  
  @Prop({ required: true, text: true })  // 文本索引用于搜索
  name: string;
}
```

### 2. 缓存策略

```typescript
// 使用Redis缓存热门菜品
import { CACHE_MANAGER, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class DishService {
  constructor(
    @InjectModel(Dish.name) private dishModel: Model<DishDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findAll(): Promise<Dish[]> {
    const cacheKey = 'all_dishes';
    const cached = await this.cacheManager.get<Dish[]>(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const dishes = await this.dishModel.find().exec();
    await this.cacheManager.set(cacheKey, dishes, 300); // 缓存5分钟
    return dishes;
  }
}
```

### 3. 分页实现

```typescript
// 添加分页接口
@Get()
async findAll(
  @Query('page') page: number = 1,
  @Query('limit') limit: number = 20,
): Promise<{ data: Dish[]; total: number; page: number }> {
  const dishes = await this.dishService.findWithPagination(page, limit);
  const total = await this.dishService.count();
  
  return {
    data: dishes,
    total,
    page: Number(page),
  };
}
```

---

## 安全考虑

### 1. 输入验证

所有用户输入都通过DTO进行严格验证，防止注入攻击。

### 2. 权限控制（建议添加）

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('dish')
@UseGuards(JwtAuthGuard)  // 需要登录才能访问
export class DishController {
  // ...
}
```

### 3. 数据脱敏

```typescript
// 不要在响应中暴露敏感信息
@Schema({ 
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      delete ret.__v;  // 删除版本字段
      return ret;
    }
  }
})
export class Dish {
  // ...
}
```

---

## 相关文档

- [Category 模块文档](../category/category-backend.md)
- [Inventory 前端文档](./dish-inventory-frontend.md)
- [API 测试用例](./dish-api.testcase.md)
- [数据库设计文档](../database-design.md)

---

## 更新日志

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2026-01-28 | 初始版本，包含基础CRUD功能 |

---

## 联系方式

如有问题或建议，请联系开发团队。
