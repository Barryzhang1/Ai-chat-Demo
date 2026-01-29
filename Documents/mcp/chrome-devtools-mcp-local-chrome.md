# 用 chrome-devtools-mcp 启动并连接本地 Chrome（macOS）

## 目标
- 启动一个开启 Chrome DevTools Protocol (CDP) 的本地 Chrome 实例（远程调试端口）。
- 让 chrome-devtools-mcp 通过 `http://127.0.0.1:<port>` 连接该浏览器，实现：列出页面、导航、点击、填表、执行 JS、截图、性能分析等。

## 前置条件
- macOS 已安装 Google Chrome
- 终端可用 `curl`

## 推荐启动方式（最稳）
说明：直接执行 Chrome 可执行文件时，如果你已经开着 Chrome，系统可能复用已有进程，导致 `--remote-debugging-port` 没生效，看起来“没反应”。

因此推荐用 `open -na` 强制新实例，并指定独立用户目录。

在终端执行：

```bash
open -na "Google Chrome" --args \
  --remote-debugging-address=127.0.0.1 \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-mcp \
  --no-first-run \
  --no-default-browser-check
```

参数解释（简要）：
- `--remote-debugging-port=9222`：CDP 监听端口
- `--remote-debugging-address=127.0.0.1`：只允许本机访问（更安全）
- `--user-data-dir=/tmp/chrome-mcp`：使用独立 Profile，避免污染日常浏览器数据，也能避免“复用进程导致参数不生效”
- `open -na`：`-n` 强制新实例，`-a` 指定应用

启动后表现：
- 终端通常不会输出任何内容（正常现象）
- 会弹出一个新的 Chrome 窗口（使用临时 Profile）

## 验证 CDP 是否启动成功（关键检查）
任选一种方式：

### A. 用 curl 检查版本信息（推荐）
```bash
curl -s http://127.0.0.1:9222/json/version
```

成功标志：
- 返回 JSON
- 里面通常包含 `Browser`、`Protocol-Version`、`webSocketDebuggerUrl` 等字段

### B. 检查端口监听
```bash
lsof -nP -iTCP:9222 -sTCP:LISTEN
```

成功标志：
- 能看到 Chrome 相关进程在监听 `:9222`

## chrome-devtools-mcp 如何连接
核心点：chrome-devtools-mcp 连接的就是这个 CDP HTTP 入口：

- `http://127.0.0.1:9222`（或你自定义的端口）

连接成功后，典型能力包括：
- 列出所有标签页（pages）
- 选择某个页面作为上下文
- 导航到 URL
- 获取页面快照（用于定位元素 uid）
- 点击/输入/按键
- 执行 JavaScript
- 截图、性能 trace、网络请求分析

最小工作流（建议）：
1. 启动 Chrome（见上）
2. `curl http://127.0.0.1:9222/json/version` 确认可用
3. 在 MCP 客户端/IDE 里让 chrome-devtools-mcp 连接 `127.0.0.1:9222`
4. 列出页面 → 选择页面 → 导航 → 交互/调试

## 常见问题排查

### “运行命令没反应 / 终端没输出”
- 正常现象：Chrome 是 GUI 程序，启动后终端通常不打印日志
- 真正要看的不是终端输出，而是：
  - 是否弹出新窗口
  - `curl http://127.0.0.1:9222/json/version` 是否返回 JSON

### 已经开着 Chrome，导致端口没开
现象：
- 你运行 `...Google Chrome --remote-debugging-port=9222` 后，Chrome 看起来没变化
- `curl` 访问 9222 失败

解决：
- 使用本文的 `open -na ... --user-data-dir=...` 启动独立实例（推荐）
- 或先“完全退出 Chrome”（不是关窗口，是菜单 `Chrome -> Quit`），再启动

### 端口被占用
现象：
- `lsof -nP -iTCP:9222 -sTCP:LISTEN` 显示已有进程占用
- 或 MCP 连接失败但端口不是你期望的 Chrome

解决：
- 换端口，例如 9223：

```bash
open -na "Google Chrome" --args \
  --remote-debugging-address=127.0.0.1 \
  --remote-debugging-port=9223 \
  --user-data-dir=/tmp/chrome-mcp
```

- 同时把 MCP 连接地址改为 `http://127.0.0.1:9223`

## 安全注意事项
- 不要把 `--remote-debugging-address` 绑定到 `0.0.0.0`，除非你明确知道风险（会允许局域网访问你的浏览器调试接口）
- 推荐始终使用 `127.0.0.1`

## 停止与清理
- 关闭该 Chrome 实例即可停止监听端口
- 如需清理临时 Profile：

```bash
rm -rf /tmp/chrome-mcp
```
