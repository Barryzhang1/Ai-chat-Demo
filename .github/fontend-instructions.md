
# ChatUI Project Overview

## 📑 Table of Contents

- [ChatUI Project Overview](#chatui-project-overview)
  - [📑 Table of Contents](#-table-of-contents)
  - [✅ Status](#-status)
  - [📦 Project Info](#-project-info)
  - [🎯 Implemented Features](#-implemented-features)
	 - [1. Core Tech Stack](#1-core-tech-stack)
	 - [2. Pages and Routing](#2-pages-and-routing)
	 - [3. Build and DX](#3-build-and-dx)
  - [📁 Project Structure](#-project-structure)
  - [🚀 How to Run](#-how-to-run)
	 - [Development](#development)
	 - [Production Build](#production-build)
  - [📝 Development Guidelines](#-development-guidelines)
  - [🔧 Key Configuration](#-key-configuration)
	 - [webpack-dev-server](#webpack-dev-server)
	 - [Babel](#babel)
  - [📚 Next Steps](#-next-steps)
  - [🚨 Troubleshooting](#-troubleshooting)

## ✅ Status

The ChatUI app is created under the `ChatUI` directory and runs as a mobile-oriented chat UI based on React + antd-mobile + webpack.

## 📦 Project Info

- **Framework**: React 18.2
- **UI library**: antd-mobile 5.34
- **Routing**: react-router-dom 6.8
- **Bundler**: webpack 5
- **Dev server port**: 3000
- **Build output**: dist

## 🎯 Implemented Features

### 1. Core Tech Stack

- ✅ React 18 function components
- ✅ antd-mobile locale configured globally (ConfigProvider + zh-CN)
- ✅ webpack + Babel toolchain

### 2. Pages and Routing

- ✅ React Router integrated with protected routes
- ✅ `/` - Registration page (Register)
- ✅ `/home` - Role selection page (RoleSelect)
- ✅ `/user-order` - User ordering interface
- ✅ `/merchant` - Merchant dashboard
- ✅ Route protection via ProtectedRoute component using localStorage

### 3. Build and DX

- ✅ webpack-dev-server with HMR (`hot: true`)
- ✅ `historyApiFallback` enabled to prevent SPA refresh 404s
- ✅ Static assets (images/fonts) bundled into the `dist` output

## 📁 Project Structure

```text
ChatUI/
├── public/
│   └── index.html              # HTML template
├── src/
│   ├── api/                    # API layer (NEW)
│   │   ├── orderApi.js         # Order-related APIs
│   │   ├── dishApi.js          # Dish-related APIs
│   │   ├── userApi.js          # User-related APIs
│   │   └── index.js            # Unified exports
│   ├── components/             # Reusable components (NEW)
│   │   ├── DishCard/
│   │   │   ├── DishCard.js     # Dish card component
│   │   │   └── DishCard.css
│   │   ├── MessageBubble/
│   │   │   ├── MessageBubble.js # Message bubble component
│   │   │   └── MessageBubble.css
│   │   ├── DishFormPopup.js    # Dish form popup (add/edit dish)
│   │   ├── InventoryLossFormPopup.js # Inventory loss form popup (✨ NEW 2026-02-05)
│   │   └── index.js            # Unified exports
│   ├── config/                 # Configuration (NEW)
│   │   └── index.js            # Environment variables config
│   ├── pages/
│   │   ├── Register/
│   │   │   ├── Register.js     # Registration page
│   │   │   └── Register.css
│   │   ├── RoleSelect/
│   │   │   ├── RoleSelect.js   # Role selection page
│   │   │   └── RoleSelect.css
│   │   ├── UserOrder/
│   │   │   ├── UserOrder.js    # User ordering page
│   │   │   └── UserOrder.css
│   │   ├── MerchantDashboard/
│   │   │   ├── MerchantDashboard.js # Merchant backend
│   │   │   └── MerchantDashboard.css
│   │   └── Home/               # (Legacy - not in use)
│   │       ├── Home.js
│   │       └── Home.css
│   ├── utils/                  # Utility functions (NEW)
│   │   ├── storage.js          # LocalStorage wrapper
│   │   ├── validators.js       # Validation functions
│   │   └── index.js            # Unified exports
│   ├── App.js                  # Root: Router + ConfigProvider + ProtectedRoute
│   ├── App.css
│   ├── index.js                # Entry point
│   └── index.css
├── .env                        # Development environment variables (NEW)
├── .env.production             # Production environment variables (NEW)
├── .env.example                # Environment variables template (NEW)
├── webpack.config.js           # webpack config
└── package.json                # scripts/dependencies
```

## 🚀 How to Run

### Development

```bash
cd ChatUI
npm install
npm start
```

Default URL: `http://localhost:3000`

You can also auto-open the browser:

```bash
cd ChatUI
npm run dev
```

### Production Build

```bash
cd ChatUI
npm run build
```

Build artifacts are emitted to `ChatUI/dist`.

## 📝 Development Guidelines

1. **Component style**: Prefer function components + Hooks
2. **Page organiza✅ IMPLEMENTED - All backend APIs are encapsulated under `src/api/` (orderApi, dishApi, userApi)
6. **Utils**: ✅ IMPLEMENTED - Common utilities in `src/utils/` (storage, validators)
7. **Config**: ✅ IMPLEMENTED - Environment variables managed in `src/config/`
8. **Component reusability**: ✅ IMPLEMENTED - Shared components in `src/components/` (DishCard, MessageBubble, DishFormPopup, InventoryLossFormPopup)
9. **Naming conventions**: 
   - Components: PascalCase (e.g., `DishCard.js`)
   - Utils/APIs: camelCase (e.g., `orderApi.js`)
   - Constants: UPPER_SNAKE_CASE (e.g., `MOCK_ORDERS`)
10. **Code organization**: Use index.js for unified exports in each modulefeature/page with clear naming
4. **Routing**: Maintain routes centrally in `src/App.js`; add a Route when introducing a new page
5. **API layer**: When integrating backend APIs, encapsulate them under `src/api/` instead of scattering calls across pages
6. **Internationalization**: Supports Chinese and English language options


## 🔧 Key Configuration

### webpack-dev-server

- Port: 3000

### Environment Variables

Create `.env` file (copy from `.env.example`):

```bash
NODE_ENV=development
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_NAME=点餐系统
```

Production environment uses `.env.production`:

```bash
NODE_ENV=production
REACT_APP_API_URL=https://api.yourdomain.com/api
REACT_APP_NAME=点餐系统
```

Access in code via `config`:
```javascript
import { config } from './config';
console.log(config.apiUrl); // Gets REACT_APP_API_URL
```
- `hot: true` enables HMR
- `🎯 Current Implementation Status

### Completed Features

4. **API calls failing**
	- Verify `.env` file exists with correct `REACT_APP_API_URL`
	- Check backend server is running on the specified port
	- Verify CORS is configured on backend

5. **Components not found**
	- Check import paths are correct (e.g., `from '../../components'`)
	- Verify `index.js` exports are properly configured

## 📖 Code Structure Patterns

### Component Pattern
```javascript
import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import './ComponentName.css';

const ComponentName = ({ prop1, prop2 }) => {
  const [state, setState] = useState(initialValue);
  
  const handleAction = useCallback(() => {
    // handler logic
  }, [dependencies]);
  
  return (
    <div className="component-name">
      {/* JSX */}
    </div>
  );
};

ComponentName.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number,
};

export default ComponentName;
```

### API Pattern
```javascript
import { config } from '../config';

const API_BASE_URL = config.apiUrl;

export const resourceApi = {
  getAll: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/resource`);
      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  },
};
```

## 🌐 多语言布局最佳实践

### 布局稳定性原则

为确保中英文切换时布局保持稳定，请遵循以下规范：

1. **文本截断策略**
   ```css
   .text-truncate-single {
     white-space: nowrap;
     overflow: hidden;
     text-overflow: ellipsis;
     max-width: 100%;
   }
   
   .text-truncate-multi {
     display: -webkit-box;
     -webkit-line-clamp: 2;
     -webkit-box-orient: vertical;
     overflow: hidden;
     text-overflow: ellipsis;
     word-break: break-word;
   }
   ```

2. **List.Item 组件使用规范**
   - 避免使用 `Space` 组件作为描述区域的根容器，因为它可能影响布局计算
   - 优先使用 `div` + CSS 类进行布局控制
   - 为每行信息设置合理的最小高度，确保不同语言下对齐一致

   ```javascript
   // ✅ 推荐做法
   <List.Item
     className="custom-list-item"
     description={
       <div className="description-container">
         <div className="info-row">{t('label', language)}: {value}</div>
         <div className="time-row">{formatTime(timestamp)}</div>
       </div>
     }
   >
     <div className="item-title">{title}</div>
   </List.Item>
   
   // ❌ 避免
   <List.Item
     description={
       <Space direction="vertical" style={{ width: '100%' }}>
         <div>{t('label', language)}: {value}</div>
       </Space>
     }
   >
   ```

3. **时间格式化统一处理**
   ```javascript
   const formatTime = (dateString) => {
     const date = new Date(dateString);
     if (language === 'en') {
       // 英文格式：MM/dd HH:mm（避免过长）
       return date.toLocaleString('en-US', {
         month: '2-digit',
         day: '2-digit',
         hour: '2-digit',
         minute: '2-digit',
         hour12: false
       }).replace(',', '');
     } else {
       // 中文格式：MM/dd HH:mm
       return date.toLocaleString('zh-CN', {
         month: '2-digit',
         day: '2-digit', 
         hour: '2-digit',
         minute: '2-digit'
       });
     }
   };
   ```

4. **测试验证清单**
   - [ ] 中英文切换后卡片高度保持一致
   - [ ] 超长文本正确显示省略号
   - [ ] 时间格式在两种语言下都不换行
   - [ ] 不同屏幕宽度下布局稳定
   - [ ] 状态标签位置保持对齐

### 示例：库存列表布局修复
参考 `ChatUI/src/pages/InventoryManagement/InventoryList.js` 和对应的CSS文件，这是一个多语言布局稳定性优化的完整示例。

## 🔧 Dialog弹窗国际化规范

### 正确的Dialog.confirm使用方式
```javascript
// ✅ 推荐做法
const result = await Dialog.confirm({
  content: t('confirmMessage', language),
  confirmText: t('confirm', language),
  cancelText: t('cancel', language),
});

if (result) {
  // 确认操作
}
```

### 正确的Dialog.alert使用方式  
```javascript
// ✅ 推荐做法
Dialog.alert({
  title: t('alertTitle', language),
  content: t('alertContent', language),
  confirmText: t('confirm', language),
});
```

### 常见错误示例
```javascript
// ❌ 避免：缺少按钮国际化
Dialog.confirm({
  content: t('message', language), // 只有content国际化，按钮使用默认文本
});

// ❌ 避免：硬编码按钮文本
Dialog.confirm({
  content: t('message', language),
  confirmText: '确认',  // 硬编码中文
  cancelText: '取消',
});

// ❌ 避免：完全硬编码
Dialog.confirm({
  content: '确定要删除吗？',  // 完全硬编码
});
```

### 必要的国际化键值
项目中已包含以下通用键值，直接使用即可：
- `confirm: '确认' / 'Confirm'`
- `cancel: '取消' / 'Cancel'`  
- `delete: '删除' / 'Delete'`
- `submit: '提交' / 'Submit'`

### Dialog弹窗检查清单
在涉及Dialog的功能开发或修改中，必须验证：
- [ ] Dialog.confirm 包含 confirmText 和 cancelText
- [ ] Dialog.alert 包含 confirmText  
- [ ] 所有文本都通过 t() 函数国际化
- [ ] 在中英文环境下测试按钮显示正确
- [ ] 按钮功能正常（确认/取消行为符合预期）

### Utils Pattern
```javascript
// Utility functions with clear names
export const functionName = (param) => {
  // logic
  return result;
};
```
- ✅ User registration flow
- ✅ Role selection (User/Merchant)
- ✅ User ordering system with AI-powered recommendations
- ✅ Merchant dashboard with tabs (Orders, Inventory, Rankings, Reports)
- ✅ Order validation and confirmation
- ✅ Menu refresh and regeneration
- ✅ API layer structure (ready for backend integration)
- ✅ Utility functions (storage, validators)
- ✅ Reusable components (DishCard, MessageBubble, DishFormPopup, InventoryLossFormPopup)
- ✅ Environment variables configuration
- ✅ Protected routes with authentication check
- ✅ **Data Reports** - Real-time revenue and dish ranking display
  - Today's revenue with order count
  - Top 10 dish sales ranking with visual charts
  - API integration with backend reports endpoints
- ✅ **Inventory Management** - Complete stock tracking system
  - Real-time inventory monitoring with alerts
  - Batch operations (add stock, record loss)
  - History tracking with detailed change logs
  - Integration with dish-ingredient binding system
- ✅ **Permission Management** - Role-based access control
  - BOSS/STAFF/USER role management
  - Dynamic role assignment with real-time updates
  - Secure role validation and UI adaptation
- ✅ **Game Leaderboard** - Flappy Bird integration
  - Real-time score display with ranking
  - User achievements and statistics
  - Seamless integration with main application
- ✅ **Revenue Management** - Financial tracking system
  - Revenue statistics with daily/monthly/total views
  - Extra income/expense transaction management
  - Batch transaction creation with validation
  - Comprehensive financial reporting
- ✅ **Internationalization (i18n)** - Multi-language support
  - Complete Chinese/English language switching
  - Revenue management module fully internationalized
  - Layout stability across languages
  - Context-based language persistence
  - Dynamic parameter support in translations

### Mock Data
Currently using mock data for:
- Dishes menu (`MOCK_DISHES` in UserOrder)
- Orders list (`MOCK_ORDERS` in MerchantDashboard)
- Inventory (`MOCK_INVENTORY`)
- Game rankings (`MOCK_RANKINGS`)
- Sales data (`TOP_DISHES`)

## 📚 Next Steps

1. **Backend integration**
	- ✅ API structure ready - just connect to ChatBackEnd endpoints
	- Replace mock data with actual API calls using `orderApi`, `dishApi`, `userApi`
	- Add WebSocket for real-time order updates
2. **State management**
	- Consider React Context for user state
	- Zustand / Redux Toolkit for complex state (orders, cart)
3. **Tooling**
	- ✅ Environment variables configured (.env, .env.production)
	- TODO: Add ESLint + Prettier configuration
	- TODO: Add pre-commit hooks (husky + lint-staged)
4. **Features**
	- Implement game feature (referenced in order flow)
	- Add order history for users
	- Add real-time notifications
5. **TypeScript migration (optional)**
	- Gradually migrate `src/` to TypeScript fo
3. **Tooling**
	- Add ESLint + Prettier (consistent style)
	- Add environment variables (different backend base URLs for dev/prod)
4. **Routing improvements**
	- Wire Home to routing (e.g. `/home`) and add navigation/back behavior
5. **TypeScript migration (optional)**
	- Gradually migrate `src/` to TypeScript for stronger type safety

## 🚨 Troubleshooting

1. **Port already in use**
	- Update `devServer.port` in `ChatUI/webpack.config.js` or stop the conflicting process

2. **Route refresh returns 404**
	- Ensure `historyApiFallback: true` is enabled (it is currently configured)

3. **Blank screen / asset loading issues**
	- Check browser console and network tab
	- Confirm build output is `dist` and devServer static directory points to `dist`
