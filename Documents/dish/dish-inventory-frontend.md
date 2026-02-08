# Inventory (菜品库存管理) 前端完整文档

## 目录

1. [系统概述](#系统概述)
2. [功能特性](#功能特性)
3. [目录结构](#目录结构)
4. [组件架构](#组件架构)
5. [数据流设计](#数据流设计)
6. [API 集成](#api-集成)
7. [前后端交互](#前后端交互)
8. [UI/UX 设计](#uiux-设计)
9. [状态管理](#状态管理)
10. [组件实现细节](#组件实现细节)
11. [样式设计](#样式设计)
12. [用户操作流程](#用户操作流程)
13. [最佳实践](#最佳实践)
14. [故障排查](#故障排查)

---

## 系统概述

Inventory（菜品库存管理）是商家管理后台的核心功能模块，用于管理餐厅的所有菜品信息，包括新增、编辑、上下架等操作。

### 主要功能

- ✅ 按分类浏览菜品
- ✅ 搜索菜品（按名称搜索）
- ✅ 新增菜品
- ✅ 编辑菜品信息
- ✅ 菜品上架/下架
- ✅ 分类联动滚动
- ✅ 实时状态更新

### 技术栈

- **框架**: React 18.x
- **UI 库**: Ant Design Mobile 5.x
- **路由**: React Router v6
- **状态管理**: React Hooks (useState, useEffect, useRef)
- **HTTP 客户端**: Fetch API
- **样式**: CSS Modules

### 访问路径

```
商家端: /merchant/inventory
完整URL: http://localhost:3000/merchant/inventory
```

---

## 功能特性

### 1. 分类导航

- **左侧分类栏**: 显示所有启用的菜品分类
- **联动滚动**: 点击分类自动滚动到对应区域
- **自动高亮**: 滚动时自动高亮当前分类
- **排序**: 按分类的 `sortOrder` 降序排列

### 2. 菜品列表

- **分组展示**: 按分类分组显示菜品
- **详细信息**: 显示菜品名称、价格、描述、属性
- **属性标签**: 🌶️辣、🧅葱、🌿香菜、🧄蒜、⏱️出餐时间
- **实时状态**: 显示菜品上架/下架状态

### 3. 菜品操作

- **新增菜品**: 右上角 ➕ 按钮
- **编辑菜品**: 点击菜品的"编辑"按钮
- **状态切换**: 一键上架/下架
- **表单验证**: 完整的表单验证逻辑
- **食材绑定**: 🆕 支持绑定多个库存食材（2026-01-30新增）
- **国际化支持**: 🆕 新品上架/编辑弹窗文案支持中英文切换（2026-02-09新增）

> **🆕 食材绑定功能 (2026-01-30)**：
> - 在新增/编辑菜品时可以选择多个库存食材
> - 自动加载可用的库存食材列表
> - 显示食材名称和当前库存数量
> - 支持多选，用于后续库存追踪和成本核算
> - 参考文档：[菜品绑定食材功能](../dish-ingredient-binding/dish-ingredient-binding.md)

### 4. 交互体验

- **即时反馈**: Toast 提示操作结果
- **平滑滚动**: 分类切换动画
- **表单弹窗**: 底部弹出式表单
- **空状态处理**: 友好的空数据提示
- **实时搜索**: 搜索框输入即时过滤菜品列表

### 5. 搜索功能 🆕 (2026-02-02)

- **搜索框位置**: 位于导航栏下方
- **搜索范围**: 搜索菜品名称和描述
- **实时过滤**: 输入关键词即时更新列表
- **清空功能**: 支持一键清空搜索关键词
- **分类保持**: 搜索时保持分类结构展示
- **空结果提示**: 搜索无结果时友好提示

---

## 目录结构

```
ChatUI/src/
├── pages/
│   └── MerchantDashboard/
│       ├── Inventory.js              # 主组件
│       └── MerchantDashboard.css     # 样式文件
├── components/
│   └── DishFormPopup.js              # 菜品表单弹窗组件
└── api/
    ├── dishApi.js                    # 菜品API封装
    └── categoryApi.js                # 分类API封装
```

### 文件说明

| 文件 | 职责 | 行数 |
|------|------|------|
| **Inventory.js** | 主容器组件，业务逻辑 | ~325 |
| **DishFormPopup.js** | 表单组件，数据输入 | ~128 |
| **dishApi.js** | API请求封装 | ~74 |
| **categoryApi.js** | 分类API封装 | ~60 |
| **MerchantDashboard.css** | 样式定义 | ~500+ |

---

## 组件架构

### 组件层级关系

```
Inventory (容器组件)
├── NavBar (导航栏)
├── SideBar (左侧分类栏)
├── Content (右侧菜品列表)
│   ├── Divider (分类标题)
│   ├── List (菜品列表)
│   │   └── List.Item (单个菜品)
│   │       ├── description (菜品描述 + 属性)
│   │       └── extra (价格 + 操作按钮)
│   └── Empty (空状态)
└── Popup (表单弹窗)
    └── DishFormPopup (表单组件)
        ├── Form.Item (各个表单字段)
        └── Buttons (操作按钮)
```

### 组件职责划分

#### Inventory.js (主组件)

**职责**:
1. 数据获取和管理
2. 业务逻辑处理
3. 用户交互响应
4. 组件状态管理

**核心状态**:
```javascript
const [inventory, setInventory] = useState([]);       // 菜品列表
const [categories, setCategories] = useState([]);     // 分类列表
const [editingDish, setEditingDish] = useState(null); // 正在编辑的菜品
const [showEditPopup, setShowEditPopup] = useState(false); // 弹窗显示
const [activeKey, setActiveKey] = useState('');       // 当前激活分类
```

**核心方法**:
- `fetchDishes()`: 获取菜品列表
- `fetchCategories()`: 获取分类列表
- `handleStatusChange()`: 处理上下架
- `handleEdit()`: 打开编辑表单
- `handleAdd()`: 打开新增表单
- `handleSubmit()`: 提交表单
- `groupDishesByCategory()`: 按分类分组
- `handleCategoryChange()`: 处理分类切换
- `handleScroll()`: 处理滚动事件

#### DishFormPopup.js (表单组件)

**职责**:
1. 表单字段渲染
2. 表单数据验证
3. 初始值设置

**Props**:
```javascript
{
  form: Form实例,
  categories: 分类列表,
  onFinish: 提交回调,
  onCancel: 取消回调,
  editMode: 是否编辑模式,
  initialValues: 初始值
}
```

---

## 数据流设计

### 数据流向图

```
┌─────────────────┐
│   后端API       │
│  /dish          │
│  /categories    │
└────────┬────────┘
         │
         │ HTTP Request
         ↓
┌─────────────────┐
│   API层         │
│  dishApi.js     │
│  categoryApi.js │
└────────┬────────┘
         │
         │ 返回数据
         ↓
┌─────────────────┐
│  组件状态       │
│  inventory      │
│  categories     │
└────────┬────────┘
         │
         │ 数据处理
         ↓
┌─────────────────┐
│  UI渲染         │
│  List + Form    │
└─────────────────┘
         │
         │ 用户操作
         ↓
┌─────────────────┐
│  事件处理       │
│  handle*()      │
└────────┬────────┘
         │
         │ 更新请求
         ↓
┌─────────────────┐
│   后端API       │
└─────────────────┘
```

### 组件初始化流程

```javascript
useEffect(() => {
  // 1. 组件挂载时获取数据
  fetchDishes();      // 获取所有菜品
  fetchCategories();  // 获取所有分类
}, []);

// 2. 数据获取完成后
fetchCategories() → 
  过滤启用分类 → 
  按sortOrder排序 → 
  设置第一个为默认激活

// 3. 渲染界面
groupDishesByCategory() → 
  按分类ID分组 → 
  渲染分类列表和菜品列表
```

---

## API 集成

### dishApi.js 接口封装

```javascript
import { config } from '../config';

const API_BASE_URL = config.apiUrl;  // http://localhost:3001

export const dishApi = {
  // 1. 获取菜品列表
  getDishes: async () => {
    const response = await fetch(`${API_BASE_URL}/dish`);
    return await response.json();
  },

  // 2. 创建新菜品
  createDish: async (dishData) => {
    const response = await fetch(`${API_BASE_URL}/dish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dishData),
    });
    return await response.json();
  },

  // 3. 更新菜品状态
  updateDishStatus: async (id, statusUpdate) => {
    const response = await fetch(`${API_BASE_URL}/dish/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(statusUpdate),
    });
    return await response.json();
  },

  // 4. 更新菜品信息
  updateDish: async (id, dishData) => {
    const response = await fetch(`${API_BASE_URL}/dish/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dishData),
    });
    return await response.json();
  },
};
```

### categoryApi.js 接口封装

```javascript
export const categoryApi = {
  // 获取所有分类
  getCategories: async () => {
    const response = await fetch(`${API_BASE_URL}/categories`);
    return await response.json();
  },
};
```

---

## 前后端交互

### 交互时序图

#### 1. 页面加载流程

```
前端组件              API层              后端服务
   │                  │                  │
   ├─ useEffect() ───→│                  │
   │                  ├─ GET /dish ────→│
   │                  │←──── dishes[] ──┤
   │←─ setInventory() │                  │
   │                  │                  │
   │                  ├─ GET /categories→│
   │                  │←── categories[] ┤
   │←─ setCategories()│                  │
   │                  │                  │
   ├─ 渲染界面 ───────┤                  │
```

#### 2. 创建菜品流程

```
用户操作              前端组件            后端服务
   │                  │                  │
   ├─ 点击"➕"────→   │                  │
   │                  ├─ showPopup ─────┤
   │                  │                  │
   ├─ 填写表单 ───→   │                  │
   ├─ 点击确认 ───→   │                  │
   │                  ├─ POST /dish ───→│
   │                  │                  ├─ 验证数据
   │                  │                  ├─ 保存到DB
   │                  │←──── 新菜品 ────┤
   │                  ├─ Toast提示 ─────┤
   │                  ├─ fetchDishes()──→│
   │                  │←──── 刷新列表 ──┤
```

#### 3. 更新状态流程

```
用户操作              前端组件            后端服务
   │                  │                  │
   ├─ 点击"下架"──→   │                  │
   │                  ├─ PATCH /dish/:id/status →│
   │                  │  { isDelisted: true }    │
   │                  │                  ├─ 更新状态
   │                  │←──── 更新后的菜品 ────┤
   │                  ├─ 更新本地状态 ───┤
   │                  ├─ Toast提示 ─────┤
```

#### 4. 编辑菜品流程

```
用户操作              前端组件            后端服务
   │                  │                  │
   ├─ 点击"编辑"──→   │                  │
   │                  ├─ setEditingDish()┤
   │                  ├─ showPopup ─────┤
   │                  │ (预填充表单)     │
   │                  │                  │
   ├─ 修改信息 ───→   │                  │
   ├─ 点击确认 ───→   │                  │
   │                  ├─ PUT /dish/:id ─→│
   │                  │  { 更新的字段 }   │
   │                  │                  ├─ 更新数据
   │                  │←──── 更新后菜品 ─┤
   │                  ├─ 更新列表 ───────┤
   │                  ├─ Toast提示 ─────┤
```

### 数据格式示例

#### 请求数据格式

```javascript
// 创建菜品
{
  "name": "宫保鸡丁",
  "price": 38,
  "categoryId": "507f191e810c19729de860ea",
  "description": "麻辣鲜香的经典川菜",
  "isSpicy": true,
  "hasScallions": true,
  "hasCilantro": false,
  "hasGarlic": true,
  "cookingTime": 15
}

// 更新状态
{
  "isDelisted": true
}

// 更新菜品（部分字段）
{
  "price": 42,
  "description": "麻辣鲜香的经典川菜，现已升级配方"
}
```

#### 响应数据格式

```javascript
// 单个菜品
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "宫保鸡丁",
  "price": 38,
  "categoryId": "507f191e810c19729de860ea",
  "description": "麻辣鲜香的经典川菜",
  "isDelisted": false,
  "isSpicy": true,
  "hasScallions": true,
  "hasCilantro": false,
  "hasGarlic": true,
  "cookingTime": 15,
  "tags": ["热菜", "辣", "鸡肉"],
  "createdAt": "2026-01-28T10:30:00.000Z",
  "updatedAt": "2026-01-28T10:30:00.000Z"
}

// 菜品列表
[
  { /* 菜品1 */ },
  { /* 菜品2 */ },
  // ...
]

// 分类列表
[
  {
    "_id": "507f191e810c19729de860ea",
    "name": "热菜",
    "sortOrder": 9,
    "isActive": true,
    "createdAt": "2026-01-28T08:00:00.000Z",
    "updatedAt": "2026-01-28T08:00:00.000Z"
  },
  // ...
]
```

---

## UI/UX 设计

### 布局结构

```
┌────────────────────────────────────────┐
│  ← 菜品库存                         ➕  │  NavBar
├──────┬─────────────────────────────────┤
│ 凉菜 │ ━━━ 凉菜 ━━━                    │
│ ✓热菜│ ┌─────────────────────────┐     │
│ 汤羹 │ │ 宫保鸡丁              ¥38 │     │
│ 主食 │ │ 麻辣鲜香的经典川菜       │     │
│ 小吃 │ │ 🌶️辣 🧅有葱 🧄有蒜 ⏱️15分│     │
│ 甜品 │ │         [编辑] [下架]    │     │
│ 饮品 │ └─────────────────────────┘     │
│ 海鲜 │ ┌─────────────────────────┐     │
│ 素食 │ │ 红烧肉                ¥78 │     │
│特色菜│ │ 肥而不腻，入口即化       │     │
│      │ │ 🧅有葱 ⏱️45分           │     │
│      │ │         [编辑] [上架]    │     │
│      │ └─────────────────────────┘     │
│      │                                 │
│      │ ━━━ 汤羹 ━━━                    │
│      │ ...                             │
└──────┴─────────────────────────────────┘
  SideBar          Content Area
```

### 表单弹窗设计

```
┌────────────────────────────────────────┐
│                                        │
│             编辑菜品 / 新品上架         │
│                                        │
├────────────────────────────────────────┤
│                                        │  ↑
│  菜品名称 *                            │  │
│  ┌──────────────────────────────┐     │  │
│  │ 宫保鸡丁                      │     │  │
│  └──────────────────────────────┘     │  │
│                                        │  │
│  价格 *                                │  │  可滚动
│  ┌──────────────────────────────┐     │  │  区域
│  │ 38                            │     │  │
│  └──────────────────────────────┘     │  │
│                                        │  │
│  分类 *                                │  │
│  ┌────────┬────────┐                  │  │
│  │ 凉菜   │ ✓热菜  │                  │  │
│  └────────┴────────┘                  │  │
│  ...                                   │  ↓
│                                        │
├────────────────────────────────────────┤
│  [取消]           [确认修改]           │  固定底部
└────────────────────────────────────────┘
```

### 颜色方案

```css
/* 主色调 */
--primary-color: #1677ff;      /* 主题蓝 */
--success-color: #52c41a;      /* 成功绿 */
--danger-color: #ff4d4f;       /* 危险红 */
--warning-color: #faad14;      /* 警告黄 */

/* 文字颜色 */
--text-primary: #000000;       /* 主要文字 */
--text-secondary: #666666;     /* 次要文字 */
--text-placeholder: #999999;   /* 占位文字 */

/* 背景颜色 */
--bg-page: #f5f5f5;            /* 页面背景 */
--bg-card: #ffffff;            /* 卡片背景 */
--bg-hover: #f0f0f0;           /* 悬停背景 */

/* 边框颜色 */
--border-color: #e8e8e8;       /* 边框颜色 */
```

### 响应式设计

```css
/* 移动端优化 */
@media (max-width: 768px) {
  .inventory-sidebar {
    width: 80px;  /* 缩小侧边栏 */
  }
  
  .inventory-dishes-content {
    padding: 8px;  /* 减小内边距 */
  }
}
```

---

## 状态管理

### State 详解

#### 1. inventory (菜品列表)

```javascript
const [inventory, setInventory] = useState([]);

// 类型定义
type Dish = {
  _id: string;
  name: string;
  price: number;
  categoryId: string;
  description?: string;
  isDelisted: boolean;
  isSpicy: boolean;
  hasScallions: boolean;
  hasCilantro: boolean;
  hasGarlic: boolean;
  cookingTime: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// 使用场景
- 初始化: fetchDishes() → setInventory(dishes)
- 更新状态: handleStatusChange() → setInventory(更新后的数组)
- 编辑菜品: handleSubmit() → fetchDishes()
```

#### 2. categories (分类列表)

```javascript
const [categories, setCategories] = useState([]);

// 类型定义
type Category = {
  _id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 使用场景
- 初始化: fetchCategories() → 过滤 → 排序 → setCategories()
- 渲染: 侧边栏列表、表单分类选择器
```

#### 3. editingDish (编辑中的菜品)

```javascript
const [editingDish, setEditingDish] = useState(null);

// 状态流转
null → 点击"新增" → 保持null (新增模式)
null → 点击"编辑" → 设置为菜品对象 (编辑模式)
菜品对象 → 提交/取消 → 设置为null
```

#### 4. showEditPopup (弹窗显示)

```javascript
const [showEditPopup, setShowEditPopup] = useState(false);

// 状态流转
false → 点击"新增"/"编辑" → true
true → 提交/取消/点击遮罩 → false
```

#### 5. activeKey (激活的分类)

```javascript
const [activeKey, setActiveKey] = useState('');

// 状态流转
'' → 初始化完成 → 第一个分类的ID
分类ID → 点击分类 → 新的分类ID
分类ID → 滚动内容 → 自动更新为当前分类ID
```

### Refs 详解

#### 1. contentRef (内容区域引用)

```javascript
const contentRef = useRef(null);

// 用途
- 获取滚动位置: contentRef.current.scrollTop
- 控制滚动: contentRef.current.scrollTo()
- 监听滚动事件: onScroll={handleScroll}
```

#### 2. categoryRefs (分类DOM引用)

```javascript
const categoryRefs = useRef({});

// 用途
- 存储每个分类区域的DOM引用
- 结构: { [categoryId]: HTMLElement }
- 用于计算滚动位置和跳转

// 设置引用
ref={el => categoryRefs.current[category._id] = el}

// 使用引用
const element = categoryRefs.current[categoryId];
const offsetTop = element.offsetTop;
```

---

## 组件实现细节

### 核心方法详解

#### 1. fetchDishes() - 获取菜品列表

```javascript
const fetchDishes = async () => {
  try {
    const dishes = await dishApi.getDishes();
    
    // 健壮性处理
    if (Array.isArray(dishes)) {
      setInventory(dishes);
    } else {
      console.warn('API did not return an array');
      setInventory([]);
    }
  } catch (error) {
    console.error('Failed to fetch dishes:', error);
    setInventory([]);  // 错误时确保是数组
  }
};
```

**关键点**:
- ✅ 类型检查: 确保返回的是数组
- ✅ 错误处理: catch捕获异常
- ✅ 默认值: 失败时设置空数组

#### 2. fetchCategories() - 获取分类列表

```javascript
const fetchCategories = async () => {
  try {
    const cats = await categoryApi.getCategories();
    
    // 过滤 + 排序
    const sortedCategories = (cats || [])
      .filter(cat => cat.isActive)              // 只显示启用的
      .sort((a, b) => 
        (b.sortOrder || 0) - (a.sortOrder || 0) // 降序排列
      );
    
    setCategories(sortedCategories);
    
    // 设置默认激活分类
    if (sortedCategories.length > 0 && !activeKey) {
      setActiveKey(sortedCategories[0]._id);
    }
  } catch (error) {
    console.error('Failed to fetch categories:', error);
  }
};
```

**关键点**:
- ✅ 过滤: 只显示isActive=true的分类
- ✅ 排序: 按sortOrder降序（大的在前）
- ✅ 自动激活: 设置第一个为默认激活

#### 3. handleStatusChange() - 状态切换

```javascript
const handleStatusChange = async (dish) => {
  try {
    // 调用API更新状态
    const updatedDish = await dishApi.updateDishStatus(
      dish._id, 
      { isDelisted: !dish.isDelisted }
    );
    
    // 更新本地状态
    setInventory(inventory.map(item => 
      item._id === dish._id ? updatedDish : item
    ));
    
    // 用户反馈
    Toast.show({
      content: `已${!dish.isDelisted ? '下架' : '上架'}`,
      position: 'top',
    });
  } catch (error) {
    console.error('Failed to update dish status:', error);
    Toast.show({
      content: '操作失败',
      position: 'top',
    });
  }
};
```

**关键点**:
- ✅ 乐观更新: 立即更新UI
- ✅ 错误回滚: 失败时显示错误（可以改进为回滚数据）
- ✅ 用户反馈: Toast提示操作结果

#### 4. handleSubmit() - 表单提交

```javascript
const handleSubmit = async (values) => {
  try {
    if (editingDish) {
      // 编辑模式: 更新菜品
      const updatedDish = await dishApi.updateDish(
        editingDish._id, 
        values
      );
      
      // 更新列表中的菜品
      setInventory(inventory.map(item => 
        item._id === editingDish._id ? updatedDish : item
      ));
      
      Toast.show({ 
        icon: 'success', 
        content: '修改成功！' 
      });
    } else {
      // 新增模式: 创建菜品
      await dishApi.createDish(values);
      Toast.show({ 
        icon: 'success', 
        content: '上新成功！' 
      });
      
      // 刷新列表
      fetchDishes();
    }
    
    // 清理状态
    form.resetFields();
    setShowEditPopup(false);
    setEditingDish(null);
  } catch (error) {
    console.error('Operation failed:', error);
    Toast.show({ 
      icon: 'fail', 
      content: '操作失败，请重试' 
    });
  }
};
```

**关键点**:
- ✅ 模式判断: editingDish是否存在
- ✅ 局部更新vs全量刷新: 编辑用map更新，新增用fetchDishes
- ✅ 状态清理: 成功后重置表单和状态

#### 5. groupDishesByCategory() - 分组逻辑

```javascript
const groupDishesByCategory = () => {
  const grouped = {};
  
  // 为每个分类创建空数组
  categories.forEach(category => {
    grouped[category._id] = {
      category,
      dishes: inventory.filter(
        dish => dish.categoryId === category._id
      )
    };
  });
  
  return grouped;
};

// 使用
const groupedDishes = groupDishesByCategory();
const categoryDishes = groupedDishes[category._id]?.dishes || [];
```

**关键点**:
- ✅ 数据结构: { [categoryId]: { category, dishes: [] } }
- ✅ 实时计算: 每次渲染时重新计算
- ✅ 安全访问: 使用?.和||处理空值

#### 6. handleCategoryChange() - 分类切换

```javascript
const handleCategoryChange = (key) => {
  setActiveKey(key);  // 更新激活状态
  
  // 获取目标分类的DOM元素
  const element = categoryRefs.current[key];
  
  if (element && contentRef.current) {
    const container = contentRef.current;
    const offsetTop = element.offsetTop - container.offsetTop - 10;
    
    // 平滑滚动到目标位置
    container.scrollTo({
      top: offsetTop,
      behavior: 'smooth'
    });
  }
};
```

**关键点**:
- ✅ 双向绑定: 更新activeKey + 滚动
- ✅ 位置计算: 考虑容器偏移
- ✅ 平滑动画: behavior: 'smooth'

#### 7. handleScroll() - 滚动监听

```javascript
const handleScroll = () => {
  if (!contentRef.current) return;
  
  const container = contentRef.current;
  const scrollTop = container.scrollTop;
  
  // 从后往前遍历（优先匹配靠下的分类）
  for (let i = categories.length - 1; i >= 0; i--) {
    const category = categories[i];
    const element = categoryRefs.current[category._id];
    
    if (element) {
      const offsetTop = element.offsetTop - container.offsetTop - 100;
      
      // 如果滚动位置大于该分类的位置，则激活
      if (scrollTop >= offsetTop) {
        setActiveKey(category._id);
        break;
      }
    }
  }
};
```

**关键点**:
- ✅ 逆序遍历: 从最后一个分类开始匹配
- ✅ 偏移量: -100px的缓冲区
- ✅ 性能: 避免频繁setState（可以节流优化）

---

## 样式设计

### 核心样式类

#### .inventory-container

```css
.inventory-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}
```

#### .inventory-content

```css
.inventory-content {
  flex: 1;
  display: flex;
  overflow: hidden;  /* 重要：防止整体滚动 */
}
```

#### .inventory-sidebar

```css
.inventory-sidebar {
  width: 100px;
  background-color: #f7f8fa;
  border-right: 1px solid #e8e8e8;
  overflow-y: auto;
}
```

#### .inventory-dishes-content

```css
.inventory-dishes-content {
  flex: 1;
  overflow-y: auto;  /* 重要：内容区域可滚动 */
  padding: 16px;
}
```

#### .inventory-category-section

```css
.inventory-category-section {
  margin-bottom: 24px;
}
```

#### .inventory-dishes-list

```css
.inventory-dishes-list {
  background-color: #ffffff;
  border-radius: 8px;
}
```

### 表单弹窗样式

```css
/* 弹窗容器 */
.dish-form-popup {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* 标题区域 */
.dish-form-title {
  flex-shrink: 0;
  font-size: 18px;
  font-weight: bold;
  padding: 20px;
  text-align: center;
  background-color: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
}

/* 表单区域 */
.dish-form-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

/* 按钮区域 */
.dish-form-footer {
  flex-shrink: 0;
  padding: 16px 20px;
  background-color: #fff;
  display: flex;
  gap: 12px;
}
```

---

## 用户操作流程

### 1. 浏览菜品

```
用户进入页面
    ↓
加载分类和菜品列表
    ↓
展示分类导航 + 菜品列表
    ↓
用户滚动浏览
    ↓
自动高亮当前分类
```

### 2. 切换分类

```
用户点击分类
    ↓
handleCategoryChange()
    ↓
更新activeKey
    ↓
滚动到对应分类区域
    ↓
平滑动画效果
```

### 3. 新增菜品

```
用户点击右上角 ➕
    ↓
打开表单弹窗（新增模式）
    ↓
用户填写表单
    - 菜品名称 *
    - 价格 *
    - 分类 *
    - 描述
    - 属性（辣/葱/香菜/蒜）
    - 出餐时间
    ↓
点击"确认上新"
    ↓
表单验证
    ↓
调用 createDish API
    ↓
刷新菜品列表
    ↓
显示成功提示
    ↓
关闭弹窗
```

### 4. 编辑菜品

```
用户点击菜品的"编辑"
    ↓
打开表单弹窗（编辑模式）
    ↓
预填充当前菜品数据
    ↓
用户修改信息
    ↓
点击"确认修改"
    ↓
调用 updateDish API
    ↓
更新本地列表
    ↓
显示成功提示
    ↓
关闭弹窗
```

### 5. 上下架菜品

```
用户点击"下架"或"上架"
    ↓
调用 updateDishStatus API
    ↓
更新本地状态
    ↓
UI立即反映变化
    ↓
显示操作提示
```

---

## 最佳实践

### 1. 数据获取

```javascript
// ✅ 推荐：健壮的数据获取
const fetchDishes = async () => {
  try {
    const dishes = await dishApi.getDishes();
    if (Array.isArray(dishes)) {
      setInventory(dishes);
    } else {
      setInventory([]);
    }
  } catch (error) {
    console.error('Failed to fetch dishes:', error);
    setInventory([]);
  }
};

// ❌ 不推荐：缺少类型检查和错误处理
const fetchDishes = async () => {
  const dishes = await dishApi.getDishes();
  setInventory(dishes);
};
```

### 2. 状态更新

```javascript
// ✅ 推荐：不可变更新
setInventory(inventory.map(item => 
  item._id === dish._id ? updatedDish : item
));

// ❌ 不推荐：直接修改
const dish = inventory.find(item => item._id === id);
dish.isDelisted = true;
setInventory([...inventory]);
```

### 3. 条件渲染

```javascript
// ✅ 推荐：使用可选链和默认值
const categoryDishes = groupedDishes[category._id]?.dishes || [];

// ❌ 不推荐：可能抛出异常
const categoryDishes = groupedDishes[category._id].dishes;
```

### 4. 事件处理

```javascript
// ✅ 推荐：阻止事件冒泡
<Button
  onClick={(e) => {
    e.stopPropagation();
    handleEdit(item);
  }}
>
  编辑
</Button>

// ❌ 不推荐：可能触发多个事件
<Button onClick={() => handleEdit(item)}>
  编辑
</Button>
```

### 5. 性能优化

```javascript
// ✅ 推荐：使用useCallback缓存函数
const handleScroll = useCallback(() => {
  // 滚动处理逻辑
}, [categories]);

// ✅ 推荐：使用useMemo缓存计算结果
const groupedDishes = useMemo(
  () => groupDishesByCategory(),
  [inventory, categories]
);
```

---

## 故障排查

### 常见问题

#### 1. 菜品列表不显示

**现象**: 页面加载后看不到菜品

**可能原因**:
- API返回的不是数组
- 所有菜品都已下架（但Inventory显示所有菜品，包括下架的）
- categoryId不匹配任何分类

**排查步骤**:
```javascript
// 1. 检查API返回
console.log('Dishes:', await dishApi.getDishes());

// 2. 检查状态
console.log('Inventory state:', inventory);

// 3. 检查分组结果
console.log('Grouped:', groupDishesByCategory());
```

#### 2. 分类滚动不生效

**现象**: 点击分类后没有滚动

**可能原因**:
- categoryRefs没有正确设置
- contentRef没有绑定到滚动容器

**排查步骤**:
```javascript
// 1. 检查ref是否存在
console.log('Content ref:', contentRef.current);
console.log('Category refs:', categoryRefs.current);

// 2. 检查DOM结构
console.log('Element exists:', !!categoryRefs.current[categoryId]);
```

#### 3. 表单提交失败

**现象**: 点击确认后没有反应或报错

**可能原因**:
- 必填字段缺失
- categoryId不存在
- API连接失败

**排查步骤**:
```javascript
// 1. 检查表单值
console.log('Form values:', form.getFieldsValue());

// 2. 检查验证
form.validateFields().then(values => {
  console.log('Valid:', values);
}).catch(errors => {
  console.log('Errors:', errors);
});

// 3. 检查网络请求
// 打开浏览器开发者工具 → Network面板
```

#### 4. 状态更新后UI未刷新

**现象**: 操作成功但列表没有更新

**可能原因**:
- 状态更新逻辑错误
- 引用相同导致React未检测到变化

**解决方案**:
```javascript
// ✅ 创建新数组
setInventory([...inventory.map(item => 
  item._id === dish._id ? updatedDish : item
)]);

// ❌ 直接修改原数组
inventory.forEach(item => {
  if (item._id === dish._id) {
    item.isDelisted = true;
  }
});
setInventory(inventory);  // React不会检测到变化
```

---

## 相关文档

- [Dish 后端 API 文档](./dish-backend.md)
- [Category 模块文档](../category/category-frontend.md)
- [DishFormPopup 组件文档](../../components/DishFormPopup.md)
- [Ant Design Mobile 文档](https://mobile.ant.design/)

---

## 更新日志

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2026-01-28 | 初始版本，完整功能实现 |

---

## 总结

Inventory（菜品库存管理）模块是一个功能完善的前端管理界面，具有以下特点：

### 优点
✅ 完整的CRUD功能
✅ 良好的用户体验
✅ 健壮的错误处理
✅ 清晰的代码结构

### 可优化点
- ⚡ 添加loading状态
- ⚡ 实现搜索功能
- ⚡ 添加批量操作
- ⚡ 实现拖拽排序
- ⚡ 优化滚动性能（节流）
- ⚡ 添加图片上传
- ⚡ 实现数据缓存

---

如有问题或建议，请联系开发团队。
