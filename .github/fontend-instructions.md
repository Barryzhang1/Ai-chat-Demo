
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

- ✅ React Router integrated
- ✅ Current route entry: `/` renders the Chat page component
- ℹ️ `src/pages/Home/Home.js` exists but is not wired to routing yet

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
│   ├── pages/
│   │   ├── Home/
│   │   │   ├── Home.js          # Home page (currently not enabled)
│   │   │   └── Home.css
│   │   └── Chat/
│   │       ├── Chat.js          # Chat page
│   │       └── Chat.css
│   ├── App.js                  # Root: Router + antd-mobile ConfigProvider
│   ├── App.css
│   ├── index.js                # Entry
│   └── index.css
├── webpack.config.js           # webpack config
├── package.json                # scripts/dependencies
└── README.md
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
2. **Page organization**: Keep pages in `src/pages/`; add reusable components under `src/components/`
3. **Styling**: Current setup uses CSS/LESS loaders; keep styles split by feature/page with clear naming
4. **Routing**: Maintain routes centrally in `src/App.js`; add a Route when introducing a new page
5. **API layer**: When integrating backend APIs, encapsulate them under `src/api/` instead of scattering calls across pages

## 🔧 Key Configuration

### webpack-dev-server

- Port: 3000
- `hot: true` enables HMR
- `historyApiFallback: true` supports SPA routing

### Babel

- `@babel/preset-env`
- `@babel/preset-react`

## 📚 Next Steps

1. **Backend integration**
	- Connect to ChatBackEnd via REST and/or WebSocket
	- Model messages and conversations (message/conversation/user)
2. **State management**
	- Simple cases: React Context
	- Complex cases: Zustand / Redux Toolkit
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

