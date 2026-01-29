# 前端聊天界面与后端对接文档

## 系统概述
本文档描述了 ChatUI 项目如何接入 ChatBackEnd 的 Ordering 模块，实现 AI 智能点餐对话功能。

## 功能特性
1. **AI 智能对话**: 用户发送消息，系统通过 AI 返回回复。
2. **菜品推荐**: 根据对话内容，AI 推荐相关菜品，并以卡片形式展示。
3. **聊天历史**: 页面加载时自动获取历史聊天记录。
4. **一键加购**: 推荐卡片包含"选择"按钮（目前仅提示，可扩展为加购）。

## 技术实现

### API 接口
在 `ChatUI/src/api/orderApi.js` 中新增以下接口：

- `aiOrder(message)`: POST `/ordering/ai-order`
  - 发送用户消息，获取 AI 回复和推荐菜品。
- `getChatHistory(limit)`: GET `/ordering/chat-history`
  - 获取用户的聊天历史记录。
- `refreshMenu()`: POST `/ordering/refresh-menu`
  - 刷新菜单上下文。
- `getCart()`: GET `/ordering/cart`
  - 获取当前购物车。

### 页面逻辑
`ChatUI/src/pages/Chat/Chat.js` 主要逻辑：
1. **鉴权**: 使用 `authUtils.getToken()` 获取 Token 并在请求头中携带。
2. **状态管理**: 使用 `useState` 管理 `messages` 列表。
3. **初始化**: `useEffect` 调用 `getChatHistory` 填充 `messages`。
4. **消息发送**: `handleSendMessage` 调用 `aiOrder`，并处理返回的 `reply` 和 `dishes`。
5. **渲染**:
   - `renderMessage` 区分用户和 AI 消息。
   - `renderDishes` 渲染推荐菜品卡片 (样式在 `ChatRecommendations.css`)。

### 数据模型
**消息对象 (Frontend)**
```javascript
{
  id: string,
  content: string,
  role: 'user' | 'assistant',
  timestamp: number,
  dishes?: Array<{ // 仅 assistant 消息可能有
    _id: string,
    name: string,
    price: number,
    description: string,
    image: string
  }>
}
```

## 测试说明
1. 启动 Backend 服务 (Port 3001)。
2. 启动 Frontend 服务。
3. 登录应用以获取 Token。
4. 进入 "ChatGPT" 聊天页面。
5. 发送 "我想吃辣的"。
6. 验证是否收到 AI 回复，并展示推荐菜品卡片。
7. 刷新页面，验证历史记录是否加载。
