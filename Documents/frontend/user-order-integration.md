# 用户点餐界面前后端对接文档

## 系统概述
本文档描述了 ChatUI 项目中的 `UserOrder` 模块如何对接后端 API，实现用户智能点餐、查看历史、确认订单等功能。

## 功能特性
1. **历史记录加载**: 页面初始化时从后端拉取历史聊天记录。
2. **AI 智能对话**: 将用户输入发送给 AI，获取推荐菜品。
3. **菜单渲染**: 解析 AI 返回的推荐菜品数据，动态展示菜单卡片。
4. **订单创建**: 将选定的菜品提交给后端创建正式订单。
5. **菜单刷新**: 支持清空上下文或请求重新推荐。

## 技术实现

### 修改文件
- `ChatUI/src/pages/UserOrder/UserOrder.js`

### API 接口对接
模块复用了 `orderApi` (封装在 `ChatUI/src/api/orderApi.js`)。

- `getChatHistory()`: 获取历史记录并转换为 UI 所需格式。
- `aiOrder(message)`: 发送用户需求，接收 `reply` (文本) 和 `dishes` (菜品列表)。
- `createOrder({ items })`: 提交包含 `dishId` 和 `quantity` 的数组创建订单。
- `refreshMenu()`: 刷新上下文。

### 数据流转换
前端 UI 组件原本使用 `menu` 属性来渲染卡片列表，后端返回的是 `dishes` 数组。
对接层做了如下映射：
```javascript
// 后端 API -> 前端 State
dishes: [{ _id, name, price, description, imageUrl, isSpicy }] 
-> 
currentMenu: [{ id: _id,  name, price, description, image: imageUrl,  isSpicy, quantity: 1 }]
```

## 测试说明
1. **加载测试**: 进入页面，确认是否显示历史对话（如果有）。
2. **对话测试**: 输入 "我想吃辣的"，确认是否收到 AI 回复，并弹出菜单卡片。
3. **下单测试**: 点击 "确认订单"，确认是否调用 `createOrder` 并显示成功消息（包含后端生成的 OrderID）。
4. **刷新测试**: 点击 "刷新" 按钮，确认是否提示刷新成功。

## 故障排查
- 如果菜单不显示图片，检查是否因为后端 `imageUrl` 字段为空（代码中有 fallback 到 picsum.photos）。
- 如果 "确认订单" 失败，检查网络请求的 Payload 格式是否符合 `{ items: [{dishId, quantity}] }`。
