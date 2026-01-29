# 聊天历史记录展示功能实现文档

## 系统概述
在 ChatUI 的智能点餐页面 (UserOrder) 中实现了历史聊天记录的展示功能。当用户打开智能点餐页面时，系统会自动从后端获取历史聊天记录并显示在界面上，让用户可以查看之前的对话内容和推荐的菜品。

## 功能特性

### 1. 自动加载历史记录
- 页面加载时自动调用后端 API 获取历史记录
- 默认获取最近 20 条消息
- 如果没有历史记录，显示默认欢迎消息

### 2. 智能内容解析
- 解析 assistant 消息中的 JSON 格式内容
- 提取消息文本和菜品列表
- 将菜品名称与数据库中的菜品信息进行匹配

### 3. 完整信息展示
- 显示用户和助手的对话内容
- 展示推荐的菜品卡片（包含图片、名称、价格、数量）
- 显示消息时间戳
- 计算并显示菜品总价

### 4. 交互功能
- 点击历史记录中的菜品卡片可以打开菜单弹窗
- 支持查看菜品详情
- 可以直接从历史记录中重新选择菜品

## 架构设计

### 数据流
```
后端 API (/ordering/chat-history)
    ↓
前端 orderApi.getChatHistory()
    ↓
数据解析与转换
    ↓
菜品信息匹配 (dishApi.getDishes())
    ↓
状态更新 (setMessages)
    ↓
UI 渲染
```

### 组件结构
```
UserOrder.js
├── useEffect (初始化)
│   ├── fetchHistory()
│   │   ├── orderApi.getChatHistory()
│   │   ├── dishApi.getDishes()
│   │   └── 数据转换
│   └── setMessages()
└── 消息渲染
    ├── 用户消息
    └── 助手消息
        ├── 文本内容
        └── 菜品卡片
```

## 技术实现

### 1. 历史记录获取

**API 调用：**
```javascript
const res = await orderApi.getChatHistory();
```

**后端返回数据结构：**
```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "messages": [
      {
        "role": "user",
        "content": "直接推荐3个人的菜",
        "timestamp": "2026-01-28T17:34:31.137Z"
      },
      {
        "role": "assistant",
        "content": "{\\n  \\"message\\": \\"好的，已确认您的订单！\\",\\n  \\"dishes\\": [\\"宫保鸡丁\\", \\"麻婆豆腐\\"]\\n}",
        "timestamp": "2026-01-28T17:34:43.530Z"
      }
    ],
    "total": 8
  }
}
```

### 2. 数据解析与转换

**关键代码：**
```javascript
// 获取所有菜品数据，用于匹配
const dishesData = await dishApi.getDishes();
const allDishesMap = (dishesData || []).reduce((map, dish) => {
  map[dish.name] = dish;
  return map;
}, {});

// 转换历史消息
const history = res.data.messages.map(msg => {
  let parsedContent = msg.content;
  let menu = null;
  let totalPrice = 0;
  
  if (msg.role === 'assistant') {
    try {
      // 解析 JSON 格式的 content
      const jsonMatch = msg.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        parsedContent = parsed.message || msg.content;
        
        // 构建菜单
        if (parsed.dishes && parsed.dishes.length > 0) {
          menu = parsed.dishes.map((dishName, index) => {
            const dishData = allDishesMap[dishName];
            return {
              id: dishData?._id || `${msg.timestamp}_${index}`,
              name: dishName,
              price: dishData?.price || 0,
              description: dishData?.description || '',
              image: dishData?.imageUrl || `https://picsum.photos/200/200?random=${index}`,
              quantity: 1,
              isSpicy: dishData?.isSpicy || false
            };
          });
          
          totalPrice = menu.reduce((sum, dish) => sum + (dish.price * dish.quantity), 0);
        }
      }
    } catch (e) {
      console.log('Content is not JSON, using as plain text');
    }
  }
  
  return {
    role: msg.role,
    content: parsedContent,
    menu: menu,
    totalPrice: totalPrice,
    timestamp: new Date(msg.timestamp),
  };
});
```

### 3. 消息对象结构

**前端消息对象：**
```javascript
{
  role: 'user' | 'assistant',      // 消息角色
  content: string,                  // 消息内容（纯文本）
  menu: Array<{                     // 菜品列表（仅 assistant）
    id: string,                     // 菜品ID
    name: string,                   // 菜品名称
    price: number,                  // 菜品价格
    description: string,            // 菜品描述
    image: string,                  // 菜品图片URL
    quantity: number,               // 菜品数量
    isSpicy: boolean               // 是否辣
  }> | null,
  totalPrice: number,               // 总价
  timestamp: Date                   // 时间戳
}
```

### 4. UI 渲染

**消息样式：**
- 用户消息：右对齐，蓝色背景
- 助手消息：左对齐，白色背景
- 菜品卡片：点击可打开菜单弹窗

**关键渲染逻辑：**
```javascript
{messages.map((message, index) => (
  <div key={index} className={`message ${message.role}`}>
    <div className="message-bubble">
      <div className="message-content">
        {message.content}
      </div>
      
      {message.menu && (
        <div className="menu-list" onClick={() => handleOpenMenuPopup(message.menu)}>
          {message.menu.map(dish => (
            <div key={dish.id} className="dish-item">
              <div className="dish-name">{dish.name}</div>
              <div className="dish-price">¥{dish.price}</div>
              <div className="dish-quantity">x{dish.quantity}</div>
            </div>
          ))}
          <div className="total-amount">¥{message.totalPrice}</div>
        </div>
      )}
    </div>
  </div>
))}
```

## API 接口文档

### 获取聊天历史记录

**接口地址：** `GET /ordering/chat-history`

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| limit | number | 否 | 返回的消息数量，默认20条，最大100条 |

**请求头：**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**响应示例：**
```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "messages": [
      {
        "role": "user",
        "content": "直接推荐3个人的菜",
        "timestamp": "2026-01-28T17:34:31.137Z"
      },
      {
        "role": "assistant",
        "content": "{\"message\": \"好的\", \"dishes\": [\"宫保鸡丁\"]}",
        "timestamp": "2026-01-28T17:34:43.530Z"
      }
    ],
    "total": 8
  }
}
```

## 异常处理

### 1. 网络异常
```javascript
try {
  const res = await orderApi.getChatHistory();
  // 处理数据
} catch (e) {
  console.error("Failed to load history", e);
  // 显示默认欢迎消息
}
```

### 2. 数据格式异常
```javascript
try {
  const parsed = JSON.parse(jsonMatch[0]);
  // 使用解析后的数据
} catch (e) {
  // 使用原始文本内容
  console.log('Content is not JSON, using as plain text');
}
```

### 3. 菜品信息缺失
```javascript
const dishData = allDishesMap[dishName];
return {
  id: dishData?._id || `${msg.timestamp}_${index}`,
  name: dishName,
  price: dishData?.price || 0,  // 使用默认值
  description: dishData?.description || '',
  image: dishData?.imageUrl || `https://picsum.photos/200/200?random=${index}`,
  // ...
};
```

## 使用指南

### 用户操作流程

1. **打开智能点餐页面**
   - 自动加载历史记录
   - 显示之前的对话内容

2. **查看历史消息**
   - 查看用户和助手的对话
   - 查看推荐的菜品

3. **重新选择菜品**
   - 点击历史记录中的菜品卡片
   - 打开菜单弹窗
   - 修改菜品数量或添加新菜品

4. **继续对话**
   - 在输入框中输入新消息
   - 继续与 AI 助手对话

### 开发者使用

**修改历史记录数量：**
```javascript
const res = await orderApi.getChatHistory(50); // 获取最近50条
```

**自定义消息渲染：**
```javascript
// 在 UserOrder.js 中修改消息渲染逻辑
{messages.map((message, index) => (
  // 自定义渲染
))}
```

## 部署运行

### 前提条件
- ChatBackEnd 服务正常运行
- MongoDB 数据库已启动
- 用户已完成登录认证

### 启动步骤

1. **启动后端服务**
```bash
cd ChatBackEnd
npm run start:dev
```

2. **启动前端服务**
```bash
cd ChatUI
npm start
```

3. **访问页面**
- 打开浏览器访问：http://localhost:3000
- 登录系统
- 进入智能点餐页面

## 测试说明

详细测试用例请参考：[chat-history-display.testcase.md](./chat-history-display.testcase.md)

### 快速测试

1. **测试历史记录加载**
```bash
# 打开智能点餐页面
# 观察是否正确加载历史记录
```

2. **测试菜品信息展示**
```bash
# 查看包含菜品的历史消息
# 确认菜品名称、价格、图片正确显示
```

3. **测试交互功能**
```bash
# 点击历史记录中的菜品卡片
# 确认菜单弹窗正常打开
```

## 故障排查

### 问题1：历史记录不显示

**可能原因：**
- 后端服务未启动
- Token 过期或无效
- 网络连接问题

**解决方案：**
1. 检查后端服务状态
2. 重新登录获取新 Token
3. 检查网络连接
4. 查看浏览器控制台错误信息

### 问题2：菜品信息显示不完整

**可能原因：**
- 菜品已被删除
- 数据库中菜品信息缺失

**解决方案：**
1. 检查数据库中的菜品数据
2. 确认菜品未被标记为删除
3. 代码已实现默认值处理，显示 ¥0 为正常

### 问题3：JSON 解析失败

**可能原因：**
- 后端返回的 content 格式不是标准 JSON
- content 中包含转义字符

**解决方案：**
1. 检查后端返回的数据格式
2. 代码已实现容错处理，显示原始文本

### 问题4：消息顺序错误

**可能原因：**
- 时间戳格式不正确
- 前端排序逻辑错误

**解决方案：**
1. 确认时间戳格式为 ISO 8601
2. 检查 `new Date(msg.timestamp)` 转换是否正确

## 技术细节

### JSON 内容解析

**后端返回的 assistant content 格式：**
```json
"{\n  \"message\": \"好的，已确认您的订单！\",\n  \"dishes\": [\"宫保鸡丁\", \"麻婆豆腐\"]\n}"
```

**解析方法：**
1. 使用正则表达式提取 JSON 部分：`/\{[\s\S]*\}/`
2. 使用 `JSON.parse()` 解析
3. 提取 `message` 和 `dishes` 字段
4. 容错处理：解析失败时使用原始文本

### 菜品信息匹配

**匹配流程：**
1. 获取所有菜品数据：`dishApi.getDishes()`
2. 构建菜品名称映射表：`{ "宫保鸡丁": {菜品对象} }`
3. 根据历史记录中的菜品名称查找完整信息
4. 使用默认值处理缺失的菜品

**优化建议：**
- 可以考虑后端直接返回菜品ID而不是名称
- 可以缓存菜品数据，避免重复请求

### 性能优化

1. **数据获取优化**
   - 使用 `Promise.all()` 并行获取历史记录和菜品数据
   - 只在页面初始化时加载一次

2. **渲染优化**
   - 使用 `key` 属性优化列表渲染
   - 避免不必要的重新渲染

3. **内存优化**
   - 限制历史记录数量（默认20条）
   - 及时清理不需要的数据

## 更新日志

### v1.0.0 (2026-01-29)
- ✅ 实现历史记录加载功能
- ✅ 实现 JSON 内容解析
- ✅ 实现菜品信息匹配
- ✅ 实现菜品卡片展示
- ✅ 实现异常处理和容错
- ✅ 添加详细的代码注释
- ✅ 创建测试用例文档

## 相关文档
- [前端聊天界面对接文档](../frontend/chat-ui-integration.md)
- [测试用例文档](./chat-history-display.testcase.md)
- [Ordering 模块实现文档](./ordering.md)
