# 大厅开关门功能测试用例

## 测试环境
- **项目**: ChatBackEnd
- **模块**: seat (座位管理)
- **测试时间**: 2026-01-29

---

## 测试用例 1: 关门功能 - 清空所有座位

### 前置条件
1. 后端服务已启动
2. MongoDB 和 Redis 正常运行
3. 至少有 3 个座位被用户占用
4. 至少有 2 个用户在排队

### 测试步骤
1. 访问 API: `POST http://localhost:3001/api/seats/hall/close`
2. 检查返回结果

### 预期结果
```json
{
  "message": "大厅已关闭，清空了 3 个座位的占用信息，2 个排队记录",
  "clearedSeats": 3,
  "clearedQueue": 2
}
```

### 验证点
- ✅ 所有座位占用记录从 Redis 中清除
- ✅ 所有排队记录从 Redis 中清除（包括队列和详细信息）
- ✅ 大厅状态设置为 `closed`
- ✅ 所有被清除用户的心跳检测停止
- ✅ WebSocket 广播 `hallStatusChanged` 事件给所有客户端

### Redis 验证命令
```bash
# 检查座位占用信息（应该全部为空）
redis-cli KEYS "seat:status:occupied:*"

# 检查大厅状态（应该是 closed）
redis-cli GET "seat:hall:status"

# 检查排队列表（应该为空）
redis-cli LRANGE "seat:queue" 0 -1

# 检查排队详细信息（应该为空）
redis-cli KEYS "seat:queue:info:*"
```

---

## 测试用例 2: 关门后用户请求座位 - 强制排队

### 前置条件
1. 大厅状态为 `closed`（执行了关门操作）
2. 有可用座位

### 测试步骤
1. 用户通过 WebSocket 发送 `requestSeat` 事件
2. 观察用户收到的响应

### 预期结果
用户收到 `hallClosed` 事件，而不是 `seatAssigned` 事件：
```javascript
{
  message: "大厅已关闭，您已自动加入排队",
  position: 3,
  queueLength: 3
}
```

### 验证点
- ✅ 用户未被分配座位
- ✅ 用户被加入排队队列
- ✅ 返回正确的排队位置
- ✅ 用户不能直接上座，即使有空座位

---

## 测试用例 3: 开门功能 - 按顺序分配座位

### 前置条件
1. 大厅状态为 `closed`
2. 排队队列中有 5 个用户（按加入顺序）
3. 有 3 个可用座位

### 测试步骤
1. 访问 API: `POST http://localhost:3001/api/seats/hall/open`
2. 检查返回结果
3. 查看排队列表

### 预期结果
```json
{
  "message": "大厅已开放，为 3 位用户分配了座位",
  "assignedCount": 3
}
```

### 验证点
- ✅ 大厅状态设置为 `open`
- ✅ 前 3 位排队用户被分配座位（按 FIFO 顺序）
- ✅ 每个被分配座位的用户收到 `seatAssigned` 事件
- ✅ 排队列表中剩余 2 个用户
- ✅ 所有被分配座位的用户启动心跳检测
- ✅ WebSocket 广播 `hallStatusChanged` 事件

### WebSocket 事件验证
用户应收到的事件：
```javascript
// 事件 1: seatAssigned
{
  seatNumber: 5,
  seatId: "507f1f77bcf86cd799439011"
}

// 事件 2 (可选): called
{
  message: "已为您分配座位：5号"
}
```

---

## 测试用例 4: 开门后用户请求座位 - 正常分配

### 前置条件
1. 大厅状态为 `open`
2. 有可用座位

### 测试步骤
1. 新用户通过 WebSocket 发送 `requestSeat` 事件
2. 观察用户收到的响应

### 预期结果
用户收到 `seatAssigned` 事件：
```javascript
{
  seatNumber: 7,
  seatId: "507f1f77bcf86cd799439012"
}
```

### 验证点
- ✅ 用户直接被分配座位
- ✅ 未进入排队队列
- ✅ 启动心跳检测

---

## 测试用例 5: 查询大厅状态

### 测试步骤
访问 API: `GET http://localhost:3001/api/seats/hall/status`

### 预期结果

**关门时**:
```json
{
  "status": "closed"
}
```

**开门时**:
```json
{
  "status": "open"
}
```

---

## 测试用例 6: 座位统计信息包含大厅状态

### 测试步骤
访问 API: `GET http://localhost:3001/api/seats/statistics`

### 预期结果
```json
{
  "total": 10,
  "available": 7,
  "occupied": 3,
  "closed": 0,
  "queueLength": 2,
  "hallStatus": "open"  // 新增字段
}
```

### 验证点
- ✅ 返回结果包含 `hallStatus` 字段
- ✅ `hallStatus` 为 `open` 或 `closed`

---

## 测试用例 7: 完整流程测试

### 测试步骤
1. **初始状态**: 5个用户在座位上，3个用户在排队
2. **执行关门**: `POST /api/seats/hall/close`
3. **验证**: 所有座位被清空，所有排队记录被清空
4. **新用户加入**: 尝试请求座位
5. **验证**: 新用户被强制排队（成为第1位，因为之前的排队记录已清空）
6. **执行开门**: `POST /api/seats/hall/open`
7. **验证**: 新排队的用户被分配座位
8. **新用户加入**: 尝试请求座位
9. **验证**: 如果有空位直接分配，否则排队

### 预期结果
整个流程顺畅，无异常，状态转换正确，关门后所有Redis记录都被清空

---

## 测试用例 8: 边界条件测试

### 测试场景 A: 关门时无人在座
- 执行关门操作
- 预期: `clearedSeats: 0`, 状态正常切换到 `closed`

### 测试场景 B: 开门时无人排队
- 执行开门操作
- 预期: `assignedCount: 0`, 状态正常切换到 `open`

### 测试场景 C: 开门时排队人数 > 可用座位
- 预期: 只分配可用座位数量的用户，其余继续排队

### 测试场景 D: 开门时排队人数 < 可用座位
- 预期: 所有排队用户都被分配座位，队列清空

---

## 性能测试

### 测试用例 9: 大量用户关门测试
- **前置条件**: 100个用户在座位上
- **操作**: 执行关门
- **验证**: 
  - 所有100个座位占用记录被清除
  - 100个心跳检测被停止
  - 响应时间 < 2秒

### 测试用例 10: 大量用户开门测试
- **前置条件**: 100个用户在排队，50个可用座位
- **操作**: 执行开门
- **验证**: 
  - 前50位用户被分配座位
  - 后50位继续排队
  - 响应时间 < 3秒

---

## 故障处理测试

### 测试用例 11: Redis 连接失败
- **模拟**: 关闭 Redis 服务
- **操作**: 尝试关门/开门
- **预期**: 返回错误信息，不影响其他功能

### 测试用例 12: 重复开门/关门
- **操作**: 连续执行多次开门或关门
- **预期**: 每次都能正常执行，幂等性良好

---

## WebSocket 事件监听测试

### 客户端需要监听的事件

1. **hallStatusChanged** - 大厅状态变更
```javascript
socket.on('hallStatusChanged', (data) => {
  console.log('大厅状态变更:', data);
  // data.status: 'open' | 'closed'
  // data.message: 提示信息
  // data.timestamp: 时间戳
});
```

2. **hallClosed** - 大厅关闭（关门时强制排队）
```javascript
socket.on('hallClosed', (data) => {
  console.log('大厅已关闭，您已加入排队:', data);
  // data.message: 提示信息
  // data.position: 排队位置
  // data.queueLength: 队列总长度
});
```

3. **merchantSeatUpdate** - 商家端状态更新（包含 hallStatus）
```javascript
socket.on('merchantSeatUpdate', (data) => {
  console.log('座位状态更新:', data);
  // data.statistics.hallStatus: 'open' | 'closed'
});
```

---

## 回归测试清单

执行开关门功能后，确保以下功能仍正常：

- ✅ 用户请求座位（开门状态下）
- ✅ 用户排队
- ✅ 用户离队
- ✅ 座位释放
- ✅ 心跳检测
- ✅ 商家端座位管理
- ✅ 座位统计
- ✅ 排队叫号

---

## 测试结论

测试完成后，填写以下内容：

- **测试日期**: ___________
- **测试人员**: ___________
- **通过用例数**: ___ / 12
- **发现问题数**: ___
- **测试结论**: ☐ 通过 ☐ 不通过

### 问题记录
| 编号 | 问题描述 | 严重程度 | 状态 |
|------|----------|----------|------|
| 1    |          |          |      |
| 2    |          |          |      |

---

## 附录：测试用 API 调用示例

### 使用 curl 测试

```bash
# 1. 关门
curl -X POST http://localhost:3001/api/seats/hall/close

# 2. 开门
curl -X POST http://localhost:3001/api/seats/hall/open

# 3. 查询大厅状态
curl http://localhost:3001/api/seats/hall/status

# 4. 查询座位统计（包含大厅状态）
curl http://localhost:3001/api/seats/statistics
```

### 使用 Postman 测试

导入以下请求集合：

```json
{
  "info": {
    "name": "Hall Open/Close Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Close Hall",
      "request": {
        "method": "POST",
        "url": "http://localhost:3001/api/seats/hall/close"
      }
    },
    {
      "name": "Open Hall",
      "request": {
        "method": "POST",
        "url": "http://localhost:3001/api/seats/hall/open"
      }
    },
    {
      "name": "Get Hall Status",
      "request": {
        "method": "GET",
        "url": "http://localhost:3001/api/seats/hall/status"
      }
    }
  ]
}
```
