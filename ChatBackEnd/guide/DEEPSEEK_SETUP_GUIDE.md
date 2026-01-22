# DeepSeek API 配置指南

## 获取 API Key

1. 访问 [DeepSeek 官网](https://www.deepseek.com/)
2. 注册并登录账号
3. 在控制台中创建 API Key
4. 复制生成的 API Key

## 配置环境变量

### 方法 1: 使用 .env 文件 (推荐)

1. 在项目根目录创建 `.env` 文件：

```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，添加你的 API Key：

```bash
DEEPSEEK_API_KEY=your_actual_api_key_here
PORT=3000
```

### 方法 2: 直接设置环境变量

#### macOS/Linux:

```bash
export DEEPSEEK_API_KEY=your_actual_api_key_here
```

#### Windows (CMD):

```cmd
set DEEPSEEK_API_KEY=your_actual_api_key_here
```

#### Windows (PowerShell):

```powershell
$env:DEEPSEEK_API_KEY="your_actual_api_key_here"
```

## 验证配置

启动应用后，访问以下端点检查状态：

```bash
curl http://localhost:3000/deepseek/status
```

如果配置正确，应该返回：

```json
{
  "available": true,
  "version": "DeepSeek API v1",
  "authenticated": true
}
```

## 注意事项

- ⚠️ 不要将 `.env` 文件提交到版本控制系统
- ⚠️ 确保 API Key 保密，不要分享给他人
- ⚠️ 注意 API 调用的频率限制和费用
- ⚠️ 建议在生产环境使用更安全的密钥管理方案

## 故障排查

### 问题: API Key 未配置

错误信息: `DEEPSEEK_API_KEY not configured`

解决方案:
- 检查环境变量是否正确设置
- 检查 .env 文件是否存在且格式正确
- 重启应用使环境变量生效

### 问题: API 调用失败

错误信息: `DeepSeek API request failed`

解决方案:
- 检查网络连接
- 验证 API Key 是否有效
- 检查 DeepSeek 服务状态
- 查看错误日志获取详细信息
