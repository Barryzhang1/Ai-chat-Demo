# 座位系统 API 与前端适配更新日志
## 更新日期: 2026-01-28

### 问题描述
当用户进入聊天分配座位后，商家端后台显示的座位状态仍然为“空闲”，未即时刷新为“用餐中”，也未显示占用者信息。

### 原因分析
1. **API 使用错误**：前端 `SeatManagement.js` 使用了 `GET /api/seats`，该接口仅返回数据库中的静态状态（默认 available），不包含 Redis 中的实时占用状态。
2. **数据结构不匹配**：后端 `GET /api/seats/with-status` 虽然返回实时状态，但数据结构与前端渲染所需的 `status`, `occupiedByName` 等字段不匹配。
3. **事件监听不完整**：前端未监听 `merchantSeatUpdate` 事件，导致无法实时接收状态变更广播。

### 修改内容

#### 后端 (ChatBackEnd)
- **文件**: `src/modules/seat/seat.service.ts`
- **方法**: `findAllWithStatus`
- **变更**: 
  - 响应结果中新增 `status` 字段，优先取 Redis 中的占用状态。
  - 响应结果中新增 `occupiedByName`, `occupiedAt`, `occupiedBy` 顶层字段，方便前端直接使用。
  
#### 前端 (ChatUI)
- **文件**: `src/pages/MerchantDashboard/SeatManagement.js`
- **API**: 将获取座位列表的接口从 `/api/seats` 修改为 `/api/seats/with-status`。
- **Socket**: 新增监听 `merchantSeatUpdate` 事件，接收到广播后直接更新列表状态。

### 验证结果
- 商家端初次加载时，能够正确显示当前所有座位的实时状态（占用或空闲）。
- 当有新用户分配座位时，商家端会自动刷新并显示“用餐中”以及用户昵称。
- 刷新页面后状态依然保持同步。
