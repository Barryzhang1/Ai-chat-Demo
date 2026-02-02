# 菜品搜索功能实现文档

## 系统概述

为菜品列表添加搜索功能，支持按菜品名称、分类、标签进行搜索和筛选。该功能覆盖商家库存管理页面和顾客菜单浏览页面。

**实现日期**: 2026-02-02  
**涉及项目**: ChatBackEnd、ChatUI

---

## 功能特性

### 后端功能

#### 1. 搜索参数支持
- ✅ 按关键词搜索（keyword）：匹配菜品名称或描述
- ✅ 按分类ID筛选（categoryId）
- ✅ 按标签筛选（tag）
- ✅ 支持多条件组合查询
- ✅ 不区分大小写的模糊搜索
- ✅ 正则表达式匹配

#### 2. API接口更新
- **端点**: `GET /api/dish`
- **查询参数**:
  - `keyword` (可选): 搜索关键词
  - `categoryId` (可选): 分类ID
  - `tag` (可选): 标签
- **返回**: 符合条件的菜品列表

### 前端功能

#### 1. 商家库存管理页面 (Inventory)
- ✅ 导航栏下方添加搜索框
- ✅ 实时搜索：输入即触发查询
- ✅ 清空功能：一键清除搜索内容
- ✅ 保持分类结构：搜索时保持左侧分类导航
- ✅ 空结果提示

#### 2. 顾客菜单浏览页面 (MenuBrowse)
- ✅ 导航栏下方添加搜索框
- ✅ 实时搜索功能
- ✅ 自动过滤已下架菜品
- ✅ 搜索结果按分类展示
- ✅ 友好的空状态提示

#### 3. 聊天框菜单弹窗 (UserOrder) 🆕 (2026-02-02)
- ✅ 弹窗顶部添加搜索框
- ✅ 实时搜索：输入即触发过滤
- ✅ 搜索菜品名称和描述
- ✅ 保持分类结构展示
- ✅ 库存充足性检查
- ✅ 清空功能

---

## 架构设计

### 技术栈
- **后端**: NestJS + MongoDB + Mongoose
- **前端**: React + Ant Design Mobile
- **HTTP**: RESTful API

### 数据流

```
用户输入关键词
    ↓
前端状态更新 (searchKeyword)
    ↓
触发 useEffect
    ↓
调用 dishApi.getDishes({ keyword })
    ↓
后端接收查询参数
    ↓
MongoDB 正则查询
    ↓
返回筛选结果
    ↓
前端更新菜品列表
```

---

## 技术实现

### 后端实现

#### 1. Controller 层
**文件**: `ChatBackEnd/src/modules/dish/dish.controller.ts`

```typescript
@Get()
@ApiOperation({ summary: '查询所有菜品（支持搜索）' })
@ApiQuery({ name: 'keyword', required: false, description: '搜索关键词（菜品名称）' })
@ApiQuery({ name: 'categoryId', required: false, description: '分类ID' })
@ApiQuery({ name: 'tag', required: false, description: '标签' })
async findAll(
  @Query('keyword') keyword?: string,
  @Query('categoryId') categoryId?: string,
  @Query('tag') tag?: string,
): Promise<Dish[]> {
  return this.dishService.findAll(keyword, categoryId, tag);
}
```

#### 2. Service 层
**文件**: `ChatBackEnd/src/modules/dish/dish.service.ts`

```typescript
async findAll(keyword?: string, categoryId?: string, tag?: string): Promise<Dish[]> {
  const query: any = {};

  // 按关键词搜索（菜品名称或描述）
  if (keyword) {
    query.$or = [
      { name: { $regex: keyword, $options: 'i' } },
      { description: { $regex: keyword, $options: 'i' } },
    ];
  }

  // 按分类ID筛选
  if (categoryId) {
    query.categoryId = categoryId;
  }

  // 按标签筛选
  if (tag) {
    query.tags = tag;
  }

  return this.dishModel.find(query).sort({ createdAt: -1 }).exec();
}
```

**关键技术点**:
- 使用 MongoDB 的 `$regex` 实现模糊搜索
- `$options: 'i'` 实现不区分大小写
- `$or` 操作符支持多字段搜索
- 支持多条件 AND 组合查询

### 前端实现

#### 1. API 封装
**文件**: `ChatUI/src/api/dishApi.js`

```javascript
getDishes: async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.keyword) queryParams.append('keyword', params.keyword);
    if (params.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params.tag) queryParams.append('tag', params.tag);
    
    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/dish${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error('Get dishes error:', error);
    throw error;
  }
}
```

#### 2. Inventory 页面
**文件**: `ChatUI/src/pages/MerchantDashboard/Inventory.js`

**关键代码**:
```javascript
// 状态管理
const [searchKeyword, setSearchKeyword] = useState('');

// 搜索函数
const fetchDishes = async () => {
  try {
    const params = {};
    if (searchKeyword) {
      params.keyword = searchKeyword;
    }
    const dishes = await dishApi.getDishes(params);
    setInventory(dishes);
  } catch (error) {
    console.error('Failed to fetch dishes:', error);
  }
};

// 监听搜索关键词变化
useEffect(() => {
  fetchDishes();
}, [searchKeyword]);

// UI 组件
<SearchBar
  placeholder="搜索菜品名称"
  value={searchKeyword}
  onChange={setSearchKeyword}

#### 4. UserOrder 页面（聊天框菜单弹窗）🆕
**文件**: `ChatUI/src/pages/UserOrder/UserOrder.js`

**关键代码**:
- `ChatUI/src/pages/UserOrder/UserOrder.css` 🆕

```css
/* 搜索栏样式 */
.inventory-search,
.menu-search,
.menu-popup函数支持搜索过滤
const groupDishesByCategory = () => {
  const grouped = {};
  categories.forEach(category => {
    const categoryDishes = allDishes.filter(dish => {
      // 基本过滤
      if (dish.categoryId !== category._id || !hasEnoughIngredients(dish)) {
        return false;
      }
      
      // 搜索过滤
      if (menuSearchKeyword) {
        const keyword = menuSearchKeyword.toLowerCase();
        const nameMatch = dish.name?.toLowerCase().includes(keyword);
        const descMatch = dish.description?.toLowerCase().includes(keyword);
        return nameMatch || descMatch;
      }
      
      return true;
    });
    
    grouped[category._id] = {
      category,
      dishes: categoryDishes
    };
  });
  return grouped;
};

// UI 组件
<div className="menu-popup-search">
  <SearchBar
    placeholder="搜索菜品名称"
    value={menuSearchKeyword}
    onChange={setMenuSearchKeyword}
    onClear={() => setMenuSearchKeyword('')}
  />
</div>
```

**特点**:
- 搜索时同时检查库存充足性
- 实时过滤菜品列表
- 保持分类结构和左侧导航
- 支持清空搜索
  onClear={() => setSearchKeyword('')}
/>
```

#### 3. MenuBrowse 页面
**文件**: `ChatUI/src/pages/MenuBrowse/MenuBrowse.js`

实现逻辑与 Inventory 页面类似，额外增加了已下架菜品的过滤。

#### 4. 样式设计
**文件**: 
- `ChatUI/src/pages/MerchantDashboard/MerchantDashboard.css`
- `ChatUI/src/pages/MenuBrowse/MenuBrowse.css`

```css
/* 搜索栏样式 */
.inventory-search,
.menu-search {
  padding: 8px 12px;
  background-color: var(--color-surface, #ffffff);
  border-bottom: 0.5px solid var(--color-divider, rgba(0, 0, 0, 0.06));
}
```

---

## API 接口文档

### GET /api/dish

获取菜品列表，支持搜索和筛选。

#### 请求参数

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| keyword | string | 否 | 搜索关键词，匹配菜品名称或描述 |
| categoryId | string | 否 | 分类ID，筛选指定分类下的菜品 |
| tag | string | 否 | 标签，筛选包含指定标签的菜品 |

#### 请求示例

```bash
# 获取所有菜品
curl http://localhost:3001/api/dish

# 按关键词搜索
curl "http://localhost:3001/api/dish?keyword=宫保"

# 按分类筛选
curl "http://localhost:3001/api/dish?categoryId=507f191e810c19729de860ea"
#### 方式一：菜单浏览页面
1. **登录顾客账号**
2. **进入菜单浏览页面** (`/menu-browse`)
3. **搜索菜品**:
   - 在搜索框中输入关键词
   - 查看实时过滤的菜品列表
   - 注意：已下架菜品不会显示

#### 方式二：聊天框菜单弹窗 🆕
1. **进入智能点餐页面** (`/order`)
2. **打开菜单弹窗**:
   - 通过AI推荐后点击菜品列表
   - 或点击"继续点单"按钮
3. **使用搜索**:
   - 在弹窗顶部的搜索框中输入关键词
   - 实时过滤菜品列表
   - 只显示库存充足的菜品
   - 支持一键清空搜索

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
    "ingredients": [],
    "createdAt": "2026-01-28T10:30:00.000Z",
    "updatedAt": "2026-01-28T10:30:00.000Z"
  }
]
```

---

## 测试用例

详细测试用例请参考：[菜品搜索功能测试用例](./dish-search.testcase.md)

### 测试覆盖

#### 后端测试
- ✅ 按关键词搜索
- ✅ 按分类ID筛选
- ✅ 按标签筛选
- ✅ 组合查询
- ✅ 空结果处理
- ✅ 不区分大小写
- ✅ 特殊字符处理

####前端 UserOrder 菜单弹窗添加搜索框 🆕
- ✅ 更新 API 文档
- ✅ 编写测试用例
- ✅ 修复语法错误
- ✅ 添加 UserOrder 菜单弹窗搜索功能
- ✅ 实时过滤
- ✅ 空结果提示
- ✅ 响应式交互

---

## 使用指南

### 商家端使用

1. **登录商家账号**
2. **进入菜品库存页面** (`/merchant/inventory`)
3. **使用搜索框**:
   - 在搜索框中输入菜品名称关键词
   - 系统自动过滤并显示匹配的菜品
   - 点击清除按钮可清空搜索
4. **查看结果**: 搜索结果按分类展示

### 顾客端使用

1. **登录顾客账号**
2. **进入菜单浏览页面** (`/menu-browse`)
3. **搜索菜品**:
   - 在搜索框中输入关键词
   - 查看实时过滤的菜品列表
   - 注意：已下架菜品不会显示

---

## 性能优化

### 后端优化
- ✅ MongoDB 索引优化（建议为 `name` 和 `description` 字段添加文本索引）
- ✅ 查询结果按创建时间排序
- ✅ 避免全表扫描

### 前端优化
- ✅ 使用 `useEffect` 进行依赖追踪
- ✅ 避免不必要的重复请求
- ✅ 搜索防抖（可选，未实现）

### 建议改进
- [ ] 添加搜索防抖（debounce）减少API调用
- [ ] 添加搜索历史记录
- [ ] 支持拼音搜索
- [ ] 添加高级筛选（价格区间、多标签）

---

## 已知限制

1. **仅支持中文搜索**: 当前不支持拼音搜索
2. **无容错机制**: 输入错误时无法纠正
3. **无搜索建议**: 未实现自动补全功能
4. **无搜索防抖**: 每次输入都会触发请求

---

## 相关文档

- [菜品后端文档](./dish-backend.md)
- [菜品库存管理前端文档](./dish-inventory-frontend.md)
- [菜品浏览功能文档](./menu-browse.md)
- [测试用例文档](./dish-search.testcase.md)

---

## 更新日志

### 2026-02-02
- ✅ 后端添加搜索参数支持
- ✅ 前端 Inventory 页面添加搜索框
- ✅ 前端 MenuBrowse 页面添加搜索框
- ✅ 更新 API 文档
- ✅ 编写测试用例
- ✅ 修复语法错误

---

## 参考文档

- [backend-code-specifications](../../.github/skills/bankend/SKILL.md)
- [fontend-code-specifications](../../.github/skills/fontend/SKILL.md)
- [backend-instructions](../../.github/backend-instructions.md)
