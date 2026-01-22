# DeepSeek API 模块

这个模块提供了与 DeepSeek API 集成的功能。

## 配置

1. 获取 DeepSeek API Key
   - 访问 [DeepSeek 官网](https://www.deepseek.com/)
   - 注册账号并获取 API Key

2. 配置环境变量
   ```bash
   export DEEPSEEK_API_KEY=your_api_key_here
   ```

   或者在 `.env` 文件中添加：
   ```
   DEEPSEEK_API_KEY=your_api_key_here
   ```

## API 端点

### 1. 执行命令
```
POST /deepseek/execute
Content-Type: application/json

{
  "command": "如何优化这段代码",
  "args": []
}
```

### 2. 获取建议
```
POST /deepseek/suggest
Content-Type: application/json

{
  "prompt": "请帮我写一个快速排序算法"
}
```

### 3. 解释代码
```
POST /deepseek/explain
Content-Type: application/json

{
  "code": "function quickSort(arr) { ... }"
}
```

### 4. 检查状态
```
GET /deepseek/status
```

## 响应格式

所有 API 都返回 `CommandResult` 对象：

```json
{
  "success": true,
  "output": "API 响应内容",
  "exitCode": 0,
  "executionTime": 1234,
  "fullCommand": "完整的命令",
  "timestamp": "2026-01-23T10:30:00.000Z",
  "error": null
}
```

## 注意事项

- 确保 API Key 已正确配置
- DeepSeek API 需要网络连接
- 请注意 API 调用的频率限制和费用
