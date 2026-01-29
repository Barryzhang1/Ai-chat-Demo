# 订单状态流转前端功能实现文档

## 系统概述

本文档描述了订单状态流转的前端实现，包括订单状态按钮、状态筛选和API调用等功能。该功能允许商家在订单列表页面中根据订单状态显示不同的操作按钮，并通过点击按钮来更新订单状态。

## 功能特性

### 1. 订单状态按钮显示
- **待接单订单（pending）**：显示"接单"按钮
- **制作中订单（preparing）**：显示"完成制作"按钮
- **已完成订单（completed）**：不显示操作按钮
- **已取消订单（cancelled）**：不显示操作按钮

### 2. 订单状态筛选
- **全部订单**：显示所有状态的订单
- **待接单**：仅显示status为`pending`的订单
- **制作中**：仅显示status为`preparing`的订单
- **已完成**：仅显示status为`completed`的订单

### 3. 状态更新流程
- 点击按钮后弹出确认对话框
- 确认后调用后端API修改订单状态
- 更新成功后自动刷新订单列表
- 显示成功或失败提示

## 技术实现

### 1. API层实现

**文件位置**：`ChatUI/src/api/orderApi.js`

新增订单状态更新API：

```javascript
// 修改订单状态
updateOrderStatus: async (orderId, status) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ordering/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || '修改订单状态失败');
    return data;
  } catch (error) {
    console.error('Update order status error:', error);
    throw error;
  }
}
```

**关键点**：
- 使用PATCH方法调用后端接口
- 自动携带JWT Token（通过getHeaders()）
- 完整的错误处理和异常抛出
- 符合RESTful API设计规范

### 2. 订单列表页面实现

**文件位置**：`ChatUI/src/pages/MerchantDashboard/OrderList.js`

#### 2.1 导入依赖

```javascript
import { NavBar, List, Tabs, Tag, Toast, Empty, InfiniteScroll, PullToRefresh, Button, Dialog } from 'antd-mobile';
```

新增组件：
- `Button`：用于显示操作按钮
- `Dialog`：用于确认对话框

#### 2.2 状态更新处理函数

```javascript
// 修改订单状态
const handleUpdateStatus = async (orderId, currentStatus, newStatus, statusText) => {
  const result = await Dialog.confirm({
    content: `确认将订单状态改为"${statusText}"吗？`,
  });

  if (result) {
    try {
      await orderApi.updateOrderStatus(orderId, newStatus);
      Toast.show({ icon: 'success', content: '订单状态已更新' });
      // 刷新订单列表
      await loadOrders(true);
    } catch (error) {
      console.error('更新订单状态失败:', error);
      Toast.show({ icon: 'fail', content: error.message || '更新失败，请重试' });
    }
  }
};
```

**功能说明**：
1. 弹出确认对话框，防止误操作
2. 调用API更新订单状态
3. 成功后显示成功提示并刷新列表
4. 失败时显示错误信息

#### 2.3 订单卡片按钮渲染

```javascript
extra={
  <div style={{ textAlign: 'right' }}>
    <Tag color={status.color} style={{ marginBottom: '8px' }}>
      {status.text}
    </Tag>
    <div className="order-price" style={{ fontSize: '16px', fontWeight: 'bold', color: '#ff6430', marginBottom: '8px' }}>
      ¥{order.totalPrice.toFixed(2)}
    </div>
    {/* 根据订单状态显示不同按钮 */}
    {order.status === 'pending' && (
      <Button
        color="primary"
        size="small"
        onClick={() => handleUpdateStatus(order._id, 'pending', 'preparing', '制作中')}
      >
        接单
      </Button>
    )}
    {order.status === 'preparing' && (
      <Button
        color="success"
        size="small"
        onClick={() => handleUpdateStatus(order._id, 'preparing', 'completed', '已完成')}
      >
        完成制作
      </Button>
    )}
  </div>
}
```

**UI设计**：
- 使用条件渲染根据订单状态显示对应按钮
- pending状态显示蓝色"接单"按钮
- preparing状态显示绿色"完成制作"按钮
- completed和cancelled状态不显示按钮

#### 2.4 标签页配置

```javascript
<Tabs
  activeKey={activeTab}
  onChange={setActiveTab}
  style={{
    '--title-font-size': '14px',
    '--content-padding': '0',
  }}
>
  <Tabs.Tab title="全部订单" key="all" />
  <Tabs.Tab title="待接单" key="pending" />
  <Tabs.Tab title="制作中" key="preparing" />
  <Tabs.Tab title="已完成" key="completed" />
</Tabs>
```

**筛选逻辑**：
- 切换标签时，`activeTab`状态更新
- `useEffect`监听`activeTab`变化，重新加载对应状态的订单
- `loadOrders`函数根据`activeTab`添加status参数到API请求

```javascript
// 如果选择了特定状态，添加状态筛选
if (activeTab !== 'all') {
  params.status = activeTab;
}
```

## API 接口文档

### 修改订单状态

**接口地址**：`PATCH /ordering/orders/:orderId/status`

**请求参数**：
| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| orderId | string | URL路径 | 是 | 订单ID（MongoDB _id） |
| status | string | 请求体 | 是 | 新状态：pending/preparing/completed/cancelled |

**请求示例**：
```javascript
// 将订单状态从pending改为preparing
await orderApi.updateOrderStatus('65a1b2c3d4e5f678901234c', 'preparing');
```

**响应格式**：
```json
{
  "code": 0,
  "message": "订单状态修改成功",
  "data": {
    "orderId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "preparing",
    "dishes": [...],
    "totalPrice": 76,
    "createdAt": "2026-01-29T10:00:00.000Z",
    "updatedAt": "2026-01-29T10:30:00.000Z"
  }
}
```

## 使用指南

### 商家操作流程

1. **查看待接单订单**
   - 进入订单列表页面
   - 点击"待接单"标签
   - 查看所有pending状态的订单

2. **接单操作**
   - 在pending状态的订单右下角点击"接单"按钮
   - 确认对话框中点击"确认"
   - 订单状态自动更新为"制作中"
   - 订单从"待接单"列表移动到"制作中"列表

3. **完成制作**
   - 切换到"制作中"标签
   - 查看preparing状态的订单
   - 点击"完成制作"按钮
   - 确认后订单状态更新为"已完成"
   - 订单移动到"已完成"列表

4. **查看历史订单**
   - 点击"已完成"标签查看所有完成的订单
   - 点击"全部订单"标签查看所有状态的订单

## 数据模型

### 订单状态枚举

| 状态值 | 中文名称 | 颜色标签 | 可用操作 |
|--------|----------|----------|----------|
| pending | 待制作 | warning（橙色） | 接单 |
| preparing | 制作中 | primary（蓝色） | 完成制作 |
| completed | 已完成 | default（灰色） | 无 |
| cancelled | 已取消 | danger（红色） | 无 |

### 状态流转图

```
待接单(pending)
     ↓ [点击"接单"按钮]
制作中(preparing)
     ↓ [点击"完成制作"按钮]
已完成(completed)
```

## 部署运行

### 开发环境

```bash
cd ChatUI
npm install
npm start
```

访问：`http://localhost:3000`

### 生产环境

```bash
cd ChatUI
npm run build
```

构建产物：`ChatUI/dist`

## 测试说明

### 功能测试用例

#### 测试用例1：待接单订单显示接单按钮

**前置条件**：
- 数据库中存在status为pending的订单
- 商家已登录

**测试步骤**：
1. 访问订单列表页面
2. 点击"待接单"标签
3. 查看订单卡片右下角

**预期结果**：
- 订单卡片右下角显示蓝色"接单"按钮
- 按钮大小为small

#### 测试用例2：点击接单按钮更新订单状态

**前置条件**：
- 存在pending状态的订单
- 商家已登录

**测试步骤**：
1. 在"待接单"标签页点击某订单的"接单"按钮
2. 在确认对话框中点击"确认"
3. 等待请求完成

**预期结果**：
- 显示"订单状态已更新"成功提示
- 订单从"待接单"列表消失
- 切换到"制作中"标签，可以看到该订单
- 订单状态标签显示为"制作中"

#### 测试用例3：制作中订单显示完成制作按钮

**前置条件**：
- 数据库中存在status为preparing的订单
- 商家已登录

**测试步骤**：
1. 访问订单列表页面
2. 点击"制作中"标签
3. 查看订单卡片右下角

**预期结果**：
- 订单卡片右下角显示绿色"完成制作"按钮
- 按钮大小为small

#### 测试用例4：点击完成制作按钮更新订单状态

**前置条件**：
- 存在preparing状态的订单
- 商家已登录

**测试步骤**：
1. 在"制作中"标签页点击某订单的"完成制作"按钮
2. 在确认对话框中点击"确认"
3. 等待请求完成

**预期结果**：
- 显示"订单状态已更新"成功提示
- 订单从"制作中"列表消失
- 切换到"已完成"标签，可以看到该订单
- 订单状态标签显示为"已完成"

#### 测试用例5：已完成订单不显示操作按钮

**前置条件**：
- 数据库中存在status为completed的订单
- 商家已登录

**测试步骤**：
1. 访问订单列表页面
2. 点击"已完成"标签
3. 查看订单卡片右下角

**预期结果**：
- 订单卡片右下角不显示任何操作按钮
- 只显示状态标签和总价

#### 测试用例6：取消确认对话框不更新状态

**前置条件**：
- 存在pending状态的订单
- 商家已登录

**测试步骤**：
1. 点击"接单"按钮
2. 在确认对话框中点击"取消"

**预期结果**：
- 对话框关闭
- 订单状态不变，仍为pending
- 不发送API请求

#### 测试用例7：网络错误处理

**前置条件**：
- 后端服务未启动或网络异常
- 商家已登录

**测试步骤**：
1. 点击"接单"按钮
2. 确认对话框中点击"确认"

**预期结果**：
- 显示错误提示"更新失败，请重试"
- 订单状态不变
- 不刷新订单列表

#### 测试用例8：标签页筛选功能

**前置条件**：
- 数据库中存在不同状态的订单
- 商家已登录

**测试步骤**：
1. 依次点击"全部订单"、"待接单"、"制作中"、"已完成"标签

**预期结果**：
- "全部订单"显示所有状态的订单
- "待接单"只显示pending状态的订单
- "制作中"只显示preparing状态的订单
- "已完成"只显示completed状态的订单
- 每次切换标签都会重新加载数据

## 故障排查

### 问题1：点击按钮没有反应

**可能原因**：
- 网络连接问题
- 后端服务未启动
- JWT Token过期

**解决方案**：
1. 检查浏览器控制台Network标签，查看请求状态
2. 确认后端服务正在运行
3. 重新登录获取新Token

### 问题2：按钮不显示

**可能原因**：
- 订单状态数据不正确
- 前端代码渲染逻辑错误

**解决方案**：
1. 检查浏览器控制台，查看订单数据中的status字段
2. 确认status值为'pending'或'preparing'
3. 检查订单列表是否成功加载

### 问题3：更新后订单不刷新

**可能原因**：
- API调用成功但刷新逻辑未执行
- 状态更新失败

**解决方案**：
1. 检查handleUpdateStatus函数中的loadOrders调用
2. 查看控制台是否有错误信息
3. 手动下拉刷新页面

### 问题4：确认对话框无法关闭

**可能原因**：
- antd-mobile Dialog组件版本问题
- 事件冲突

**解决方案**：
1. 检查antd-mobile版本是否为5.34+
2. 刷新页面重试
3. 查看浏览器控制台错误信息

## 代码规范

本实现遵循以下前端代码规范：

1. **React Hooks规范**
   - 所有Hook调用在组件顶层
   - useEffect依赖数组正确配置
   - 使用useState管理组件状态

2. **命名规范**
   - 组件使用PascalCase：`OrderList`
   - 函数使用camelCase：`handleUpdateStatus`
   - 常量使用UPPER_SNAKE_CASE：`API_BASE_URL`

3. **ESLint规范**
   - 使用const/let，避免var
   - 使用箭头函数
   - 正确的解构赋值

4. **antd-mobile规范**
   - 使用官方组件API
   - 正确配置组件props
   - 遵循移动端UI设计规范

## 扩展建议

### 1. 批量操作
支持同时接多个订单或批量完成制作

```javascript
const handleBatchUpdate = async (orderIds, newStatus) => {
  // 实现批量更新逻辑
};
```

### 2. 订单详情页
点击订单卡片跳转到详情页，显示更完整的订单信息

```javascript
const handleViewDetail = (orderId) => {
  navigate(`/merchant/orders/${orderId}`);
};
```

### 3. 实时通知
使用WebSocket实时推送新订单通知

```javascript
useEffect(() => {
  const socket = io(API_BASE_URL);
  socket.on('new-order', (order) => {
    Toast.show('收到新订单！');
    loadOrders(true);
  });
  return () => socket.disconnect();
}, []);
```

### 4. 订单统计
在标签页标题显示各状态订单数量

```javascript
<Tabs.Tab title={`待接单 (${pendingCount})`} key="pending" />
```

### 5. 状态流转限制
添加状态机验证，防止非法状态跳转

```javascript
const validTransitions = {
  pending: ['preparing', 'cancelled'],
  preparing: ['completed', 'cancelled'],
  completed: [],
  cancelled: []
};
```

## 版本历史

### v1.0.0 (2026-01-29)
- ✅ 实现订单状态按钮显示
- ✅ 实现订单状态更新API调用
- ✅ 实现订单状态筛选功能
- ✅ 添加确认对话框
- ✅ 添加成功/失败提示
- ✅ 支持下拉刷新和无限滚动

## 相关文档

- [修改订单状态功能实现文档](./update-order-status.md)
- [修改订单状态测试用例](./update-order-status.testcase.md)
- [创建订单功能需求](./create-order.md)
- [点餐模块总览](./ordering.md)
