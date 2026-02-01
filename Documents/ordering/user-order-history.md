# 用户历史订单查看功能

## 系统概述

本功能为用户点餐页面添加了历史订单查看功能，用户可以通过点击右上角的订单按钮查看自己的历史订单列表，展示形式参考商家后台的订单列表。

## 架构设计

### 数据流
```
用户点击订单按钮
    ↓
触发 handleOpenOrderHistory()
    ↓
调用 orderApi.getMyOrders()
    ↓
后端 GET /ordering/my-orders
    ↓
返回当前用户的订单列表
    ↓
前端渲染订单历史弹窗
```

### 组件结构
```
UserOrder.js
├── NavBar (右侧添加订单按钮)
├── 订单历史弹窗 (Popup)
│   ├── 弹窗标题
│   ├── 下拉刷新 (PullToRefresh)
│   │   ├── 订单列表 (List)
│   │   │   └── 订单项 (List.Item)
│   │   │       ├── 订单号
│   │   │       ├── 订单详情
│   │   │       ├── 状态标签
│   │   │       └── 总价
│   │   └── 无限滚动 (InfiniteScroll)
│   └── 空状态 (Empty)
```

## 功能特性

### 1. 订单历史按钮
- 位置：智能点餐页面右上角
- 图标：列表图标（UnorderedListOutline）
- 点击后弹出订单历史弹窗

### 2. 订单历史弹窗
- 高度：屏幕的 80%
- 圆角：顶部圆角 16px
- 背景：灰白色 (#f5f5f5)

### 3. 订单列表展示
- 订单号
- 订单状态（带颜色标签）
- 菜品详情（名称、数量、单价）
- 订单总价（红色加粗）
- 订单时间（格式化显示）
- 菜品总数量统计

### 4. 订单状态
- **pending（待制作）**：黄色标签
- **paid（已支付）**：绿色标签
- **preparing（制作中）**：蓝色标签
- **completed（已完成）**：灰色标签
- **cancelled（已取消）**：红色标签

### 5. 时间格式化
- 1分钟内：刚刚
- 1-60分钟：X分钟前
- 1-24小时：X小时前
- 1-7天：X天前
- 7天以上：完整日期

### 6. 交互功能
- **下拉刷新**：刷新订单列表
- **分页加载**：滚动到底部自动加载更多
- **空状态**：无订单时显示"暂无订单"
- **关闭弹窗**：点击遮罩层或返回按钮

## 技术实现

### 1. 后端实现

#### Controller层
**文件位置**：`ChatBackEnd/src/modules/ordering/ordering.controller.ts`

**新增接口**：
```typescript
@Get('my-orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: '获取当前用户的订单列表' })
async getMyOrders(
  @Request() req: ExpressRequest & { user: { id: string } },
  @Query('page') page?: number,
  @Query('limit') limit?: number,
  @Query('status') status?: string,
) {
  const userId = req.user.id;
  const pageNum = page ? Math.max(1, Number(page)) : 1;
  const limitNum = limit ? Math.min(Math.max(1, Number(limit)), 50) : 10;

  const result = await this.orderingService.getUserOrders(
    userId,
    pageNum,
    limitNum,
    status,
  );

  return {
    code: 0,
    message: '获取成功',
    data: result,
  };
}
```

#### Service层
**文件位置**：`ChatBackEnd/src/modules/ordering/ordering.service.ts`

**新增方法**：
```typescript
async getUserOrders(
  userId: string,
  page: number = 1,
  limit: number = 10,
  status?: string,
): Promise<{
  orders: Array<any>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const query: any = { userId };
  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;
  const total = await this.orderModel.countDocuments(query).exec();

  const orders = await this.orderModel
    .find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();

  const totalPages = Math.ceil(total / limit);

  return {
    orders: orders.map((order) => ({
      _id: order._id,
      userId: order.userId,
      dishes: order.dishes,
      totalPrice: order.totalPrice,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    })),
    total,
    page,
    limit,
    totalPages,
  };
}
```

### 2. 前端实现

#### API层
**文件位置**：`ChatUI/src/api/orderApi.js`

**新增方法**：
```javascript
getMyOrders: async (params = {}) => {
  try {
    const { page = 1, limit = 10, status } = params;
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    if (status) {
      queryParams.append('status', status);
    }
    
    const response = await fetch(
      `${API_BASE_URL}/ordering/my-orders?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: getHeaders(),
      }
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || '获取订单列表失败');
    return data;
  } catch (error) {
    console.error('Get my orders error:', error);
    throw error;
  }
}
```

#### 页面组件
**文件位置**：`ChatUI/src/pages/UserOrder/UserOrder.js`

**新增状态**：
```javascript
const [showOrderHistoryPopup, setShowOrderHistoryPopup] = useState(false);
const [orderHistory, setOrderHistory] = useState([]);
const [orderHistoryPage, setOrderHistoryPage] = useState(1);
const [orderHistoryHasMore, setOrderHistoryHasMore] = useState(true);
const [loadingOrderHistory, setLoadingOrderHistory] = useState(false);
```

**新增函数**：
```javascript
// 加载订单历史
const loadOrderHistory = async (isRefresh = false) => {
  if (loadingOrderHistory) return;
  
  setLoadingOrderHistory(true);
  try {
    const currentPage = isRefresh ? 1 : orderHistoryPage;
    const res = await orderApi.getMyOrders({ page: currentPage, limit: 10 });
    const { orders: newOrders, totalPages } = res.data;
    
    if (isRefresh) {
      setOrderHistory(newOrders);
      setOrderHistoryPage(2);
      setOrderHistoryHasMore(totalPages > 1);
    } else {
      setOrderHistory(prev => [...prev, ...newOrders]);
      setOrderHistoryPage(currentPage + 1);
      setOrderHistoryHasMore(currentPage < totalPages);
    }
  } catch (error) {
    Toast.show({ icon: 'fail', content: '加载失败，请重试' });
  } finally {
    setLoadingOrderHistory(false);
  }
};

// 打开订单历史弹窗
const handleOpenOrderHistory = () => {
  setShowOrderHistoryPopup(true);
  if (orderHistory.length === 0) {
    loadOrderHistory(true);
  }
};

// 下拉刷新订单历史
const onRefreshOrderHistory = async () => {
  await loadOrderHistory(true);
};

// 格式化时间
const formatOrderTime = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString();
};
```

**NavBar修改**：
```javascript
<NavBar 
  onBack={() => navigate('/role-select')}
  right={
    <UnorderedListOutline 
      fontSize={24} 
      onClick={handleOpenOrderHistory}
      style={{ cursor: 'pointer' }}
    />
  }
>
  智能点餐
</NavBar>
```

**订单历史弹窗UI**：
```javascript
<Popup
  visible={showOrderHistoryPopup}
  onMaskClick={() => setShowOrderHistoryPopup(false)}
  onClose={() => setShowOrderHistoryPopup(false)}
  bodyStyle={{ 
    height: '80vh',
    borderTopLeftRadius: '16px',
    borderTopRightRadius: '16px',
    overflow: 'hidden'
  }}
>
  <div className="order-history-popup-container">
    <div className="order-history-header">
      <h3>我的订单</h3>
    </div>
    
    <div className="order-history-content">
      <PullToRefresh onRefresh={onRefreshOrderHistory}>
        {orderHistory.length === 0 && !loadingOrderHistory ? (
          <Empty description="暂无订单" />
        ) : (
          <>
            <List>
              {orderHistory.map(order => {
                // 订单项渲染逻辑
              })}
            </List>
            <InfiniteScroll 
              loadMore={() => loadOrderHistory(false)} 
              hasMore={orderHistoryHasMore} 
            />
          </>
        )}
      </PullToRefresh>
    </div>
  </div>
</Popup>
```

#### 样式文件
**文件位置**：`ChatUI/src/pages/UserOrder/UserOrder.css`

**新增样式**：
```css
/* 订单历史弹窗样式 */
.order-history-popup-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f5f5;
}

.order-history-header {
  padding: 16px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
}

.order-history-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.order-history-content {
  flex: 1;
  overflow-y: auto;
  background: #f5f5f5;
}

.order-history-content .adm-list-body .adm-list-item {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin: 12px 16px;
  background-color: #ffffff;
  overflow: hidden;
}

.order-history-content .adm-list-body {
  background-color: transparent;
}
```

## API 接口文档

### 获取当前用户的订单列表

**接口地址**：`GET /ordering/my-orders`

**请求头**：
```
Authorization: Bearer <JWT_TOKEN>
```

**请求参数**（Query Parameters）：
| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 10 | 每页数量，最大50 |
| status | string | 否 | - | 订单状态过滤 |

**订单状态枚举**：
- `pending`: 待制作
- `paid`: 已支付
- `preparing`: 制作中
- `completed`: 已完成
- `cancelled`: 已取消

**响应格式**：
```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "orders": [
      {
        "_id": "60f7b3e3e8f3a12345678901",
        "userId": "user-123",
        "dishes": [
          {
            "dishId": "dish-456",
            "name": "宫保鸡丁",
            "price": 28,
            "quantity": 2
          }
        ],
        "totalPrice": 56,
        "status": "preparing",
        "createdAt": "2024-01-20T10:30:00.000Z",
        "updatedAt": "2024-01-20T10:35:00.000Z"
      }
    ],
    "total": 15,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

**错误响应**：
- 401: 未授权（未登录或token无效）

## 数据模型

无新增数据模型，使用现有的 Order 模型。

## 使用指南

### 用户使用

1. **打开订单历史**
   - 进入智能点餐页面
   - 点击右上角的列表图标
   - 弹窗显示订单历史

2. **查看订单详情**
   - 订单列表显示订单号、状态、菜品、价格、时间
   - 状态标签用不同颜色区分
   - 时间显示为相对时间（X分钟前）

3. **刷新订单**
   - 下拉订单列表触发刷新
   - 加载最新的订单数据

4. **加载更多**
   - 滚动到列表底部自动加载下一页
   - 没有更多数据时显示提示

5. **关闭弹窗**
   - 点击弹窗外部区域
   - 或使用返回手势

### 开发者使用

**查询用户订单**：
```javascript
const res = await orderApi.getMyOrders({
  page: 1,
  limit: 10,
  status: 'preparing' // 可选
});
```

**查询所有订单（商家后台）**：
```javascript
const res = await orderApi.getOrders({
  page: 1,
  limit: 10,
  status: 'pending' // 可选
});
```

## 测试用例

详见：[用户历史订单查看功能测试用例](./user-order-history.testcase.md)

## 注意事项

1. **权限区分**
   - `/ordering/my-orders`：查询当前用户的订单
   - `/ordering/orders`：查询所有订单（用于商家后台）

2. **性能优化**
   - 使用分页加载，每次最多加载50条
   - 订单列表按创建时间倒序排列
   - 使用无限滚动，避免一次性加载大量数据

3. **用户体验**
   - 首次打开弹窗自动加载订单
   - 支持下拉刷新获取最新数据
   - 空状态友好提示
   - 时间显示人性化（相对时间）

4. **错误处理**
   - 网络错误时显示友好提示
   - 加载失败时可以重试
   - 不影响原有点餐功能

## 相关文档

- [点餐模块需求文档](./ordering.md)
- [订单列表全局查询功能](./all-orders-query.md)
- [商家后台订单列表](../frontend/merchant-dashboard.md)
