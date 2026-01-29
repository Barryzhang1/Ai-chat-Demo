# 大厅开关门功能 - 快速开始

## 🚀 快速验证功能

### 1. 启动服务

```bash
cd ChatBackEnd
npm run start:dev
```

### 2. 测试关门功能

```bash
curl -X POST http://localhost:3001/api/seats/hall/close
```

**预期结果**:
```json
{
  "message": "大厅已关闭，清空了 N 个座位的占用信息",
  "clearedSeats": N
}
```

### 3. 验证大厅状态

```bash
curl http://localhost:3001/api/seats/hall/status
```

**预期结果**:
```json
{
  "status": "closed"
}
```

### 4. 测试开门功能

```bash
curl -X POST http://localhost:3001/api/seats/hall/open
```

**预期结果**:
```json
{
  "message": "大厅已开放，为 N 位用户分配了座位",
  "assignedCount": N
}
```

### 5. 再次验证大厅状态

```bash
curl http://localhost:3001/api/seats/hall/status
```

**预期结果**:
```json
{
  "status": "open"
}
```

---

## 📊 查看统计信息（含大厅状态）

```bash
curl http://localhost:3001/api/seats/statistics
```

**预期结果**（注意新增的 `hallStatus` 字段）:
```json
{
  "total": 10,
  "available": 7,
  "occupied": 3,
  "closed": 0,
  "queueLength": 2,
  "hallStatus": "open"
}
```

---

## 🧪 测试完整流程

### 场景：模拟餐厅一天的营业流程

```bash
# 1. 开始营业（开门）
curl -X POST http://localhost:3001/api/seats/hall/open

# 2. 查看座位统计
curl http://localhost:3001/api/seats/statistics

# 3. 结束营业（关门）
curl -X POST http://localhost:3001/api/seats/hall/close

# 4. 验证所有座位已清空
curl http://localhost:3001/api/seats/with-status

# 5. 查询排队列表（应该保留）
curl http://localhost:3001/api/seats/queue/list
```

---

## 🔍 Redis 数据验证

使用 Redis CLI 验证数据：

```bash
# 连接 Redis
redis-cli

# 查看大厅状态
> GET seat:hall:status

# 查看所有座位占用信息（关门后应该为空）
> KEYS seat:status:occupied:*

# 查看排队列表（关门后应该保留）
> LRANGE seat:queue 0 -1

# 查看排队详细信息
> KEYS seat:queue:info:*
```

---

## 🌐 WebSocket 测试

### 使用浏览器控制台测试

```javascript
// 连接 WebSocket
const socket = io('http://localhost:3001/seat');

// 监听大厅状态变更
socket.on('hallStatusChanged', (data) => {
  console.log('大厅状态变更:', data);
});

// 监听关门通知
socket.on('hallClosed', (data) => {
  console.log('大厅已关闭，排队信息:', data);
});

// 请求座位（在关门状态下测试）
socket.emit('requestSeat', { nickname: '测试用户' });
```

---

## ✅ 功能验证清单

完成以下验证后，功能即部署成功：

- [ ] 关门接口正常工作
- [ ] 开门接口正常工作
- [ ] 大厅状态查询正常
- [ ] 关门后 Redis 座位占用记录被清空
- [ ] 关门后排队列表保留
- [ ] 开门后排队用户按顺序上座
- [ ] WebSocket `hallStatusChanged` 事件正常广播
- [ ] WebSocket `hallClosed` 事件正常触发
- [ ] 座位统计包含 `hallStatus` 字段
- [ ] 关门状态下用户只能排队，不能直接上座

---

## 🐛 故障排查

### 问题：调用接口返回 404

**原因**: 服务未启动或端口错误

**解决**:
```bash
# 检查服务是否运行
ps aux | grep node

# 重新启动
cd ChatBackEnd
npm run start:dev
```

---

### 问题：Redis 连接失败

**原因**: Redis 服务未启动

**解决**:
```bash
# 启动 Redis
redis-server

# 或使用 Docker
docker-compose up redis
```

---

### 问题：关门后座位没有清空

**原因**: Redis 中没有座位数据

**验证**:
```bash
redis-cli KEYS "seat:status:occupied:*"
```

如果没有数据，说明本来就没有用户在座。

---

## 📝 下一步

功能验证完成后，可以：

1. 集成到前端管理界面
2. 添加定时任务（自动开关门）
3. 添加权限控制（只允许商家操作）
4. 完善日志记录

---

## 📚 相关文档

- 完整实现文档：[hall-open-close.md](./hall-open-close.md)
- 测试用例：[hall-open-close.testcase.md](./hall-open-close.testcase.md)
- 更新日志：[HALL_FEATURE_UPDATE.md](./HALL_FEATURE_UPDATE.md)
- 座位系统完整文档：[SEAT_COMPLETE_GUIDE.md](./SEAT_COMPLETE_GUIDE.md)

---

## 🎉 完成！

如果所有测试都通过，恭喜！大厅开关门功能已成功部署。
