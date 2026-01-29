# 菜品浏览功能实现文档

## 功能概述

实现了一个全新的菜品浏览页面，用户可以通过左侧分类导航快速查看不同分类的菜品，所有数据从后端API动态加载。

## 实现日期

2026-01-26

## 功能特性

### 1. 左侧分类导航栏（SideBar）

- **分类排序**：按照 `sortOrder` 权重倒序排列（权重越大越靠前）
- **仅显示启用分类**：过滤 `isActive: false` 的分类
- **高亮当前分类**：使用系统蓝色标识当前查看的分类
- **点击跳转**：点击分类名称自动滚动到对应菜品区域

### 2. 右侧菜品列表

- **按分类分组**：菜品按照分类进行分组显示
- **分类分割线**：每个分类开头使用 Divider 组件展示分类名称
- **菜品卡片**：
  - 显示菜品名称、描述、价格
  - 显示菜品标签（辣🌶️、葱🧅、香菜🌿、蒜🧄）
  - 采用iOS简洁风格卡片设计
- **自动过滤**：不显示已下架的菜品（`isDelisted: true`）

### 3. 交互功能

- **滚动联动**：
  - 滚动右侧菜品列表时，左侧分类自动高亮当前可见的分类
  - 点击左侧分类时，右侧平滑滚动到对应位置
- **iOS 风格动画**：使用 120ms 的快速过渡效果
- **支持 Reduced Motion**：为动作敏感用户提供无动画版本

## 文件结构

```
ChatUI/src/pages/MenuBrowse/
├── MenuBrowse.js      # 菜品浏览页面主组件
└── MenuBrowse.css     # 页面样式文件
```

## 路由配置

- **路径**：`/menu-browse`
- **保护**：使用 `ProtectedRoute` 包裹，需要登录后访问
- **导航入口**：在角色选择页面（RoleSelect）添加"浏览菜单"卡片

## API 依赖

### categoryApi.getCategories()
获取所有分类列表

**响应格式**：
```json
[
  {
    "_id": "分类ID",
    "name": "分类名称",
    "sortOrder": 10,
    "isActive": true
  }
]
```

### dishApi.getDishes()
获取所有菜品列表

**响应格式**：
```json
[
  {
    "_id": "菜品ID",
    "name": "菜品名称",
    "price": 38,
    "categoryId": "分类ID",
    "description": "菜品描述",
    "isDelisted": false,
    "isSpicy": true,
    "hasScallions": true,
    "hasCilantro": false,
    "hasGarlic": true
  }
]
```

## 设计规范遵循

### 颜色系统
- 主色调：iOS System Blue `#007AFF`
- 使用全局 CSS 变量（定义在 App.css）
- 卡片阴影：`--shadow-1` 和 `--shadow-2`

### 布局规范
- 左侧分类栏固定宽度：90px（小屏幕 80px）
- 右侧内容区域自适应
- 支持 iOS Safe Area（刘海屏和底部 Home Bar）

### 动效规范
- 过渡时间：120ms（`--t-fast`）
- 滚动行为：smooth
- 支持 `prefers-reduced-motion`

## 用户流程

1. 用户在角色选择页面点击"浏览菜单"
2. 进入菜品浏览页面
3. 左侧显示所有启用的分类（按权重排序）
4. 右侧显示所有菜品（按分类和权重分组）
5. 用户可以：
   - 点击左侧分类快速跳转
   - 滚动右侧列表浏览所有菜品
   - 查看每道菜品的详细信息和标签

## 数据流

```
MenuBrowse 组件初始化
    ↓
并行请求 categories 和 dishes
    ↓
过滤和排序数据
    ├─ 分类：按 sortOrder 降序
    └─ 菜品：过滤已下架
    ↓
按 categoryId 分组菜品
    ↓
渲染 SideBar 和菜品列表
    ↓
用户交互
    ├─ 点击分类 → 滚动到对应位置
    └─ 滚动列表 → 更新高亮分类
```

## 性能优化

1. **并行请求**：使用 `Promise.all` 同时获取分类和菜品数据
2. **引用缓存**：使用 `useRef` 缓存 DOM 元素引用，避免重复查询
3. **条件渲染**：空分类不渲染菜品列表
4. **懒加载就绪**：代码结构支持未来添加虚拟滚动

## 未来扩展

- [ ] 添加菜品搜索功能
- [ ] 支持菜品收藏
- [ ] 添加到购物车功能
- [ ] 菜品详情弹窗
- [ ] 图片懒加载
- [ ] 虚拟滚动优化长列表性能

## 测试建议

### 功能测试
- ✅ 分类按权重正确排序
- ✅ 菜品按分类正确分组
- ✅ 点击分类能跳转到对应位置
- ✅ 滚动列表时左侧高亮正确
- ✅ 已下架菜品不显示

### 兼容性测试
- ✅ iOS Safari
- ✅ Android Chrome
- ✅ 不同屏幕尺寸（320px - 428px）
- ✅ 刘海屏适配

### 边界情况
- ✅ 无分类时的空状态
- ✅ 分类下无菜品的空状态
- ✅ API 请求失败的错误处理
- ✅ 网络缓慢时的加载状态

## 相关文件

- `/ChatUI/src/pages/MenuBrowse/MenuBrowse.js`
- `/ChatUI/src/pages/MenuBrowse/MenuBrowse.css`
- `/ChatUI/src/App.js` - 路由配置
- `/ChatUI/src/pages/RoleSelect/RoleSelect.js` - 入口添加
- `/ChatUI/src/pages/RoleSelect/RoleSelect.css` - 入口样式
- `/ChatUI/src/App.css` - 全局 CSS 变量
