# ChatUI 移动端 Web UI 设计规范（iOS 简洁 + 系统蓝）

> 适用范围：本仓库 ChatUI（移动端 Web / H5 / PWA）。
>
> 目标：统一视觉与交互基线，减少页面间样式漂移；主强调色收敛到 iOS System Blue；仅保留“用户消息气泡”渐变作为个性点缀。

---

## 1. 风格定位（iOS 简洁）

### 1.1 核心原则
- **克制的色彩**：大面积使用白/浅灰，强调色只用于“可交互/选中/关键提示”。
- **轻阴影/轻分割线**：优先 0.5px 分割线或极轻阴影，避免厚重投影。
- **一致的圆角体系**：同一类组件圆角一致，减少页面间不一致。
- **动效克制**：只做必要的 `opacity/transform`，默认支持 `prefers-reduced-motion`。

### 1.2 已确认的项目决策
- **主强调色（Primary/Accent）**：使用 iOS System Blue `#007AFF`
- **渐变策略**：
  - ✅ **仅保留在用户消息气泡**（UserOrder 用户气泡）
  - ❌ 注册页背景/按钮不使用渐变（避免与 iOS 简洁风格冲突）

---

## 2. 设计 Token（建议）

> 说明：Token 先落在全局 CSS 变量（当前在 `src/App.css` 的 `:root`，或可后续迁移到 `src/styles/tokens.css`），页面 CSS 只引用变量，避免硬编码。

### 2.1 颜色（Color）
- Primary（系统蓝）
  - `--adm-color-primary: #007AFF;`
  - `--color-primary-pressed: #0066D6;`
  - `--color-primary-tint: rgba(0, 122, 255, 0.12);`
  - `--focus-ring: rgba(0, 122, 255, 0.35);`

- 中性色（建议）
  - `--color-bg: #f5f5f5;`
  - `--color-surface: #ffffff;`
  - `--color-surface-muted: #f7f7f8;`
  - `--color-text: #111111;`
  - `--color-text-secondary: #565869;`
  - `--color-divider: rgba(0, 0, 0, 0.06);`

- 语义色（不要被“统一主色”误改）
  - `--adm-color-success` / `--adm-color-danger` / `--adm-color-warning` 保持语义用途

### 2.2 圆角（Radius）
- `--radius-card: 12px;`
- `--radius-bubble: 12px;`
- `--radius-pill: 999px;`

### 2.3 阴影（Shadow）
- `--shadow-1: 0 1px 2px rgba(0, 0, 0, 0.08);`
- `--shadow-2: 0 2px 8px rgba(0, 0, 0, 0.10);`

### 2.4 字体（Typography）
- 标题：20–24
- 正文：15
- 辅助：13
- 行高：正文 1.5–1.6

### 2.5 动效（Motion）
- `--t-fast: 120ms;`
- `--t-med: 200ms;`
- `--t-slow: 300ms;`
- reduced motion：
  - `@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.001ms; animation-iteration-count: 1; transition-duration: 0.001ms; } }`

---

## 3. 移动端 Web 布局硬规则（必须遵守）

### 3.1 Safe Area（刘海屏/底部 Home Bar）
- 底部固定区域（如聊天输入框）必须使用：
  - `padding-bottom: calc(env(safe-area-inset-bottom) + Xpx)`

### 3.2 软键盘与 100vh 问题
- 含输入框页面避免只依赖 `height: 100vh`。
- 建议使用 `min-height: 100dvh`（并保留 `100vh` fallback）。

### 3.3 滚动容器分区（UserOrder 强约束）
- 三段式布局：
  1) 顶部导航（固定，不滚动）
  2) 消息区（唯一滚动区域）
  3) 底部输入区（固定，不滚动）

---

## 4. 组件规范（可执行标准）

### 4.1 按钮 Button
- 主要按钮：使用 `--adm-color-primary`（系统蓝），高度建议 44px。
- 触控目标：最小 44×44。
- 状态：default / active / disabled + 可见 focus。

### 4.2 输入框 Input
- 背景：`--color-surface-muted`
- 圆角：建议 16–18（或 pill）
- 禁止输入导致容器宽度变化：容器用固定 `width/min/max`，内部 input 采用 `width: 100%`。

### 4.3 卡片 Card
- 白底 + `--shadow-2` 或者 0.5px 分割线（优先更 iOS）
- 内边距：16

### 4.4 Tabs/Header
- 高度：44–56
- 选中态：使用系统蓝 + 细指示条（不要大块背景色）

### 4.5 消息气泡 Message Bubble
- **仅用户消息气泡保留渐变**：
  - `linear-gradient(135deg, #a4e9c6 0%, #b3a0ff 100%)`
- 其他气泡/强调色：统一使用系统蓝 token（或中性风格）。

---

## 5. 无障碍（WCAG 2.2 AA）

### 5.1 触控目标
- 目标：44×44（尽量所有 icon button 都满足）。

### 5.2 对比度
- 正文对比度 ≥ 4.5:1；大字 ≥ 3:1。
- 白字叠在系统蓝上通常满足，但仍需要验证 active/pressed 颜色。

### 5.3 Focus/键盘可达
- 不移除 outline，改用 `:focus-visible` 显示 focus ring。

### 5.4 Reduced Motion
- 注册页背景动效必须在 `prefers-reduced-motion` 下关闭。

---

## 6. 颜色统一落地步骤（你确认的“上述步骤”）

> 目的：把项目里零散的 `#10a37f / #1677ff / #69c0ff / rgba(22,119,255,0.2)` 收敛到系统蓝体系。

### Step 1：更新全局主色 token
- 编辑：`ChatUI/src/App.css`
- 修改：`--adm-color-primary: #10a37f` → `#007AFF`
- 同时可加入：pressed / tint / focus-ring 变量

### Step 2：清理首页绿色硬编码
- 编辑：`ChatUI/src/pages/Home/Home.css`
- 修改：
  - `.new-chat-btn` 的 `background-color: #10a37f;` → `var(--adm-color-primary)`（或移除覆盖）
  - `.title-icon` 的 `color: #10a37f;` → `var(--adm-color-primary)`

### Step 3：统一非 UserOrder 的蓝色强调为系统蓝
- 编辑：
  - `ChatUI/src/pages/Chat/Chat.css`
  - `ChatUI/src/pages/RoleSelect/RoleSelect.css`
  - `ChatUI/src/pages/MerchantDashboard/MerchantDashboard.css`
  - `ChatUI/src/components/MessageBubble/MessageBubble.css`
- 修改：
  - `#1677ff` → `var(--adm-color-primary)`
  - `rgba(22, 119, 255, 0.2)` → `rgba(0, 122, 255, 0.2)` 或使用 `--color-primary-tint`

### Step 4：收口图表渐变蓝（不引入第二套蓝）
- 编辑：`ChatUI/src/pages/MerchantDashboard/MerchantDashboard.css`
- 修改：
  - `linear-gradient(90deg, #1677ff 0%, #69c0ff 100%)`
  - → `linear-gradient(90deg, var(--adm-color-primary) 0%, rgba(0,122,255,0.35) 100%)`

### Step 5：保留“用户消息气泡”渐变为唯一例外
- 编辑：`ChatUI/src/pages/UserOrder/UserOrder.css`
- 保留：`.message.user .message-bubble` 渐变不改。

---

## 7. 验收 Checklist（改完必须过）

- [ ] 全站 primary/选中态/主按钮统一为系统蓝（antd-mobile primary 与自定义样式一致）。
- [ ] 项目中不再出现“第二套主色”（除 UserOrder 用户气泡渐变外）。
- [ ] 注册页：背景动效在 reduced-motion 下关闭，且不抢视觉焦点。
- [ ] UserOrder：消息区滚动与底部输入区不重叠，safe-area 正常。
- [ ] 触控目标基本满足 44×44；键盘 focus 可见。

---

## 8. 当前硬编码颜色分布（参考，便于查找）

- `#10a37f`
  - `ChatUI/src/App.css`（`--adm-color-primary`）
  - `ChatUI/src/pages/Home/Home.css`（`.new-chat-btn`、`.title-icon`）

- `#1677ff`
  - `ChatUI/src/pages/Chat/Chat.css`（用户气泡）
  - `ChatUI/src/pages/RoleSelect/RoleSelect.css`（卡片边框/图标）
  - `ChatUI/src/pages/MerchantDashboard/MerchantDashboard.css`（高亮/图表）
  - `ChatUI/src/components/MessageBubble/MessageBubble.css`（用户消息气泡）

- `#69c0ff`
  - `ChatUI/src/pages/MerchantDashboard/MerchantDashboard.css`（图表渐变）

- `rgba(22, 119, 255, 0.2)`
  - `ChatUI/src/pages/RoleSelect/RoleSelect.css`（hover 阴影）

- 渐变 `#a4e9c6 → #b3a0ff`
  - ✅ `ChatUI/src/pages/UserOrder/UserOrder.css`（用户消息气泡，唯一保留点）
  - ❌ `ChatUI/src/pages/Register/Register.css`（背景/按钮需要移除渐变）

---

## 9. 多语言布局稳定性规范（2026-02-06新增）

### 9.1 核心原则
确保中英文切换时UI布局保持稳定，避免因文本长度差异导致的布局混乱。

### 9.2 文本截断策略
```css
/* 单行文本截断 */
.text-single-line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* 多行文本截断（标题、产品名称等） */
.text-multi-line {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
}
```

### 9.3 List.Item组件多语言优化
**推荐做法：**
```javascript
// ✅ 使用div + CSS类控制布局，避免Space组件
<List.Item
  className="custom-list-item"
  description={
    <div className="item-description">
      <div className="info-row">{t('label', language)}: {value}</div>
      <div className="info-row time-row">{formatTime(timestamp)}</div>
    </div>
  }
  extra={<div className="item-extra">{statusTag}</div>}
>
  <div className="item-title">{title}</div>
</List.Item>
```

**对应CSS：**
```css
.item-description {
  width: 100%;
}

.info-row {
  display: flex;
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 4px;
  min-height: 19.6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.time-row {
  font-size: 12px;
  color: #999;
}

.item-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
  max-height: 41.6px;
}
```

### 9.4 时间格式化统一标准
```javascript
const formatTime = (dateString) => {
  const date = new Date(dateString);
  const options = {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false // 避免AM/PM造成长度变化
  };
  
  if (language === 'en') {
    return date.toLocaleString('en-US', options).replace(',', '');
  }
  return date.toLocaleString('zh-CN', options);
};
```

### 9.5 布局验证清单
每次涉及文本显示的组件修改后必须验证：
- [ ] 中英文切换时组件高度保持基本一致
- [ ] 超长文本正确显示省略号
- [ ] 时间/日期格式在两种语言下都不换行
- [ ] 不同屏幕宽度(375px-414px)下布局稳定
- [ ] 状态标签、按钮等元素位置保持对齐

### 9.6 示例参考
参考实现：`ChatUI/src/pages/InventoryManagement/InventoryList.js` 及其对应的CSS文件，展示了完整的多语言布局优化方案。
