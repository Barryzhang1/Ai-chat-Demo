# 游戏排行榜功能测试指南

## 问题诊断与修复

### 已修复的问题

1. **API URL配置**
   - 创建了 `.env` 文件，配置正确的后端API地址
   - 修改了 webpack 配置支持环境变量
   - FlappyBird端口从3002改为8080

2. **CORS配置**
   - 更新了后端CORS配置，允许来自 `http://localhost:8080` 的请求
   - 移除了重复的CORS配置

3. **调试日志**
   - 在gameScoreService中添加了详细的日志输出
   - 方便查看API请求和响应

## 测试步骤

### 1. 启动后端服务
```bash
cd ChatBackEnd
npm run start:dev
```
后端应该运行在 `http://localhost:3001`

### 2. 启动FlappyBird游戏
```bash
cd FlappyBird
npm start
```
游戏应该运行在 `http://localhost:8080`

### 3. 启动ChatUI管理界面
```bash
cd ChatUI
npm start
```
管理界面应该运行在 `http://localhost:3000`

### 4. 测试分数提交

1. 打开浏览器访问 `http://localhost:8080`
2. 开始游戏并玩到死亡
3. 打开浏览器控制台（F12），查看日志输出：
   ```
   提交分数到: http://localhost:3001/api/game-scores
   提交数据: {playerName: "...", score: ..., gameType: "FlappyBird", playTime: ...}
   响应状态: 201
   提交成功: {code: 201, message: "分数提交成功", data: {...}}
   ```
4. 游戏结束界面应该显示排名

### 5. 查看排行榜

1. 打开 `http://localhost:3000`
2. 登录商家账号
3. 点击"游戏排行榜"菜单
4. 应该能看到刚才提交的分数

## 常见问题排查

### 问题1: 分数提交失败，显示CORS错误
**原因**: 后端CORS配置不正确或后端未启动
**解决**: 
- 确保后端已启动
- 检查后端控制台是否有错误
- 重启后端服务

### 问题2: 控制台显示404错误
**原因**: API路径不正确
**解决**:
- 检查 `.env` 文件中的 `REACT_APP_API_URL` 配置
- 确保后端的 `game-score` 模块已正确注册

### 问题3: 分数为0没有提交
**原因**: 这是预期行为，分数为0不会提交到后端
**解决**: 获得至少1分再测试

### 问题4: 控制台看不到日志
**原因**: 浏览器控制台未打开或日志被过滤
**解决**:
- 按F12打开控制台
- 确保"全部"或"信息"级别日志显示

### 问题5: 排行榜显示"暂无数据"
**原因**: 
- 后端数据库没有数据
- API请求失败
**解决**:
- 先玩游戏提交几个分数
- 检查网络请求是否成功
- 在排行榜页面下拉刷新

## API端点

### 提交分数
```
POST http://localhost:3001/api/game-scores
Content-Type: application/json

{
  "playerName": "测试玩家",
  "score": 100,
  "gameType": "FlappyBird",
  "playTime": 60
}
```

### 查询排行榜
```
GET http://localhost:3001/api/game-scores/leaderboard?gameType=FlappyBird&period=all&page=1&limit=100
```

### 查询统计信息
```
GET http://localhost:3001/api/game-scores/stats?gameType=FlappyBird
```

## 验证清单

- [ ] 后端服务正常启动 (端口3001)
- [ ] FlappyBird游戏正常启动 (端口8080)
- [ ] ChatUI管理界面正常启动 (端口3000)
- [ ] 游戏结束后控制台显示提交日志
- [ ] 游戏结束界面显示排名
- [ ] 排行榜页面能查看分数列表
- [ ] 榜单类型切换功能正常
- [ ] 统计卡片显示正确数据

## 下一步优化建议

1. 添加玩家登录功能，关联用户账号
2. 添加分数防刷机制
3. 添加排行榜缓存提升性能
4. 支持更多游戏类型
5. 添加分数历史记录查询
6. 添加奖励机制（排名前三有特殊徽章）
