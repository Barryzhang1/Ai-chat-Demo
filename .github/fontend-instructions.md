
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
│   │   ├── Home/               # (Legacy - not in use)
│   │   │   ├── Home.js
│   │   │   └── Home.css
│   │   └── Chat/               # (Legacy - not in use)
│   │       ├── Chat.js
│   │       └── Chat.css
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
8. **Component reusability**: ✅ IMPLEMENTED - Shared components in `src/components/` (DishCard, MessageBubble)
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
- ✅ Reusable components (DishCard, MessageBubble)
- ✅ Environment variables configuration
- ✅ Protected routes with authentication check

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
